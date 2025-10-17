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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"

export function Home() {
  const navigate = useNavigate()
  const createGame = useMutation(api.games.createGame)
  const joinGame = useMutation(api.games.joinGame)

  const [inviteCode, setInviteCode] = useState("")
  const [joinError, setJoinError] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)

  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [gameSettings, setGameSettings] = useState({
    initialChips: 1000,
    smallBlind: 5,
    bigBlind: 10,
    bettingIncrement: 10,
  })

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault()
    setJoinError(null)
    setIsJoining(true)

    try {
      const gameId = await joinGame({ inviteCode: inviteCode.toUpperCase() })
      await navigate(`/game/${gameId}`)
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : "Failed to join game")
    } finally {
      setIsJoining(false)
    }
  }

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Texas Hold'em</h1>
          <p className="text-muted-foreground">Chip Manager</p>
        </div>

        {/* Join Game Card */}
        <Card>
          <CardHeader>
            <CardTitle>Join a Game</CardTitle>
            <CardDescription>
              Enter the invite code shared by your host
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form id="join-game-form" onSubmit={(e) => void handleJoinGame(e)}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="invite-code">Invite Code</FieldLabel>
                  <Input
                    id="invite-code"
                    type="text"
                    placeholder="ABC123"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="uppercase"
                    autoComplete="off"
                  />
                  {joinError && <FieldError>{joinError}</FieldError>}
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              form="join-game-form"
              className="w-full"
              disabled={isJoining || inviteCode.length !== 6}
            >
              {isJoining ? "Joining..." : "Join Game"}
            </Button>
          </CardFooter>
        </Card>

        {/* Create Game Card */}
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
      </div>
    </div>
  )
}

