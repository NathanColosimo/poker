import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function GamePage() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()

  const game = useQuery(
    api.games.getGame,
    gameId ? { gameId: gameId as Id<"games"> } : "skip"
  )
  const myPlayerState = useQuery(
    api.queries.getMyPlayerState,
    gameId ? { gameId: gameId as Id<"games"> } : "skip"
  )
  const players = useQuery(
    api.queries.getGamePlayers,
    gameId ? { gameId: gameId as Id<"games"> } : "skip"
  )

  if (!gameId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Invalid game ID</p>
            <Button onClick={() => void navigate("/")} className="mt-4">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (game === undefined || myPlayerState === undefined || players === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Game not found</p>
            <Button onClick={() => void navigate("/")} className="mt-4">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!myPlayerState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">You are not in this game</p>
            <Button onClick={() => void navigate("/")} className="mt-4">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Game Header */}
        <Card>
          <CardHeader>
            <CardTitle>
              Game: {game.inviteCode}
              <span className="text-sm font-normal text-muted-foreground ml-4">
                Status: {game.status}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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

        {/* Player Status */}
        <Card>
          <CardHeader>
            <CardTitle>Your Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="text-muted-foreground">Status:</span>{" "}
                <span className="font-medium capitalize">{myPlayerState.status}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Chips:</span>{" "}
                <span className="font-medium">{myPlayerState.chips}</span>
              </div>
              {myPlayerState.seatPosition !== undefined && (
                <div>
                  <span className="text-muted-foreground">Seat:</span>{" "}
                  <span className="font-medium">{myPlayerState.seatPosition + 1}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Players List */}
        <Card>
          <CardHeader>
            <CardTitle>Players ({players.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player._id}
                  className="flex justify-between items-center p-2 rounded border"
                >
                  <div>
                    <span className="font-medium">
                      Player {player.userId === game.creatorId && "(Host)"}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {player.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{player.chips} chips</div>
                    {player.seatPosition !== undefined && (
                      <div className="text-sm text-muted-foreground">
                        Seat {player.seatPosition + 1}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Temporary: Back button */}
        <Button variant="outline" onClick={() => void navigate("/")}>
          Back to Home
        </Button>
      </div>
    </div>
  )
}

