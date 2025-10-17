import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface GameLobbyProps {
  gameId: Id<"games">
  game: {
    _id: Id<"games">
    inviteCode: string
    creatorId: Id<"users">
    status: "lobby" | "ordering" | "active" | "finished"
    settings: {
      initialChips: number
      smallBlind: number
      bigBlind: number
      bettingIncrement: number
    }
  }
  myPlayerState: {
    _id: Id<"players">
    userId: Id<"users">
    status: "pending" | "approved" | "active" | "folded" | "all-in" | "out"
  }
}

export function GameLobby({ gameId, game, myPlayerState }: GameLobbyProps) {
  const approveJoinRequest = useMutation(api.games.approveJoinRequest)
  const rejectJoinRequest = useMutation(api.games.rejectJoinRequest)
  const setPlayerOrder = useMutation(api.games.setPlayerOrder)

  const players = useQuery(api.queries.getGamePlayers, { gameId })
  const pendingRequests = useQuery(api.queries.getPendingRequests, { gameId })

  const isCreator = myPlayerState.userId === game.creatorId
  const approvedPlayers = players?.filter((p) => p.status === "approved") || []

  const handleStartOrdering = async () => {
    if (!players) return

    // Auto-assign seat positions if not already set
    const approvedPlayersWithoutSeats = approvedPlayers.filter(
      (p) => p.seatPosition === undefined
    )

    if (approvedPlayersWithoutSeats.length > 0) {
      const playerOrder = approvedPlayers.map((player, index) => ({
        playerId: player._id,
        seatPosition: player.seatPosition ?? index,
      }))

      await setPlayerOrder({ gameId, playerOrder })
    } else {
      // Already have seats, just transition to ordering
      await setPlayerOrder({
        gameId,
        playerOrder: approvedPlayers.map((p) => ({
          playerId: p._id,
          seatPosition: p.seatPosition!,
        })),
      })
    }
  }

  if (myPlayerState.status === "pending") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Waiting for Approval</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your request to join this game is pending approval from the host.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Game Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Game Lobby</span>
            <Badge variant="outline" className="text-lg font-mono">
              {game.inviteCode}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Initial Chips:</span>{" "}
              <span className="font-medium">{game.settings.initialChips}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Small Blind:</span>{" "}
              <span className="font-medium">{game.settings.smallBlind}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Big Blind:</span>{" "}
              <span className="font-medium">{game.settings.bigBlind}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Min Raise:</span>{" "}
              <span className="font-medium">{game.settings.bettingIncrement}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approved Players */}
      <Card>
        <CardHeader>
          <CardTitle>Players ({approvedPlayers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {approvedPlayers.map((player) => (
              <div
                key={player._id}
                className="flex items-center justify-between p-2 rounded border"
              >
                <div>
                  <span className="font-medium">
                    Player {player.userId === game.creatorId && "(Host)"}
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {player.chips} chips
                  </span>
                </div>
                <Badge variant="secondary">Approved</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Requests (Creator only) */}
      {isCreator && pendingRequests && pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Join Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingRequests.map((request) => (
                <div
                  key={request._id}
                  className="flex items-center justify-between p-2 rounded border"
                >
                  <span className="font-medium">New Player</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void approveJoinRequest({ playerId: request._id })}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => void rejectJoinRequest({ playerId: request._id })}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Start Game (Creator only) */}
      {isCreator && approvedPlayers.length >= 2 && (
        <Button
          className="w-full"
          size="lg"
          onClick={() => void handleStartOrdering()}
        >
          Arrange Seats & Start Game
        </Button>
      )}

      {isCreator && approvedPlayers.length < 2 && (
        <p className="text-center text-muted-foreground text-sm">
          Need at least 2 players to start the game
        </p>
      )}
    </div>
  )
}

