import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

interface WinnerSelectionProps {
  gameId: Id<"games">
  handId: Id<"hands">
  isSelecting: boolean
  isApproving: boolean
}

export function WinnerSelection({
  gameId,
  handId,
  isSelecting,
  isApproving,
}: WinnerSelectionProps) {
  const toggleWinner = useMutation(api.winners.toggleWinner)
  const approveWinners = useMutation(api.winners.approveWinners)
  
  const players = useQuery(api.queries.getGamePlayers, { gameId })
  const playerHandStates = useQuery(api.queries.getPlayerHandStates, { handId })

  const seatedPlayers = players
    ?.filter((p) => p.seatPosition !== undefined)
    .sort((a, b) => a.seatPosition! - b.seatPosition!) || []

  // Fetch all user data
  const userIds = seatedPlayers.map((p) => p.userId)
  const usersData = userIds.map((userId) => 
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useQuery(api.users.getUserById, { userId })
  )

  const getUserName = (userId: Id<"users">) => {
    const userIndex = userIds.indexOf(userId)
    return usersData[userIndex]?.name || "Player"
  }

  const getPlayerHandState = (playerId: Id<"players">) => {
    return playerHandStates?.find((state) => state.playerId === playerId)
  }

  const winners = playerHandStates?.filter((state) => state.isWinner === true) || []
  const totalApprovals = playerHandStates?.filter((state) => state.hasApprovedWinners === true).length || 0
  const totalPlayers = playerHandStates?.length || 0
  const approvalsNeeded = Math.floor(totalPlayers / 2) + 1

  if (isSelecting) {
    return (
      <Card className="border-yellow-500/50">
        <CardHeader>
          <CardTitle>Select Winner(s)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Click on players to mark them as winners. After 5 seconds of no changes, others can approve.
          </p>

          <div className="space-y-2">
            {seatedPlayers.map((player) => {
              const handState = getPlayerHandState(player._id)
              const isWinner = handState?.isWinner === true
              const isFolded = handState?.status === "folded"
              const playerName = getUserName(player.userId)

              return (
                <Button
                  key={player._id}
                  variant={isWinner ? "default" : "outline"}
                  className="w-full justify-between"
                  onClick={() => void toggleWinner({ handId, playerId: player._id })}
                  disabled={isFolded}
                >
                  <span>
                    Seat {(player.seatPosition ?? 0) + 1} - {playerName}
                    {isFolded && " (Folded)"}
                  </span>
                  {isWinner && <Check className="h-4 w-4" />}
                </Button>
              )
            })}
          </div>

          {winners.length > 0 && (
            <div className="text-sm text-muted-foreground text-center">
              {winners.length} winner{winners.length > 1 ? "s" : ""} selected
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (isApproving) {
    const myHandState = playerHandStates?.find((state) => 
      players?.some((p) => p._id === state.playerId)
    )
    const hasApproved = myHandState?.hasApprovedWinners === true

    return (
      <Card className="border-blue-500/50">
        <CardHeader>
          <CardTitle>Approve Winners</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Selected Winners:</div>
            {winners.map((winnerState) => {
              const player = players?.find((p) => p._id === winnerState.playerId)
              const playerName = player ? getUserName(player.userId) : "Player"
              return (
                <div
                  key={winnerState._id}
                  className="flex items-center justify-between p-2 rounded border bg-green-500/10 border-green-500/30"
                >
                  <span className="font-medium">
                    Seat {(player?.seatPosition ?? 0) + 1} - {playerName}
                  </span>
                  <Badge variant="secondary" className="bg-green-500/20">
                    Winner
                  </Badge>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between p-3 rounded bg-muted">
            <span className="text-sm">Approvals:</span>
            <Badge variant="outline">
              {totalApprovals} / {approvalsNeeded} needed
            </Badge>
          </div>

          {!hasApproved ? (
            <Button
              className="w-full"
              onClick={() => void approveWinners({ handId })}
            >
              Approve Winners
            </Button>
          ) : (
            <div className="text-center">
              <Badge variant="secondary" className="bg-green-500/20">
                You have approved
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Waiting for others to approve...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return null
}

