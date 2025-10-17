import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Create a new game with settings and invite code
export const createGame = mutation({
  args: {
    inviteCode: v.string(),
    initialChips: v.number(),
    smallBlind: v.number(),
    bigBlind: v.number(),
    bettingIncrement: v.number(),
  },
  returns: v.object({
    gameId: v.id("games"),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to create a game");
    }

    // Check if invite code is already in use
    const existingGame = await ctx.db
      .query("games")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", args.inviteCode))
      .first();

    if (existingGame) {
      throw new Error("Invite code already in use. Please choose another.");
    }

    // Create the game
    const gameId = await ctx.db.insert("games", {
      inviteCode: args.inviteCode,
      creatorId: userId,
      status: "lobby" as const,
      settings: {
        initialChips: args.initialChips,
        smallBlind: args.smallBlind,
        bigBlind: args.bigBlind,
        bettingIncrement: args.bettingIncrement,
      },
    });

    // Automatically add creator as first player (approved)
    await ctx.db.insert("players", {
      gameId,
      userId,
      chips: args.initialChips,
      status: "approved" as const,
    });

    return { gameId };
  },
});

// Request to join a game via invite code
export const joinGameRequest = mutation({
  args: {
    inviteCode: v.string(),
  },
  returns: v.object({
    gameId: v.id("games"),
    playerId: v.id("players"),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to join a game");
    }

    // Find game by invite code
    const game = await ctx.db
      .query("games")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", args.inviteCode))
      .first();

    if (!game) {
      throw new Error("Game not found with that invite code");
    }

    // Check if game is still in lobby
    if (game.status !== "lobby") {
      throw new Error("Game has already started");
    }

    // Check if player is already in this game
    const existingPlayer = await ctx.db
      .query("players")
      .withIndex("by_gameId_and_userId", (q) =>
        q.eq("gameId", game._id).eq("userId", userId)
      )
      .first();

    if (existingPlayer) {
      throw new Error("You have already requested to join this game");
    }

    // Create pending player entry
    const playerId = await ctx.db.insert("players", {
      gameId: game._id,
      userId,
      chips: game.settings.initialChips,
      status: "pending" as const,
    });

    return { gameId: game._id, playerId };
  },
});

// Approve a pending join request
export const approveJoinRequest = mutation({
  args: {
    playerId: v.id("players"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

    // Get the player being approved
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    // Get the game
    const game = await ctx.db.get(player.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Verify requester is the game creator
    if (game.creatorId !== userId) {
      throw new Error("Only the game creator can approve join requests");
    }

    // Update player status to approved
    await ctx.db.patch(args.playerId, {
      status: "approved" as const,
    });

    return null;
  },
});

// Reject a pending join request
export const rejectJoinRequest = mutation({
  args: {
    playerId: v.id("players"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

    // Get the player being rejected
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    // Get the game
    const game = await ctx.db.get(player.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Verify requester is the game creator
    if (game.creatorId !== userId) {
      throw new Error("Only the game creator can reject join requests");
    }

    // Delete the player entry
    await ctx.db.delete(args.playerId);

    return null;
  },
});

// Set player seating order
export const setPlayerOrder = mutation({
  args: {
    gameId: v.id("games"),
    playerOrder: v.array(
      v.object({
        playerId: v.id("players"),
        seatPosition: v.number(),
      })
    ),
  },
  returns: v.null(),
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
      throw new Error("Only the game creator can set player order");
    }

    // Verify game is in lobby or ordering status
    if (game.status !== "lobby" && game.status !== "ordering") {
      throw new Error("Cannot change player order after game has started");
    }

    // Update each player's seat position
    for (const { playerId, seatPosition } of args.playerOrder) {
      const player = await ctx.db.get(playerId);
      if (!player || player.gameId !== args.gameId) {
        throw new Error(`Invalid player ID: ${playerId}`);
      }
      
      await ctx.db.patch(playerId, {
        seatPosition,
      });
    }

    // Update game status to ordering if it was in lobby
    if (game.status === "lobby") {
      await ctx.db.patch(args.gameId, {
        status: "ordering" as const,
      });
    }

    return null;
  },
});

// Start the game (transition to active and start first hand)
export const startGame = mutation({
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
      throw new Error("Only the game creator can start the game");
    }

    // Verify game is in ordering status
    if (game.status !== "ordering") {
      throw new Error("Game must be in ordering status to start");
    }

    // Get all approved players with seat positions
    const players = await ctx.db
      .query("players")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();

    // Verify all players have seat positions
    const playersWithSeats = players.filter((p) => p.seatPosition !== undefined);
    if (playersWithSeats.length < 2) {
      throw new Error("Need at least 2 players with assigned seats to start");
    }

    // Update game status to active
    await ctx.db.patch(args.gameId, {
      status: "active" as const,
    });

    // Start first hand at position 0
    const handId = await ctx.db.insert("hands", {
      gameId: args.gameId,
      handNumber: 1,
      dealerPosition: 0,
      currentBettingRound: "pre-flop" as const,
      pot: 0,
      currentBet: 0,
      activePlayerPosition: undefined,
    });

    // Update game with current hand
    await ctx.db.patch(args.gameId, {
      currentHandId: handId,
    });

    // Initialize player hand states and collect blinds
    // We'll handle blind posting logic in the hands.ts file
    // For now, just create the hand and return its ID
    return { handId };
  },
});

