import { useQuery, useMutation } from "convex/react"
import { useNavigate } from "react-router-dom"
import { api } from "../../convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Id } from "../../convex/_generated/dataModel"

export function GamesList() {
  const navigate = useNavigate()
  // Fetch the user's games to display them on the home page
  const games = useQuery(api.queries.getMyGames)
  const currentUser = useQuery(api.users.getCurrentUser)
  const cancelGameMutation = useMutation(api.games.cancelGame)

  // Helper function to get badge color based on game status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "ordering":
        return "secondary"
      case "lobby":
        return "outline"
      case "finished":
        return "secondary"
      default:
        return "outline"
    }
  }

  // Handle game cancellation from home page
  const handleCancelGame = (gameId: Id<"games">, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Are you sure you want to cancel this game? This action cannot be undone.")) {
      return
    }
    // Fire and forget the mutation, handling errors silently
    void cancelGameMutation({ gameId }).catch((error) => {
      console.error("Failed to cancel game:", error)
    })
  }
  const filteredGames = games?.filter((game) => game.status !== "finished")

  // Only render if user has games
  if (!filteredGames || filteredGames.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Your Games</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {filteredGames.map((game) => {
          // Check if current user is the host of this game
          const isHost = currentUser && game.creatorId === currentUser._id
          // Check if game can be cancelled (not finished)
          const canCancel = isHost && game.status !== "finished"

          return (
            <div
              key={game._id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
              onClick={() => void navigate(`/game/${game._id}`)}
            >
              <div className="flex-1">
                <p className="font-medium text-sm">Code: {game.inviteCode}</p>
                <p className="text-xs text-muted-foreground">
                  Status:{" "}
                  <Badge variant={getStatusBadgeVariant(game.status)} className="ml-1">
                    {game.status}
                  </Badge>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {canCancel && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => handleCancelGame(game._id, e)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
