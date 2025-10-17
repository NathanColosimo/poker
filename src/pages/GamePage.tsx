import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { GameLobby } from "@/components/GameLobby"
import { PlayerOrdering } from "@/components/PlayerOrdering"
import { ActiveGame } from "@/components/ActiveGame"

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
      <div className="min-h-screen flex items-center justify-center p-4">
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
      <div className="min-h-screen flex items-center justify-center p-4">
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
      <div className="min-h-screen flex items-center justify-center p-4">
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
    <div className="min-h-screen p-4 bg-background">
      <div className="max-w-4xl mx-auto">
        {/* Lobby State */}
        {game.status === "lobby" && (
          <GameLobby
            gameId={game._id}
            game={game}
            myPlayerState={myPlayerState}
          />
        )}

        {/* Ordering State */}
        {game.status === "ordering" && (
          <PlayerOrdering
            gameId={game._id}
            game={game}
            myPlayerState={myPlayerState}
          />
        )}

        {/* Active Game State */}
        {game.status === "active" && (
          <ActiveGame
            gameId={game._id}
            game={game}
            myPlayerState={myPlayerState}
          />
        )}

        {/* Finished State */}
        {game.status === "finished" && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground mb-4">
                This game has finished
              </p>
              <Button onClick={() => void navigate("/")} className="w-full">
                Back to Home
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
