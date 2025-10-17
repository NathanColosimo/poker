import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

// Start a new hand
export const startNewHand = mutation({
  args: {
    gameId: v.id("games"),
  },
  returns: v.object({
    handId: v.id("hands"),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

    // Get the game
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Verify requester is the game creator
    if (game.creatorId !== userId) {
      throw new Error("Only the game creator can start a new hand");
    }

    // Get current hand to determine next dealer position and hand number
    let nextDealerPosition = 0;
    let nextHandNumber = 1;

    if (game.currentHandId) {
      const currentHand = await ctx.db.get(game.currentHandId);
      if (currentHand && currentHand.currentBettingRound !== "complete") {
        throw new Error("Current hand is not complete");
      }
      if (currentHand) {
        nextHandNumber = currentHand.handNumber + 1;
        // Get all active players to rotate dealer
        const activePlayers = await ctx.db
          .query("players")
          .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
          .filter((q) => q.neq(q.field("status"), "out"))
          .collect();

        const sortedPlayers = activePlayers
          .filter((p) => p.seatPosition !== undefined)
          .sort((a, b) => a.seatPosition! - b.seatPosition!);

        // Find next dealer position
        const currentDealerIndex = sortedPlayers.findIndex(
          (p) => p.seatPosition === currentHand.dealerPosition
        );
        const nextDealerIndex = (currentDealerIndex + 1) % sortedPlayers.length;
        nextDealerPosition = sortedPlayers[nextDealerIndex].seatPosition!;
      }
    }

    // Get all active players
    const activePlayers = await ctx.db
      .query("players")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.neq(q.field("status"), "out"))
      .collect();

    const sortedPlayers = activePlayers
      .filter((p) => p.seatPosition !== undefined)
      .sort((a, b) => a.seatPosition! - b.seatPosition!);

    if (sortedPlayers.length < 2) {
      throw new Error("Need at least 2 active players to start a hand");
    }

    // Create new hand
    const handId = await ctx.db.insert("hands", {
      gameId: args.gameId,
      handNumber: nextHandNumber,
      dealerPosition: nextDealerPosition,
      currentBettingRound: "pre-flop" as const,
      pot: 0,
      currentBet: game.settings.bigBlind,
    });

    // Update game with new current hand
    await ctx.db.patch(args.gameId, {
      currentHandId: handId,
    });

    // Initialize player hand states
    for (const player of sortedPlayers) {
      await ctx.db.insert("playerHandStates", {
        handId,
        playerId: player._id,
        currentBet: 0,
        totalBet: 0,
        status: "active" as const,
        hasActed: false,
      });

      // Update player status to active
      await ctx.db.patch(player._id, {
        status: "active" as const,
      });
    }

    // Post blinds
    const dealerIndex = sortedPlayers.findIndex(
      (p) => p.seatPosition === nextDealerPosition
    );
    const smallBlindIndex = (dealerIndex + 1) % sortedPlayers.length;
    const bigBlindIndex = (dealerIndex + 2) % sortedPlayers.length;

    const smallBlindPlayer = sortedPlayers[smallBlindIndex];
    const bigBlindPlayer = sortedPlayers[bigBlindIndex];

    // Post small blind
    const sbAmount = Math.min(game.settings.smallBlind, smallBlindPlayer.chips);
    const sbHandState = await ctx.db
      .query("playerHandStates")
      .withIndex("by_handId_and_playerId", (q) =>
        q.eq("handId", handId).eq("playerId", smallBlindPlayer._id)
      )
      .unique();
    if (!sbHandState) {
      throw new Error("Small blind player hand state not found");
    }
    await ctx.db.patch(sbHandState._id, {
      currentBet: sbAmount,
      totalBet: sbAmount,
      status: sbAmount === smallBlindPlayer.chips ? ("all-in" as const) : ("active" as const),
    });
    await ctx.db.patch(smallBlindPlayer._id, {
      chips: smallBlindPlayer.chips - sbAmount,
      status: sbAmount === smallBlindPlayer.chips ? ("all-in" as const) : ("active" as const),
    });

    // Post big blind
    const bbAmount = Math.min(game.settings.bigBlind, bigBlindPlayer.chips);
    const bbHandState = await ctx.db
      .query("playerHandStates")
      .withIndex("by_handId_and_playerId", (q) =>
        q.eq("handId", handId).eq("playerId", bigBlindPlayer._id)
      )
      .unique();
    if (!bbHandState) {
      throw new Error("Big blind player hand state not found");
    }
    await ctx.db.patch(bbHandState._id, {
      currentBet: bbAmount,
      totalBet: bbAmount,
      status: bbAmount === bigBlindPlayer.chips ? ("all-in" as const) : ("active" as const),
    });
    await ctx.db.patch(bigBlindPlayer._id, {
      chips: bigBlindPlayer.chips - bbAmount,
      status: bbAmount === bigBlindPlayer.chips ? ("all-in" as const) : ("active" as const),
    });

    // Update pot
    const totalBlinds = sbAmount + bbAmount;
    await ctx.db.patch(handId, {
      pot: totalBlinds,
    });

    // Set first active player (after big blind)
    const firstPlayerIndex = (dealerIndex + 3) % sortedPlayers.length;
    await ctx.db.patch(handId, {
      activePlayerPosition: sortedPlayers[firstPlayerIndex].seatPosition,
    });

    return { handId };
  },
});

