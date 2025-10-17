import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { useMutation } from "convex/react"
import { useNavigate } from "react-router-dom"
import * as z from "zod"
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

const joinGameSchema = z.object({
  inviteCode: z
    .string()
    .length(6, "Invite code must be 6 characters")
    .regex(/^[A-Z0-9]+$/, "Invite code must contain only letters and numbers"),
})

type JoinGameFormData = z.infer<typeof joinGameSchema>

export function JoinGameForm() {
  const navigate = useNavigate()
  const joinGame = useMutation(api.games.joinGame)
  const [isJoining, setIsJoining] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<JoinGameFormData>({
    resolver: zodResolver(joinGameSchema),
    defaultValues: {
      inviteCode: "",
    },
  })

  const handleSubmit = async (data: JoinGameFormData) => {
    setServerError(null)
    setIsJoining(true)

    try {
      const gameId = await joinGame({ inviteCode: data.inviteCode })
      await navigate(`/game/${gameId}`)
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Failed to join game")
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
        <form id="join-game-form" onSubmit={(e) => { e.preventDefault(); void form.handleSubmit(handleSubmit)(e); }}>
          <FieldGroup>
            <Controller
              name="inviteCode"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="invite-code">Invite Code</FieldLabel>
                  <Input
                    {...field}
                    id="invite-code"
                    type="text"
                    aria-invalid={fieldState.invalid}
                    placeholder="ABC123"
                    maxLength={6}
                    className="uppercase"
                    autoComplete="off"
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {serverError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3">
                <p className="text-destructive text-sm">{serverError}</p>
              </div>
            )}
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Button
          type="submit"
          form="join-game-form"
          className="w-full"
          disabled={isJoining}
        >
          {isJoining ? "Joining..." : "Join Game"}
        </Button>
      </CardFooter>
    </Card>
  )
}
