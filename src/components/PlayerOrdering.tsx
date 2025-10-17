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
  const players = useQuery(api.queries.getGamePlayers, { gameId })
  const setPlayerOrder = useMutation(api.games.setPlayerOrder)
  const startNewHand = useMutation(api.hands.startNewHand)

  const approvedPlayers = players?.filter((p) => p.status === "approved") || []
  
  const [orderedPlayers, setOrderedPlayers] = useState(
    approvedPlayers
      .sort((a, b) => (a.seatPosition ?? 0) - (b.seatPosition ?? 0))
  )

  const isCreator = myPlayerState.userId === game.creatorId

  // Update ordered players when data changes
  if (players && orderedPlayers.length !== approvedPlayers.length) {
    setOrderedPlayers(
      approvedPlayers.sort((a, b) => (a.seatPosition ?? 0) - (b.seatPosition ?? 0))
    )
  }

  const movePlayerUp = (index: number) => {
    if (index === 0) return
    const newOrder = [...orderedPlayers]
    ;[newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]
    setOrderedPlayers(newOrder)
  }

  const movePlayerDown = (index: number) => {
    if (index === orderedPlayers.length - 1) return
    const newOrder = [...orderedPlayers]
    ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
    setOrderedPlayers(newOrder)
  }

  const handleSaveOrder = async () => {
    const playerOrder = orderedPlayers.map((player, index) => ({
      playerId: player._id,
      seatPosition: index,
    }))
    await setPlayerOrder({ gameId, playerOrder })
  }

  const handleStartGame = async () => {
    // Save order first
    const playerOrder = orderedPlayers.map((player, index) => ({
      playerId: player._id,
      seatPosition: index,
    }))
    await setPlayerOrder({ gameId, playerOrder })
    
    // Start first hand
    await startNewHand({ gameId })
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
            {orderedPlayers.map((player, index) => {
              const user = useQuery(api.users.getUserById, { userId: player.userId })
              return (
                <div
                  key={player._id}
                  className="flex items-center justify-between p-2 rounded border"
                >
                  <div>
                    <span className="font-medium">Seat {index + 1}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {user?.name || "Player"} {player.userId === game.creatorId && "(Host)"}
                    </span>
                  </div>
                </div>
              )
            })}
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
          {orderedPlayers.map((player, index) => (
            <div
              key={player._id}
              className="flex items-center gap-2 p-2 rounded border bg-card"
            >
              <div className="flex flex-col">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => movePlayerUp(index)}
                  disabled={index === 0}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => movePlayerDown(index)}
                  disabled={index === orderedPlayers.length - 1}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1">
                <div className="font-medium">Seat {index + 1}</div>
                <div className="text-sm text-muted-foreground">
                  {(() => {
                    const user = useQuery(api.users.getUserById, { userId: player.userId })
                    return user?.name || "Player"
                  })()} {player.userId === game.creatorId && "(Host)"}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => void handleSaveOrder()}
          >
            Save Order
          </Button>
          <Button
            className="flex-1"
            onClick={() => void handleStartGame()}
          >
            Start Game
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

