import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronUp, ChevronDown } from "lucide-react"

interface PlayerOrderingProps {
  gameId: Id<"games">
  game: {
    _id: Id<"games">
    creatorId: Id<"users">
  }
  myPlayerState: {
    userId: Id<"users">
  }
}

export function PlayerOrdering({ gameId, game, myPlayerState }: PlayerOrderingProps) {
  // Fetch players with their names included to avoid nested queries
  const players = useQuery(api.queries.getGamePlayersWithNames, { gameId })
  const setPlayerOrder = useMutation(api.games.setPlayerOrder)
  const startNewHand = useMutation(api.hands.startNewHand)

  // Get approved players sorted by seat position
  const approvedPlayers = players?.filter((p) => p.status === "approved") || []
  const sortedPlayers = approvedPlayers.sort((a, b) => (a.seatPosition ?? 0) - (b.seatPosition ?? 0))
  
  // Track if a mutation is in progress
  const [isUpdating, setIsUpdating] = useState(false)

  const isCreator = myPlayerState.userId === game.creatorId

  const movePlayerUp = async (index: number) => {
    if (index === 0) return
    
    // Create new order with swapped players
    const newOrder = [...sortedPlayers]
    ;[newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]
    
    // Update seat positions immediately
    setIsUpdating(true)
    try {
      const playerOrder = newOrder.map((player, i) => ({
        playerId: player._id,
        seatPosition: i,
      }))
      await setPlayerOrder({ gameId, playerOrder })
    } finally {
      setIsUpdating(false)
    }
  }

  const movePlayerDown = async (index: number) => {
    if (index === sortedPlayers.length - 1) return
    
    // Create new order with swapped players
    const newOrder = [...sortedPlayers]
    ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
    
    // Update seat positions immediately
    setIsUpdating(true)
    try {
      const playerOrder = newOrder.map((player, i) => ({
        playerId: player._id,
        seatPosition: i,
      }))
      await setPlayerOrder({ gameId, playerOrder })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleStartGame = async () => {
    setIsUpdating(true)
    try {
      // Start first hand
      await startNewHand({ gameId })
    } finally {
      setIsUpdating(false)
    }
  }

  if (!isCreator) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Waiting for Host</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The host is arranging the seating order...
          </p>
          <div className="mt-4 space-y-2">
            {sortedPlayers.map((player, index) => (
              <div
                key={player._id}
                className="flex items-center justify-between p-2 rounded border"
              >
                <div>
                  <span className="font-medium">Seat {index + 1}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {player.userName || "Player"} {player.userId === game.creatorId && "(Host)"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Arrange Seating Order</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Drag players to arrange the seating order. Seat 1 starts with the dealer button.
        </p>

        <div className="space-y-2">
          {sortedPlayers.map((player, index) => (
            <div
              key={player._id}
              className="flex items-center gap-2 p-2 rounded border bg-card"
            >
              <div className="flex flex-col">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => void movePlayerUp(index)}
                  disabled={index === 0 || isUpdating}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => void movePlayerDown(index)}
                  disabled={index === sortedPlayers.length - 1 || isUpdating}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1">
                <div className="font-medium">Seat {index + 1}</div>
                <div className="text-sm text-muted-foreground">
                  {player.userName || "Player"} {player.userId === game.creatorId && "(Host)"}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={() => void handleStartGame()}
          disabled={isUpdating}
        >
          Start Game
        </Button>
      </CardContent>
    </Card>
  )
}

