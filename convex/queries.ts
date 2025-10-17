import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get game details by invite code or ID
export const getGame = query({
  args: {
    gameId: v.optional(v.id("games")),
    inviteCode: v.optional(v.string()),
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
    if (args.gameId) {
      return await ctx.db.get(args.gameId);
    }

    if (args.inviteCode) {
      return await ctx.db
        .query("games")
        .withIndex("by_inviteCode", (q) => q.eq("inviteCode", args.inviteCode!))
        .first();
    }

    return null;
  },
});

// List games the current user is in
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
      myPlayerId: v.id("players"),
      myPlayerStatus: v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("active"),
        v.literal("folded"),
        v.literal("all-in"),
        v.literal("out")
      ),
    })
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get all player records for this user
    const myPlayers = await ctx.db
      .query("players")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    // Get games for each player record
    const games = [];
    for (const player of myPlayers) {
      const game = await ctx.db.get(player.gameId);
      if (game) {
        games.push({
          ...game,
          myPlayerId: player._id,
          myPlayerStatus: player.status,
        });
      }
    }

    return games;
  },
});

// Get all players in a game
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
      userName: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const players = await ctx.db
      .query("players")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    // Enrich with user names
    const enrichedPlayers = await Promise.all(
      players.map(async (player) => {
        const user = await ctx.db.get(player.userId);
        return {
          ...player,
          userName: user?.name,
        };
      })
    );

    return enrichedPlayers;
  },
});

// Get current hand state
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
        v.literal("complete")
      ),
      pot: v.number(),
      currentBet: v.number(),
      activePlayerPosition: v.optional(v.number()),
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

// Get all player states for current hand
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
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("playerHandStates")
      .withIndex("by_handId", (q) => q.eq("handId", args.handId))
      .collect();
  },
});

// Get pending join requests (creator only)
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
      userName: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Verify user is the game creator
    const game = await ctx.db.get(args.gameId);
    if (!game || game.creatorId !== userId) {
      return [];
    }

    // Get pending players
    const pendingPlayers = await ctx.db
      .query("players")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    // Enrich with user names
    const enrichedPlayers = await Promise.all(
      pendingPlayers.map(async (player) => {
        const user = await ctx.db.get(player.userId);
        return {
          ...player,
          userName: user?.name,
        };
      })
    );

    return enrichedPlayers;
  },
});

// Get current user's player state in a game
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

    return await ctx.db
      .query("players")
      .withIndex("by_gameId_and_userId", (q) =>
        q.eq("gameId", args.gameId).eq("userId", userId)
      )
      .first();
  },
});

// Get player hand state for current user
export const getMyHandState = query({
  args: {
    handId: v.id("hands"),
  },
  returns: v.union(
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
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    // Get hand to find game
    const hand = await ctx.db.get(args.handId);
    if (!hand) {
      return null;
    }

    // Get player in this game
    const player = await ctx.db
      .query("players")
      .withIndex("by_gameId_and_userId", (q) =>
        q.eq("gameId", hand.gameId).eq("userId", userId)
      )
      .first();

    if (!player) {
      return null;
    }

    // Get player hand state
    return await ctx.db
      .query("playerHandStates")
      .withIndex("by_handId_and_playerId", (q) =>
        q.eq("handId", args.handId).eq("playerId", player._id)
      )
      .first();
  },
});