// Player commits their action (bet/call/raise/fold/all-in)
export const commitAction = mutation({
  args: {
    handId: v.id("hands"),
    amount: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

    // Get the hand
    const hand = await ctx.db.get(args.handId);
    if (!hand) {
      throw new Error("Hand not found");
    }

    // Get the game
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
      throw new Error("Player not found in this game");
    }

    // Verify it's this player's turn
    if (hand.activePlayerPosition !== player.seatPosition) {
      throw new Error("It's not your turn");
    }

    // Get player's hand state
    const playerHandState = await ctx.db
      .query("playerHandStates")
      .withIndex("by_handId_and_playerId", (q) =>
        q.eq("handId", args.handId).eq("playerId", player._id)
      )
      .unique();

    if (!playerHandState) {
      throw new Error("Player hand state not found");
    }

    // Validate action based on amount
    const amountToCall = hand.currentBet - playerHandState.currentBet;

    if (args.amount === 0) {
      // Fold
      await ctx.db.patch(playerHandState._id, {
        status: "folded" as const,
        hasActed: true,
      });
      await ctx.db.patch(player._id, {
        status: "folded" as const,
      });
    } else {
      // Check if player has enough chips
      if (args.amount > player.chips) {
        throw new Error("Not enough chips");
      }

      // Determine if this is a call, raise, or all-in
      const isAllIn = args.amount === player.chips;
      const isCall = args.amount === amountToCall;
      const isRaise = args.amount > amountToCall;

      if (!isCall && !isRaise && !isAllIn) {
        throw new Error("Invalid bet amount. Must call, raise, or go all-in");
      }

      if (isRaise && !isAllIn) {
        // Validate raise amount
        const minRaise = amountToCall + game.settings.bettingIncrement;
        if (args.amount < minRaise) {
          throw new Error(
            `Raise must be at least ${minRaise} (call ${amountToCall} + min raise ${game.settings.bettingIncrement})`
          );
        }
      }

      // Update player's hand state
      const newCurrentBet = playerHandState.currentBet + args.amount;
      const newTotalBet = playerHandState.totalBet + args.amount;

      await ctx.db.patch(playerHandState._id, {
        currentBet: newCurrentBet,
        totalBet: newTotalBet,
        status: isAllIn ? ("all-in" as const) : ("active" as const),
        hasActed: true,
      });

      // Update player's chips
      await ctx.db.patch(player._id, {
        chips: player.chips - args.amount,
        status: isAllIn ? ("all-in" as const) : ("active" as const),
      });

      // Update pot
      await ctx.db.patch(args.handId, {
        pot: hand.pot + args.amount,
      });

      // If this is a raise, update current bet and reset hasActed for others
      if (newCurrentBet > hand.currentBet) {
        await ctx.db.patch(args.handId, {
          currentBet: newCurrentBet,
        });

        // Reset hasActed for all other active players
        const allHandStates = await ctx.db
          .query("playerHandStates")
          .withIndex("by_handId", (q) => q.eq("handId", args.handId))
          .collect();

        for (const state of allHandStates) {
          if (
            state._id !== playerHandState._id &&
            state.status !== "folded" &&
            state.status !== "all-in"
          ) {
            await ctx.db.patch(state._id, {
              hasActed: false,
            });
          }
        }
      }
    }

    // Move to next active player
    const allPlayers = await ctx.db
      .query("players")
      .withIndex("by_gameId", (q) => q.eq("gameId", hand.gameId))
      .collect();

    const sortedPlayers = allPlayers
      .filter((p) => p.seatPosition !== undefined)
      .sort((a, b) => a.seatPosition! - b.seatPosition!);

    const currentPlayerIndex = sortedPlayers.findIndex(
      (p) => p.seatPosition === player.seatPosition
    );

    // Find next active player
    let nextPlayerIndex = (currentPlayerIndex + 1) % sortedPlayers.length;
    let nextPlayer = sortedPlayers[nextPlayerIndex];
    let attempts = 0;

    while (
      (nextPlayer.status === "folded" ||
        nextPlayer.status === "all-in" ||
        nextPlayer.status === "out") &&
      attempts < sortedPlayers.length
    ) {
      nextPlayerIndex = (nextPlayerIndex + 1) % sortedPlayers.length;
      nextPlayer = sortedPlayers[nextPlayerIndex];
      attempts++;
    }

    // Check if betting round is complete
    const allHandStates = await ctx.db
      .query("playerHandStates")
      .withIndex("by_handId", (q) => q.eq("handId", args.handId))
      .collect();

    const activeStates = allHandStates.filter(
      (s) => s.status !== "folded" && s.status !== "all-in"
    );

    const allActed = activeStates.every((s) => s.hasActed);
    const allBetsMatched = activeStates.every(
      (s) => s.currentBet === hand.currentBet || s.status === "all-in"
    );

    if (allActed && allBetsMatched) {
      // Betting round complete, advance to next round
      await advanceBettingRoundInternal(ctx, args.handId);
    } else {
      // Set next active player
      await ctx.db.patch(args.handId, {
        activePlayerPosition: nextPlayer.seatPosition,
      });
    }

    return null;
  },
});

