import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Generate a random 6-character invite code
 */
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude similar-looking characters
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a new poker game with custom settings
 */
export const createGame = mutation({
  args: {
    initialChips: v.number(),
    smallBlind: v.number(),
    bigBlind: v.number(),
    bettingIncrement: v.number(),
  },
  returns: v.object({
    gameId: v.id("games"),
    inviteCode: v.string(),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Validate settings
    if (args.initialChips <= 0) {
      throw new Error("Initial chips must be positive");
    }
    if (args.smallBlind <= 0 || args.bigBlind <= 0) {
      throw new Error("Blinds must be positive");
    }
    if (args.bigBlind <= args.smallBlind) {
      throw new Error("Big blind must be greater than small blind");
    }
    if (args.bettingIncrement <= 0) {
      throw new Error("Betting increment must be positive");
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let attempts = 0;
    let isUnique = false;
    
    while (!isUnique && attempts < 10) {
      // Check if code exists in active games
      const existing = await ctx.db
        .query("games")
        .withIndex("by_inviteCode", (q) => q.eq("inviteCode", inviteCode))
        .filter((q) =>
          q.or(
            q.eq(q.field("status"), "lobby"),
            q.eq(q.field("status"), "ordering"),
            q.eq(q.field("status"), "active")
          )
        )
        .first();
      
      if (!existing) {
        isUnique = true;
      } else {
        inviteCode = generateInviteCode();
        attempts++;
      }
    }
    
    if (!isUnique) {
      throw new Error("Failed to generate unique invite code");
    }

    // Create the game
    const gameId = await ctx.db.insert("games", {
      inviteCode,
      creatorId: userId,
      status: "lobby",
      settings: {
        initialChips: args.initialChips,
        smallBlind: args.smallBlind,
        bigBlind: args.bigBlind,
        bettingIncrement: args.bettingIncrement,
      },
    });

    // Add creator as first player (auto-approved)
    await ctx.db.insert("players", {
      gameId,
      userId,
      chips: args.initialChips,
      status: "approved",
    });

    return { gameId, inviteCode };
  },
});

/**
 * Join a game using an invite code (creates a join request)
 */
export const joinGame = mutation({
  args: {
    inviteCode: v.string(),
  },
  returns: v.id("games"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Find the game with this invite code
    const game = await ctx.db
      .query("games")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", args.inviteCode.toUpperCase()))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "lobby"),
          q.eq(q.field("status"), "ordering")
        )
      )
      .first();

    if (!game) {
      throw new Error("Game not found or no longer accepting players");
    }

    // Check if user is already in this game
    const existingPlayer = await ctx.db
      .query("players")
      .withIndex("by_gameId_and_userId", (q) => 
        q.eq("gameId", game._id).eq("userId", userId)
      )
      .first();

    if (existingPlayer) {
      // Already in the game, just return the game ID
      return game._id;
    }

    // Create a pending join request
    await ctx.db.insert("players", {
      gameId: game._id,
      userId,
      chips: game.settings.initialChips,
      status: "pending",
    });

    return game._id;
  },
});

/**
 * Approve a pending join request (creator only)
 */
export const approveJoinRequest = mutation({
  args: {
    playerId: v.id("players"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    const game = await ctx.db.get(player.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Only creator can approve
    if (game.creatorId !== userId) {
      throw new Error("Only the game creator can approve join requests");
    }

    // Game must be in lobby or ordering status
    if (game.status !== "lobby" && game.status !== "ordering") {
      throw new Error("Cannot approve players after game has started");
    }

    // Update player status
    await ctx.db.patch(args.playerId, {
      status: "approved",
    });

    return null;
  },
});

/**
 * Reject a pending join request (creator only)
 */
export const rejectJoinRequest = mutation({
  args: {
    playerId: v.id("players"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    const game = await ctx.db.get(player.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Only creator can reject
    if (game.creatorId !== userId) {
      throw new Error("Only the game creator can reject join requests");
    }

    // Remove the player
    await ctx.db.delete(args.playerId);

    return null;
  },
});

/**
 * Set player order before starting the game (creator only)
 */
export const setPlayerOrder = mutation({
  args: {
    gameId: v.id("games"),
    playerOrder: v.array(v.object({
      playerId: v.id("players"),
      seatPosition: v.number(),
    })),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Only creator can set order
    if (game.creatorId !== userId) {
      throw new Error("Only the game creator can arrange players");
    }

    // Game must be in lobby or ordering status
    if (game.status !== "lobby" && game.status !== "ordering") {
      throw new Error("Cannot arrange players after game has started");
    }

    // Update each player's seat position
    for (const { playerId, seatPosition } of args.playerOrder) {
      await ctx.db.patch(playerId, { seatPosition });
    }

    // Move game to ordering status if it was in lobby
    if (game.status === "lobby") {
      await ctx.db.patch(args.gameId, { status: "ordering" });
    }

    return null;
  },
});

/**
 * Get a game by invite code
 */
export const getGameByInviteCode = query({
  args: {
    inviteCode: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("games"),
      _creationTime: v.number(),
      inviteCode: v.string(),
      creatorId: v.id("users"),
      status: v.union(
        v.literal("lobby"),
        v.literal("ordering"),
        v.literal("active"),
        v.literal("finished")
      ),
      settings: v.object({
        initialChips: v.number(),
        smallBlind: v.number(),
        bigBlind: v.number(),
        bettingIncrement: v.number(),
      }),
      currentHandId: v.optional(v.id("hands")),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", args.inviteCode.toUpperCase()))
      .first();
    
    return game || null;
  },
});

/**
 * Get a game by ID
 */
export const getGame = query({
  args: {
    gameId: v.id("games"),
  },
  returns: v.union(
    v.object({
      _id: v.id("games"),
      _creationTime: v.number(),
      inviteCode: v.string(),
      creatorId: v.id("users"),
      status: v.union(
        v.literal("lobby"),
        v.literal("ordering"),
        v.literal("active"),
        v.literal("finished")
      ),
      settings: v.object({
        initialChips: v.number(),
        smallBlind: v.number(),
        bigBlind: v.number(),
        bettingIncrement: v.number(),
      }),
      currentHandId: v.optional(v.id("hands")),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.gameId);
  },
});

/**
 * Cancel a game and set status to finished (creator only)
 */
export const cancelGame = mutation({
  args: {
    gameId: v.id("games"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Only creator can cancel the game
    if (game.creatorId !== userId) {
      throw new Error("Only the game creator can cancel the game");
    }

    // Update game status to finished
    await ctx.db.patch(args.gameId, { status: "finished" });

    return null;
  },
});

