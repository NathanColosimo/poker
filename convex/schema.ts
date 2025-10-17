import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  ...authTables,
  
  // Game table: stores poker game instances
  games: defineTable({
    inviteCode: v.string(), // Unique code for joining the game
    creatorId: v.id("users"), // User who created the game
    status: v.union(
      v.literal("lobby"), // Waiting for players to join
      v.literal("ordering"), // Creator is arranging seats
      v.literal("active"), // Game in progress
      v.literal("finished") // Game completed
    ),
    settings: v.object({
      initialChips: v.number(), // Starting chip stack for each player
      smallBlind: v.number(), // Small blind amount
      bigBlind: v.number(), // Big blind amount
      bettingIncrement: v.number(), // Minimum raise increment
    }),
    currentHandId: v.optional(v.id("hands")), // Current active hand
  })
    .index("by_inviteCode", ["inviteCode"])
    .index("by_creatorId", ["creatorId"]),

  // Player table: stores players in each game
  players: defineTable({
    gameId: v.id("games"), // Which game this player is in
    userId: v.id("users"), // Which user this player represents
    chips: v.number(), // Current chip count
    seatPosition: v.optional(v.number()), // Position at table (0-indexed), set during ordering
    status: v.union(
      v.literal("pending"), // Waiting for approval
      v.literal("approved"), // Approved but game not started
      v.literal("active"), // Currently in the hand
      v.literal("folded"), // Folded current hand
      v.literal("all-in"), // All chips in the pot
      v.literal("out") // No chips left
    ),
  })
    .index("by_gameId", ["gameId"])
    .index("by_gameId_and_userId", ["gameId", "userId"])
    .index("by_gameId_and_seatPosition", ["gameId", "seatPosition"]),

  // Hand table: stores individual poker hands
  hands: defineTable({
    gameId: v.id("games"), // Which game this hand belongs to
    handNumber: v.number(), // Sequential hand number (1, 2, 3...)
    dealerPosition: v.number(), // Seat position of the dealer button
    currentBettingRound: v.union(
      v.literal("pre-flop"),
      v.literal("flop"),
      v.literal("turn"),
      v.literal("river"),
      v.literal("complete")
    ),
    pot: v.number(), // Total chips in the pot
    currentBet: v.number(), // Highest bet in the current round
    activePlayerPosition: v.number(), // Seat position of player whose turn it is
  })
    .index("by_gameId", ["gameId"])
    .index("by_gameId_and_handNumber", ["gameId", "handNumber"]),

  // PlayerHandState table: stores each player's state within a specific hand
  playerHandStates: defineTable({
    handId: v.id("hands"), // Which hand this state belongs to
    playerId: v.id("players"), // Which player this state is for
    currentBet: v.number(), // Amount bet in the current betting round
    totalBet: v.number(), // Total amount bet across all rounds in this hand
    status: v.union(
      v.literal("waiting"), // Waiting for turn
      v.literal("active"), // Currently making decision
      v.literal("folded"), // Folded this hand
      v.literal("all-in") // All chips committed
    ),
    hasActed: v.boolean(), // Whether player has acted in current betting round
  })
    .index("by_handId", ["handId"])
    .index("by_handId_and_playerId", ["handId", "playerId"]),
});
