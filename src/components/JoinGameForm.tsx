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

export function JoinGameForm() {
  const navigate = useNavigate()
  const joinGame = useMutation(api.games.joinGame)

  const [inviteCode, setInviteCode] = useState("")
  const [joinError, setJoinError] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)

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

  return (
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
  )
}

