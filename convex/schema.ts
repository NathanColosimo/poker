import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  ...authTables,
  
  // Games table - stores overall game configuration and state
  games: defineTable({
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
    .index("by_inviteCode", ["inviteCode"])
    .index("by_creatorId", ["creatorId"]),

  // Players table - stores player information for each game
  players: defineTable({
    gameId: v.id("games"),
    userId: v.id("users"),
    chips: v.number(),
    seatPosition: v.optional(v.number()), // Set during ordering phase
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("active"),
      v.literal("folded"),
      v.literal("all-in"),
      v.literal("out")
    ),
  })
    .index("by_gameId", ["gameId"])
    .index("by_gameId_and_userId", ["gameId", "userId"])
    .index("by_gameId_and_seatPosition", ["gameId", "seatPosition"]),

  // Hands table - stores individual hand state
  hands: defineTable({
    gameId: v.id("games"),
    handNumber: v.number(),
    dealerPosition: v.number(), // Seat position of dealer
    currentBettingRound: v.union(
      v.literal("pre-flop"),
      v.literal("flop"),
      v.literal("turn"),
      v.literal("river"),
      v.literal("complete")
    ),
    pot: v.number(),
    currentBet: v.number(), // Highest bet in current round
    activePlayerPosition: v.optional(v.number()), // Whose turn it is (seat position)
  }).index("by_gameId", ["gameId"]),

  // PlayerHandStates table - stores each player's state within a hand
  playerHandStates: defineTable({
    handId: v.id("hands"),
    playerId: v.id("players"),
    currentBet: v.number(), // Amount bet in current round
    totalBet: v.number(), // Total bet in this hand
    status: v.union(
      v.literal("waiting"),
      v.literal("active"),
      v.literal("folded"),
      v.literal("all-in")
    ),
    hasActed: v.boolean(), // Has acted in current betting round
  })
    .index("by_handId", ["handId"])
    .index("by_handId_and_playerId", ["handId", "playerId"]),
});
