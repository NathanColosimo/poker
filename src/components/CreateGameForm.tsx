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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"

const createGameSchema = z
  .object({
    initialChips: z
      .number()
      .min(1, "Initial chips must be at least 1")
      .max(1000000, "Initial chips cannot exceed 1,000,000"),
    smallBlind: z
      .number()
      .min(1, "Small blind must be at least 1"),
    bigBlind: z
      .number()
      .min(1, "Big blind must be at least 1"),
    bettingIncrement: z
      .number()
      .min(1, "Betting increment must be at least 1"),
  })
  .refine((data) => data.bigBlind > data.smallBlind, {
    message: "Big blind must be greater than small blind",
    path: ["bigBlind"],
  })

type CreateGameFormData = z.infer<typeof createGameSchema>

export function CreateGameForm() {
  const navigate = useNavigate()
  const createGame = useMutation(api.games.createGame)
  const [isCreating, setIsCreating] = useState(false)
  const [showCustomize, setShowCustomize] = useState(false)

  const form = useForm<CreateGameFormData>({
    resolver: zodResolver(createGameSchema),
    defaultValues: {
      initialChips: 1000,
      smallBlind: 25,
      bigBlind: 50,
      bettingIncrement: 25,
    },
  })

  const handleSubmit = async (data: CreateGameFormData) => {
    setIsCreating(true)
    try {
      const { gameId } = await createGame(data)
      await navigate(`/game/${gameId}`)
    } catch (error) {
      console.error("Failed to create game:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const currentValues = form.watch()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a Game</CardTitle>
        <CardDescription>
          Start a new game and invite your friends
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="create-game-form" onSubmit={(e) => { e.preventDefault(); void form.handleSubmit(handleSubmit)(e); }}>
          {showCustomize ? (
            <FieldGroup>
              <Controller
                name="initialChips"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="initial-chips">
                      Initial Chip Stack
                    </FieldLabel>
                    <Input
                      {...field}
                      id="initial-chips"
                      type="number"
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      min={1}
                    />
                  </Field>
                )}
              />
              <Controller
                name="smallBlind"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="small-blind">Small Blind</FieldLabel>
                    <Input
                      {...field}
                      id="small-blind"
                      type="number"
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      min={1}
                    />
                  </Field>
                )}
              />
              <Controller
                name="bigBlind"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="big-blind">Big Blind</FieldLabel>
                    <Input
                      {...field}
                      id="big-blind"
                      type="number"
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      min={1}
                    />
                  </Field>
                )}
              />
              <Controller
                name="bettingIncrement"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="betting-increment">
                      Betting Increment
                    </FieldLabel>
                    <Input
                      {...field}
                      id="betting-increment"
                      type="number"
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      min={1}
                    />
                  </Field>
                )}
              />
            </FieldGroup>
          ) : (
            <div className="text-sm text-muted-foreground space-y-2">
              <div className="flex justify-between">
                <span>Initial Chips:</span>
                <span className="font-medium text-foreground">
                  {currentValues.initialChips}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Small Blind:</span>
                <span className="font-medium text-foreground">
                  {currentValues.smallBlind}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Big Blind:</span>
                <span className="font-medium text-foreground">
                  {currentValues.bigBlind}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Betting Increment:</span>
                <span className="font-medium text-foreground">
                  {currentValues.bettingIncrement}
                </span>
              </div>
            </div>
          )}
        </form>
      </CardContent>
      <CardFooter className="gap-2">
        {showCustomize ? (
          <>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowCustomize(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-game-form"
              className="flex-1"
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
              onClick={() => setShowCustomize(true)}
            >
              Customize
            </Button>
            <Button
              type="submit"
              form="create-game-form"
              className="flex-1"
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
