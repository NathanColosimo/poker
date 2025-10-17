import { v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

/**
 * Toggle a player as winner of the hand
 */
export const toggleWinner = mutation({
  args: {
    handId: v.id("hands"),
    playerId: v.id("players"),
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

    // Only allow winner selection after betting is complete
    if (hand.currentBettingRound !== "complete" && hand.currentBettingRound !== "selecting-winners") {
      throw new Error("Cannot select winners until betting is complete");
    }

    // Get player hand state
    const playerState = await ctx.db
      .query("playerHandStates")
      .withIndex("by_handId_and_playerId", (q) =>
        q.eq("handId", args.handId).eq("playerId", args.playerId)
      )
      .first();

    if (!playerState) {
      throw new Error("Player hand state not found");
    }

    // Toggle winner status
    const newWinnerStatus = !playerState.isWinner;
    await ctx.db.patch(playerState._id, {
      isWinner: newWinnerStatus,
      hasApprovedWinners: false, // Reset approval when winners change
    });

    // Reset all approvals since winners changed
    const allPlayerStates = await ctx.db
      .query("playerHandStates")
      .withIndex("by_handId", (q) => q.eq("handId", args.handId))
      .collect();

    for (const state of allPlayerStates) {
      if (state._id !== playerState._id) {
        await ctx.db.patch(state._id, {
          hasApprovedWinners: false,
        });
      }
    }

    // Update hand status and timestamp
    await ctx.db.patch(args.handId, {
      currentBettingRound: "selecting-winners",
      winnerSelectionLastUpdated: Date.now(),
    });

    // Schedule check for auto-approval after 5 seconds
    await ctx.scheduler.runAfter(5000, internal.winners.checkAutoApproval, {
      handId: args.handId,
      lastUpdated: Date.now(),
    });

    return null;
  },
});

/**
 * Check if 5 seconds have passed and auto-start approval process (internal)
 */
export const checkAutoApproval = internalMutation({
  args: {
    handId: v.id("hands"),
    lastUpdated: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const hand = await ctx.db.get(args.handId);
    if (!hand) {
      return null;
    }

    // Check if this is still the latest update
    if (hand.winnerSelectionLastUpdated !== args.lastUpdated) {
      // A newer selection was made, don't transition
      return null;
    }

    // Check if we're still in selecting-winners state
    if (hand.currentBettingRound !== "selecting-winners") {
      return null;
    }

    // Check if at least one winner is selected
    const playerStates = await ctx.db
      .query("playerHandStates")
      .withIndex("by_handId", (q) => q.eq("handId", args.handId))
      .collect();

    const winners = playerStates.filter((s) => s.isWinner === true);
    
    if (winners.length === 0) {
      // No winners selected, stay in selecting-winners state
      return null;
    }

    // Transition to approving-winners
    const approvalStartTime = Date.now();
    await ctx.db.patch(args.handId, {
      currentBettingRound: "approving-winners",
      winnerSelectionLastUpdated: approvalStartTime,
    });

    // Schedule timeout check for 30 seconds
    await ctx.scheduler.runAfter(30000, internal.winners.checkApprovalTimeout, {
      handId: args.handId,
      approvalStartTime,
    });

    return null;
  },
});

/**
 * Check if approval phase has timed out and reset to selecting-winners (internal)
 */
export const checkApprovalTimeout = internalMutation({
  args: {
    handId: v.id("hands"),
    approvalStartTime: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const hand = await ctx.db.get(args.handId);
    if (!hand) {
      return null;
    }

    // Check if we're still in approving-winners state
    if (hand.currentBettingRound !== "approving-winners") {
      return null;
    }

    // Check if the approval phase timestamp matches (no new approval phase started)
    if (hand.winnerSelectionLastUpdated !== args.approvalStartTime) {
      return null;
    }

    // 30 seconds have passed without reaching majority approval
    // Reset to selecting-winners
    await ctx.db.patch(args.handId, {
      currentBettingRound: "selecting-winners",
      winnerSelectionLastUpdated: Date.now(),
    });

    // Reset all approval flags
    const playerStates = await ctx.db
      .query("playerHandStates")
      .withIndex("by_handId", (q) => q.eq("handId", args.handId))
      .collect();

    for (const state of playerStates) {
      await ctx.db.patch(state._id, {
        hasApprovedWinners: false,
      });
    }

    // Schedule check for auto-approval after 5 seconds (restart the cycle)
    await ctx.scheduler.runAfter(5000, internal.winners.checkAutoApproval, {
      handId: args.handId,
      lastUpdated: Date.now(),
    });

    return null;
  },
});

/**
 * Approve the current winner selection
 */
export const approveWinners = mutation({
  args: {
    handId: v.id("hands"),
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

    // Only allow approval when in approving-winners state
    if (hand.currentBettingRound !== "approving-winners") {
      throw new Error("Not currently in approval phase");
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

    // Mark as approved
    await ctx.db.patch(playerState._id, {
      hasApprovedWinners: true,
    });

    // Check if majority has approved
    const allPlayerStates = await ctx.db
      .query("playerHandStates")
      .withIndex("by_handId", (q) => q.eq("handId", args.handId))
      .collect();

    const totalPlayers = allPlayerStates.length;
    const approvedCount = allPlayerStates.filter((s) => s.hasApprovedWinners === true).length;

    // Majority is more than half
    if (approvedCount > totalPlayers / 2) {
      // Distribute pot
      await ctx.runMutation(internal.winners.distributePot, {
        handId: args.handId,
      });
    }

    return null;
  },
});

/**
 * Distribute pot to winners (internal)
 */
export const distributePot = internalMutation({
  args: {
    handId: v.id("hands"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const hand = await ctx.db.get(args.handId);
    if (!hand) {
      return null;
    }

    // Get all winners
    const playerStates = await ctx.db
      .query("playerHandStates")
      .withIndex("by_handId", (q) => q.eq("handId", args.handId))
      .collect();

    const winners = playerStates.filter((s) => s.isWinner === true);

    if (winners.length === 0) {
      // No winners, don't distribute
      return null;
    }

    // Split pot evenly among winners
    const amountPerWinner = Math.floor(hand.pot / winners.length);
    const remainder = hand.pot % winners.length;

    for (let i = 0; i < winners.length; i++) {
      const winner = winners[i];
      const player = await ctx.db.get(winner.playerId);
      if (player) {
        // Give each winner their share, first winner gets the remainder
        const winAmount = amountPerWinner + (i === 0 ? remainder : 0);
        await ctx.db.patch(player._id, {
          chips: player.chips + winAmount,
        });
      }
    }

    // Mark hand as distributed
    await ctx.db.patch(args.handId, {
      currentBettingRound: "distributed",
    });

    return null;
  },
});

