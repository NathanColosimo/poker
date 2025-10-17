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

/**
 * Get the current hand for a game
 */
export const getCurrentHand = query({
  args: {
    gameId: v.id("games"),
  },
  returns: v.union(
    v.object({
      _id: v.id("hands"),
      _creationTime: v.number(),
      gameId: v.id("games"),
      handNumber: v.number(),
      dealerPosition: v.number(),
      currentBettingRound: v.union(
        v.literal("pre-flop"),
        v.literal("flop"),
        v.literal("turn"),
        v.literal("river"),
        v.literal("complete"),
        v.literal("selecting-winners"),
        v.literal("approving-winners"),
        v.literal("distributed")
      ),
      pot: v.number(),
      currentBet: v.number(),
      activePlayerPosition: v.number(),
      winnerSelectionLastUpdated: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game || !game.currentHandId) {
      return null;
    }

    return await ctx.db.get(game.currentHandId);
  },
});

/**
 * Get player hand states for current hand
 */
export const getPlayerHandStates = query({
  args: {
    handId: v.id("hands"),
  },
  returns: v.array(
    v.object({
      _id: v.id("playerHandStates"),
      _creationTime: v.number(),
      handId: v.id("hands"),
      playerId: v.id("players"),
      currentBet: v.number(),
      totalBet: v.number(),
      status: v.union(
        v.literal("waiting"),
        v.literal("active"),
        v.literal("folded"),
        v.literal("all-in")
      ),
      hasActed: v.boolean(),
      isWinner: v.optional(v.boolean()),
      hasApprovedWinners: v.optional(v.boolean()),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("playerHandStates")
      .withIndex("by_handId", (q) => q.eq("handId", args.handId))
      .collect();
  },
});

/**
 * Get all players in a game with their user names
 */
export const getGamePlayersWithNames = query({
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
      userName: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const players = await ctx.db
      .query("players")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();
    
    // Fetch user names for all players
    const result = [];
    for (const player of players) {
      const user = await ctx.db.get(player.userId);
      result.push({
        ...player,
        userName: user?.name,
      });
    }
    
    return result;
  },
});

/**
 * Get pending join requests for a game with user names (creator only)
 */
export const getPendingRequestsWithNames = query({
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
      userName: v.optional(v.string()),
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
    
    // Fetch user names for all pending players
    const result = [];
    for (const player of pendingPlayers) {
      const user = await ctx.db.get(player.userId);
      result.push({
        ...player,
        userName: user?.name,
      });
    }
    
    return result;
  },
});

