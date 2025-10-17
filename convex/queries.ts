import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Get all players in a game
 */
export const getGamePlayers = query({
  args: {
    gameId: v.id("games"),
  },
  returns: v.array(
    v.object({
      _id: v.id("players"),
      _creationTime: v.number(),
      gameId: v.id("games"),
      userId: v.id("users"),
      chips: v.number(),
      seatPosition: v.optional(v.number()),
      status: v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("active"),
        v.literal("folded"),
        v.literal("all-in"),
        v.literal("out")
      ),
    })
  ),
  handler: async (ctx, args) => {
    const players = await ctx.db
      .query("players")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();
    
    return players;
  },
});

/**
 * Get pending join requests for a game (creator only)
 */
export const getPendingRequests = query({
  args: {
    gameId: v.id("games"),
  },
  returns: v.array(
    v.object({
      _id: v.id("players"),
      _creationTime: v.number(),
      gameId: v.id("games"),
      userId: v.id("users"),
      chips: v.number(),
      seatPosition: v.optional(v.number()),
      status: v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("active"),
        v.literal("folded"),
        v.literal("all-in"),
        v.literal("out")
      ),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      return [];
    }

    // Only creator can see pending requests
    if (game.creatorId !== userId) {
      return [];
    }

    const pendingPlayers = await ctx.db
      .query("players")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
    
    return pendingPlayers;
  },
});

/**
 * Get the current user's player state in a game
 */
export const getMyPlayerState = query({
  args: {
    gameId: v.id("games"),
  },
  returns: v.union(
    v.object({
      _id: v.id("players"),
      _creationTime: v.number(),
      gameId: v.id("games"),
      userId: v.id("users"),
      chips: v.number(),
      seatPosition: v.optional(v.number()),
      status: v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("active"),
        v.literal("folded"),
        v.literal("all-in"),
        v.literal("out")
      ),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const player = await ctx.db
      .query("players")
      .withIndex("by_gameId_and_userId", (q) => 
        q.eq("gameId", args.gameId).eq("userId", userId)
      )
      .first();
    
    return player || null;
  },
});

/**
 * Get all games the current user is in
 */
export const getMyGames = query({
  args: {},
  returns: v.array(
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
    })
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get all player records for this user
    const playerRecords = await ctx.db
      .query("players")
      .collect();
    
    const myPlayerRecords = playerRecords.filter(p => p.userId === userId);
    
    // Get all games for these player records
    const games = [];
    
    for (const playerRecord of myPlayerRecords) {
      const game = await ctx.db.get(playerRecord.gameId);
      if (game) {
        games.push(game);
      }
    }
    
    return games;
  },
});

