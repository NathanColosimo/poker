import { v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

/**
 * Start a new hand (creator only)
 */
export const startNewHand = mutation({
  args: {
    gameId: v.id("games"),
  },
  returns: v.id("hands"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Only creator can start hands
    if (game.creatorId !== userId) {
      throw new Error("Only the game creator can start a new hand");
    }

    // Game must be in ordering or active status
    if (game.status !== "ordering" && game.status !== "active") {
      throw new Error("Cannot start a hand in current game state");
    }

    // Get all approved players with seat positions
    const players = await ctx.db
      .query("players")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();

    const seatedPlayers = players.filter((p) => p.seatPosition !== undefined);

    if (seatedPlayers.length < 2) {
      throw new Error("Need at least 2 players to start a hand");
    }

    // Determine dealer position
    let dealerPosition = 0;
    if (game.currentHandId) {
      // Get previous hand to rotate dealer
      const previousHand = await ctx.db.get(game.currentHandId);
      if (previousHand) {
        // Find next dealer position
        const currentDealerPos = previousHand.dealerPosition;
        const sortedPositions = seatedPlayers
          .map((p) => p.seatPosition!)
          .sort((a, b) => a - b);
        
        const currentIndex = sortedPositions.indexOf(currentDealerPos);
        const nextIndex = (currentIndex + 1) % sortedPositions.length;
        dealerPosition = sortedPositions[nextIndex];
      }
    } else {
      // First hand - dealer is seat 0 or lowest seat
      dealerPosition = Math.min(...seatedPlayers.map((p) => p.seatPosition!));
    }

    // Get hand number
    const previousHands = await ctx.db
      .query("hands")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();
    const handNumber = previousHands.length + 1;

    // Create the hand
    const handId = await ctx.db.insert("hands", {
      gameId: args.gameId,
      handNumber,
      dealerPosition,
      currentBettingRound: "pre-flop",
      pot: 0,
      currentBet: 0,
      activePlayerPosition: dealerPosition, // Will be updated after blinds
    });

    // Update game status and current hand
    await ctx.db.patch(args.gameId, {
      status: "active",
      currentHandId: handId,
    });

    // Initialize player hand states and collect blinds
    await ctx.runMutation(internal.hands.initializeHandStates, {
      handId,
      gameId: args.gameId,
      dealerPosition,
    });

    return handId;
  },
});

/**
 * Initialize player hand states and collect blinds (internal)
 */
export const initializeHandStates = internalMutation({
  args: {
    handId: v.id("hands"),
    gameId: v.id("games"),
    dealerPosition: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Get all active players in order
    const players = await ctx.db
      .query("players")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();

    const seatedPlayers = players
      .filter((p) => p.seatPosition !== undefined)
      .sort((a, b) => a.seatPosition! - b.seatPosition!);

    if (seatedPlayers.length < 2) {
      throw new Error("Need at least 2 players");
    }

    // Find small blind and big blind positions
    const dealerIndex = seatedPlayers.findIndex(
      (p) => p.seatPosition === args.dealerPosition
    );
    const smallBlindIndex = (dealerIndex + 1) % seatedPlayers.length;
    const bigBlindIndex = (dealerIndex + 2) % seatedPlayers.length;

    const smallBlindPlayer = seatedPlayers[smallBlindIndex];
    const bigBlindPlayer = seatedPlayers[bigBlindIndex];

    let pot = 0;
    let currentBet = 0;

    // Create hand states for all players
    for (const player of seatedPlayers) {
      let initialBet = 0;
      let status: "waiting" | "active" | "folded" | "all-in" = "waiting";

      // Collect small blind
      if (player._id === smallBlindPlayer._id) {
        initialBet = Math.min(game.settings.smallBlind, player.chips);
        pot += initialBet;
        await ctx.db.patch(player._id, {
          chips: player.chips - initialBet,
          status: initialBet >= player.chips ? "all-in" : "active",
        });
        status = initialBet >= player.chips ? "all-in" : "waiting";
      }
      // Collect big blind
      else if (player._id === bigBlindPlayer._id) {
        initialBet = Math.min(game.settings.bigBlind, player.chips);
        pot += initialBet;
        currentBet = initialBet;
        await ctx.db.patch(player._id, {
          chips: player.chips - initialBet,
          status: initialBet >= player.chips ? "all-in" : "active",
        });
        status = initialBet >= player.chips ? "all-in" : "waiting";
      }
      // Other players
      else {
        await ctx.db.patch(player._id, {
          status: "active",
        });
      }

      // Create player hand state
      await ctx.db.insert("playerHandStates", {
        handId: args.handId,
        playerId: player._id,
        currentBet: initialBet,
        totalBet: initialBet,
        status,
        hasActed: false,
      });
    }

    // Update hand with pot and current bet
    // First to act is after big blind
    const firstToActIndex = (bigBlindIndex + 1) % seatedPlayers.length;
    const firstToActPlayer = seatedPlayers[firstToActIndex];

    await ctx.db.patch(args.handId, {
      pot,
      currentBet,
      activePlayerPosition: firstToActPlayer.seatPosition!,
    });

    return null;
  },
});

/**
 * Commit a betting action (bet, call, raise, fold, all-in)
 */
export const commitAction = mutation({
  args: {
    handId: v.id("hands"),
    betAmount: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const hand = await ctx.db.get(args.handId);
    if (!hand) {
      throw new Error("Hand not found");
    }

    const game = await ctx.db.get(hand.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Get current player
    const player = await ctx.db
      .query("players")
      .withIndex("by_gameId_and_userId", (q) =>
        q.eq("gameId", hand.gameId).eq("userId", userId)
      )
      .first();

    if (!player) {
      throw new Error("Player not found");
    }

    // Verify it's this player's turn
    if (player.seatPosition !== hand.activePlayerPosition) {
      throw new Error("Not your turn");
    }

    // Get player hand state
    const playerState = await ctx.db
      .query("playerHandStates")
      .withIndex("by_handId_and_playerId", (q) =>
        q.eq("handId", args.handId).eq("playerId", player._id)
      )
      .first();

    if (!playerState) {
      throw new Error("Player hand state not found");
    }

    // Validate action
    const amountToCall = hand.currentBet - playerState.currentBet;
    
    // Fold (betAmount = 0)
    if (args.betAmount === 0) {
      await ctx.db.patch(playerState._id, {
        status: "folded",
        hasActed: true,
      });
      await ctx.db.patch(player._id, {
        status: "folded",
      });
    }
    // Call or Raise
    else {
      const actualBet = Math.min(args.betAmount, player.chips);
      const newCurrentBet = playerState.currentBet + actualBet;

      // Update player chips
      await ctx.db.patch(player._id, {
        chips: player.chips - actualBet,
        status: actualBet >= player.chips ? "all-in" : "active",
      });

      // Update pot
      await ctx.db.patch(args.handId, {
        pot: hand.pot + actualBet,
        currentBet: Math.max(hand.currentBet, newCurrentBet),
      });

      // Update player hand state
      await ctx.db.patch(playerState._id, {
        currentBet: newCurrentBet,
        totalBet: playerState.totalBet + actualBet,
        status: actualBet >= player.chips ? "all-in" : "waiting",
        hasActed: true,
      });
    }

    // Move to next player
    await ctx.runMutation(internal.hands.moveToNextPlayer, {
      handId: args.handId,
    });

    return null;
  },
});

/**
 * Move to the next active player (internal)
 */
export const moveToNextPlayer = internalMutation({
  args: {
    handId: v.id("hands"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const hand = await ctx.db.get(args.handId);
    if (!hand) {
      throw new Error("Hand not found");
    }

    // Get all players in the hand
    const players = await ctx.db
      .query("players")
      .withIndex("by_gameId", (q) => q.eq("gameId", hand.gameId))
      .collect();

    const seatedPlayers = players
      .filter((p) => p.seatPosition !== undefined)
      .sort((a, b) => a.seatPosition! - b.seatPosition!);

    const currentPlayerIndex = seatedPlayers.findIndex(
      (p) => p.seatPosition === hand.activePlayerPosition
    );

    // Find next player who can act
    let nextPlayerIndex = currentPlayerIndex;
    let foundNextPlayer = false;

    for (let i = 1; i <= seatedPlayers.length; i++) {
      nextPlayerIndex = (currentPlayerIndex + i) % seatedPlayers.length;
      const nextPlayer = seatedPlayers[nextPlayerIndex];

      if (nextPlayer.status === "active") {
        foundNextPlayer = true;
        break;
      }
    }

    if (foundNextPlayer) {
      const nextPlayer = seatedPlayers[nextPlayerIndex];
      await ctx.db.patch(args.handId, {
        activePlayerPosition: nextPlayer.seatPosition!,
      });

      // Check if betting round is complete
      await ctx.runMutation(internal.hands.checkBettingRoundComplete, {
        handId: args.handId,
      });
    } else {
      // No more active players, hand is over
      await ctx.runMutation(internal.hands.completeHand, {
        handId: args.handId,
      });
    }

    return null;
  },
});

/**
 * Check if betting round is complete and advance if needed (internal)
 */
export const checkBettingRoundComplete = internalMutation({
  args: {
    handId: v.id("hands"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const hand = await ctx.db.get(args.handId);
    if (!hand) {
      return null;
    }

    // Get all player hand states
    const playerStates = await ctx.db
      .query("playerHandStates")
      .withIndex("by_handId", (q) => q.eq("handId", args.handId))
      .collect();

    const activePlayers = playerStates.filter(
      (s) => s.status !== "folded" && s.status !== "all-in"
    );

    // Check if all active players have acted and matched the current bet
    const allActed = activePlayers.every((s) => s.hasActed);
    const allMatched = activePlayers.every((s) => s.currentBet === hand.currentBet);

    if (allActed && allMatched) {
      // Advance betting round
      await ctx.runMutation(internal.hands.advanceBettingRound, {
        handId: args.handId,
      });
    }

    return null;
  },
});

/**
 * Advance to the next betting round (internal)
 */
export const advanceBettingRound = internalMutation({
  args: {
    handId: v.id("hands"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const hand = await ctx.db.get(args.handId);
    if (!hand) {
      return null;
    }

    const nextRound = {
      "pre-flop": "flop",
      flop: "turn",
      turn: "river",
      river: "complete",
      complete: "complete",
    }[hand.currentBettingRound] as "pre-flop" | "flop" | "turn" | "river" | "complete";

    if (nextRound === "complete") {
      await ctx.runMutation(internal.hands.completeHand, {
        handId: args.handId,
      });
      return null;
    }

    // Reset player states for new round
    const playerStates = await ctx.db
      .query("playerHandStates")
      .withIndex("by_handId", (q) => q.eq("handId", args.handId))
      .collect();

    for (const state of playerStates) {
      if (state.status !== "folded" && state.status !== "all-in") {
        await ctx.db.patch(state._id, {
          currentBet: 0,
          hasActed: false,
        });
      }
    }

    // Update hand
    await ctx.db.patch(args.handId, {
      currentBettingRound: nextRound,
      currentBet: 0,
    });

    // Set first player to act (after dealer)
    const players = await ctx.db
      .query("players")
      .withIndex("by_gameId", (q) => q.eq("gameId", hand.gameId))
      .collect();

    const seatedPlayers = players
      .filter((p) => p.seatPosition !== undefined && p.status === "active")
      .sort((a, b) => a.seatPosition! - b.seatPosition!);

    if (seatedPlayers.length > 0) {
      const dealerIndex = seatedPlayers.findIndex(
        (p) => p.seatPosition === hand.dealerPosition
      );
      const firstToActIndex = (dealerIndex + 1) % seatedPlayers.length;
      const firstToActPlayer = seatedPlayers[firstToActIndex];

      await ctx.db.patch(args.handId, {
        activePlayerPosition: firstToActPlayer.seatPosition!,
      });
    }

    return null;
  },
});

/**
 * Complete the hand (internal)
 */
export const completeHand = internalMutation({
  args: {
    handId: v.id("hands"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const hand = await ctx.db.get(args.handId);
    if (!hand) {
      return null;
    }

    // Mark hand as complete
    await ctx.db.patch(args.handId, {
      currentBettingRound: "complete",
    });

    // Note: Pot distribution would happen here in a real app
    // For this chip tracker, users handle the actual poker results manually

    return null;
  },
});

