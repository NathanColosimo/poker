import { useState } from "react"
import { useMutation } from "convex/react"
import { useNavigate } from "react-router-dom"
import { api } from "../../convex/_generated/api"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"

export function CreateGameForm() {
  const navigate = useNavigate()
  const createGame = useMutation(api.games.createGame)

  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [gameSettings, setGameSettings] = useState({
    initialChips: 1000,
    smallBlind: 25,
    bigBlind: 50,
    bettingIncrement: 25,
  })

  const handleCreateGame = async () => {
    setIsCreating(true)
    try {
      const { gameId } = await createGame(gameSettings)
      await navigate(`/game/${gameId}`)
    } catch (error) {
      console.error("Failed to create game:", error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a Game</CardTitle>
        <CardDescription>
          Start a new game and invite your friends
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showCreateForm ? (
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="initial-chips">
                Initial Chip Stack
              </FieldLabel>
              <Input
                id="initial-chips"
                type="number"
                value={gameSettings.initialChips}
                onChange={(e) =>
                  setGameSettings({
                    ...gameSettings,
                    initialChips: parseInt(e.target.value) || 0,
                  })
                }
                min={1}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="small-blind">Small Blind</FieldLabel>
              <Input
                id="small-blind"
                type="number"
                value={gameSettings.smallBlind}
                onChange={(e) =>
                  setGameSettings({
                    ...gameSettings,
                    smallBlind: parseInt(e.target.value) || 0,
                  })
                }
                min={1}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="big-blind">Big Blind</FieldLabel>
              <Input
                id="big-blind"
                type="number"
                value={gameSettings.bigBlind}
                onChange={(e) =>
                  setGameSettings({
                    ...gameSettings,
                    bigBlind: parseInt(e.target.value) || 0,
                  })
                }
                min={1}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="betting-increment">
                Betting Increment
              </FieldLabel>
              <Input
                id="betting-increment"
                type="number"
                value={gameSettings.bettingIncrement}
                onChange={(e) =>
                  setGameSettings({
                    ...gameSettings,
                    bettingIncrement: parseInt(e.target.value) || 0,
                  })
                }
                min={1}
              />
            </Field>
          </FieldGroup>
        ) : (
          <div className="text-sm text-muted-foreground space-y-2">
            <div className="flex justify-between">
              <span>Initial Chips:</span>
              <span className="font-medium text-foreground">
                {gameSettings.initialChips}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Small Blind:</span>
              <span className="font-medium text-foreground">
                {gameSettings.smallBlind}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Big Blind:</span>
              <span className="font-medium text-foreground">
                {gameSettings.bigBlind}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Betting Increment:</span>
              <span className="font-medium text-foreground">
                {gameSettings.bettingIncrement}
              </span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="gap-2">
        {showCreateForm ? (
          <>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={() => void handleCreateGame()}
              disabled={isCreating}
            >
              {isCreating ? "Creating..." : "Create Game"}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowCreateForm(true)}
            >
              Customize
            </Button>
            <Button
              className="flex-1"
              onClick={() => void handleCreateGame()}
              disabled={isCreating}
            >
              {isCreating ? "Creating..." : "Create with Defaults"}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}