// Internal function to advance betting round
async function advanceBettingRoundInternal(
  ctx: any,
  handId: Id<"hands">
): Promise<void> {
  const hand = await ctx.db.get(handId);
  if (!hand) {
    throw new Error("Hand not found");
  }

  // Check if only one player remains (all others folded)
  const allHandStates = await ctx.db
    .query("playerHandStates")
    .withIndex("by_handId", (q: any) => q.eq("handId", handId))
    .collect();

  const activePlayers = allHandStates.filter(
    (s: any) => s.status !== "folded"
  );

  if (activePlayers.length === 1) {
    // Only one player left, they win
    await ctx.db.patch(handId, {
      currentBettingRound: "complete" as const,
      activePlayerPosition: undefined,
    });
    return;
  }

  // Determine next betting round
  const roundOrder = ["pre-flop", "flop", "turn", "river", "complete"];
  const currentIndex = roundOrder.indexOf(hand.currentBettingRound);
  const nextRound = roundOrder[currentIndex + 1];

  await ctx.db.patch(handId, {
    currentBettingRound: nextRound as any,
    currentBet: 0,
  });

  if (nextRound === "complete") {
    // Hand complete
    await ctx.db.patch(handId, {
      activePlayerPosition: undefined,
    });
    return;
  }

  // Reset hasActed and currentBet for all active players
  for (const state of allHandStates) {
    if (state.status !== "folded" && state.status !== "all-in") {
      await ctx.db.patch(state._id, {
        hasActed: false,
        currentBet: 0,
      });
    }
  }

  // Set first active player after dealer for new round
  const game = await ctx.db.get(hand.gameId);
  if (!game) return;

  const allPlayers = await ctx.db
    .query("players")
    .withIndex("by_gameId", (q: any) => q.eq("gameId", hand.gameId))
    .collect();

  const sortedPlayers = allPlayers
    .filter((p: any) => p.seatPosition !== undefined)
    .sort((a: any, b: any) => a.seatPosition! - b.seatPosition!);

  const dealerIndex = sortedPlayers.findIndex(
    (p: any) => p.seatPosition === hand.dealerPosition
  );

  // First player after dealer
  let firstPlayerIndex = (dealerIndex + 1) % sortedPlayers.length;
  let firstPlayer = sortedPlayers[firstPlayerIndex];
  let attempts = 0;

  while (
    (firstPlayer.status === "folded" ||
      firstPlayer.status === "all-in" ||
      firstPlayer.status === "out") &&
    attempts < sortedPlayers.length
  ) {
    firstPlayerIndex = (firstPlayerIndex + 1) % sortedPlayers.length;
    firstPlayer = sortedPlayers[firstPlayerIndex];
    attempts++;
  }

  await ctx.db.patch(handId, {
    activePlayerPosition: firstPlayer.seatPosition,
  });
}

// Internal mutation to advance betting round (called after all players acted)
export const advanceBettingRound = internalMutation({
  args: {
    handId: v.id("hands"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await advanceBettingRoundInternal(ctx, args.handId);
    return null;
  },
});

