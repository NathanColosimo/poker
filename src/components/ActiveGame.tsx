import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PokerTable } from "@/components/PokerTable"
import { BettingInterface } from "@/components/BettingInterface"
import { WinnerSelection } from "@/components/WinnerSelection"

interface ActiveGameProps {
  gameId: Id<"games">
  game: {
    _id: Id<"games">
    inviteCode: string
    creatorId: Id<"users">
    settings: {
      initialChips: number
      smallBlind: number
      bigBlind: number
      bettingIncrement: number
    }
    currentHandId?: Id<"hands">
  }
  myPlayerState: {
    _id: Id<"players">
    userId: Id<"users">
    chips: number
    seatPosition?: number
    status: "pending" | "approved" | "active" | "folded" | "all-in" | "out"
  }
}

export function ActiveGame({ gameId, game, myPlayerState }: ActiveGameProps) {
  const currentHand = useQuery(api.queries.getCurrentHand, { gameId })
  const playerHandStates = useQuery(
    api.queries.getPlayerHandStates,
    currentHand ? { handId: currentHand._id } : "skip"
  )
  const startNewHand = useMutation(api.hands.startNewHand)

  const myHandState = playerHandStates?.find(
    (state) => state.playerId === myPlayerState._id
  )

  const isMyTurn =
    currentHand?.activePlayerPosition === myPlayerState.seatPosition &&
    (currentHand?.currentBettingRound === "pre-flop" ||
      currentHand?.currentBettingRound === "flop" ||
      currentHand?.currentBettingRound === "turn" ||
      currentHand?.currentBettingRound === "river")

  const isCreator = myPlayerState.userId === game.creatorId

  const handleNextHand = async () => {
    await startNewHand({ gameId })
  }

  if (!currentHand) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground mb-4">No active hand</p>
          {isCreator && (
            <Button onClick={() => void handleNextHand()}>Start Hand</Button>
          )}
        </CardContent>
      </Card>
    )
  }

  const isSelecting = currentHand.currentBettingRound === "selecting-winners"
  const isApproving = currentHand.currentBettingRound === "approving-winners"
  const isDistributed = currentHand.currentBettingRound === "distributed"
  const isBetting =
    currentHand.currentBettingRound === "pre-flop" ||
    currentHand.currentBettingRound === "flop" ||
    currentHand.currentBettingRound === "turn" ||
    currentHand.currentBettingRound === "river"

  return (
    <div className="space-y-4">
      {/* Poker Table */}
      <PokerTable gameId={gameId} currentHand={currentHand} />

      {/* Betting Interface */}
      {isBetting && myHandState && (
        <BettingInterface
          handId={currentHand._id}
          myChips={myPlayerState.chips}
          currentBet={currentHand.currentBet}
          myCurrentBet={myHandState.currentBet}
          bettingIncrement={game.settings.bettingIncrement}
          isMyTurn={isMyTurn}
        />
      )}

      {/* Winner Selection */}
      {(isSelecting || isApproving) && (
        <WinnerSelection
          gameId={gameId}
          handId={currentHand._id}
          isSelecting={isSelecting}
          isApproving={isApproving}
        />
      )}

      {/* Hand Distributed - Start Next Hand */}
      {isDistributed && (
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <div>
              <p className="font-medium text-green-500 mb-2">Pot Distributed!</p>
              <p className="text-sm text-muted-foreground">
                Hand #{currentHand.handNumber} complete
              </p>
            </div>
            {isCreator && (
              <Button onClick={() => void handleNextHand()} className="w-full">
                Start Next Hand
              </Button>
            )}
            {!isCreator && (
              <p className="text-sm text-muted-foreground">
                Waiting for host to start next hand...
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

