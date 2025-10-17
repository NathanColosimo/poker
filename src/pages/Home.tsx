import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "./router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const createGameSchema = z.object({
  inviteCode: z.string().min(1, "Invite code is required"),
  initialChips: z.number().min(1, "Must be at least 1 chip"),
  smallBlind: z.number().min(1, "Must be at least 1"),
  bigBlind: z.number().min(1, "Must be at least 1"),
  bettingIncrement: z.number().min(1, "Must be at least 1"),
});

const joinGameSchema = z.object({
  inviteCode: z.string().min(1, "Invite code is required"),
});

export default function Home() {
  const [mode, setMode] = useState<"menu" | "create" | "join">("menu");
  const [error, setError] = useState<string | null>(null);

  const createGame = useMutation(api.games.createGame);
  const joinGame = useMutation(api.games.joinGameRequest);
  const navigate = useNavigate();

  const createForm = useForm<z.infer<typeof createGameSchema>>({
    resolver: zodResolver(createGameSchema),
    defaultValues: {
      inviteCode: "",
      initialChips: 1000,
      smallBlind: 10,
      bigBlind: 20,
      bettingIncrement: 10,
    },
  });

  const joinForm = useForm<z.infer<typeof joinGameSchema>>({
    resolver: zodResolver(joinGameSchema),
    defaultValues: {
      inviteCode: "",
    },
  });

  const handleCreateGame = async (values: z.infer<typeof createGameSchema>) => {
    setError(null);
    try {
      const result = await createGame(values);
      navigate(`/lobby/${result.gameId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create game");
    }
  };

  const handleJoinGame = async (values: z.infer<typeof joinGameSchema>) => {
    setError(null);
    try {
      const result = await joinGame(values);
      navigate(`/lobby/${result.gameId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join game");
    }
  };

  if (mode === "menu") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white mb-2">♠♥ Poker ♣♦</h1>
            <p className="text-green-200">Chip Manager</p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => setMode("create")}
              className="w-full h-14 text-lg"
              size="lg"
            >
              Create New Game
            </Button>

            <Button
              onClick={() => setMode("join")}
              className="w-full h-14 text-lg"
              variant="secondary"
              size="lg"
            >
              Join Existing Game
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "create") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 p-4">
        <div className="max-w-md mx-auto">
          <Button
            onClick={() => {
              setMode("menu");
              setError(null);
              createForm.reset();
            }}
            variant="ghost"
            className="text-green-200 hover:text-white mb-4"
          >
            ← Back
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Create Game</CardTitle>
              <CardDescription>Set up your poker game settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...createForm}>
                <form onSubmit={(e) => void createForm.handleSubmit(handleCreateGame)(e)} className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="inviteCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invite Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., POKER123" {...field} />
                        </FormControl>
                        <FormDescription>
                          Share this code with your friends to join
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="initialChips"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Chips</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Starting chip stack for each player
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="smallBlind"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Small Blind</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="bigBlind"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Big Blind</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="bettingIncrement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Betting Increment</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum raise amount above current bet
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    disabled={createForm.formState.isSubmitting} 
                    className="w-full"
                  >
                    {createForm.formState.isSubmitting ? "Creating..." : "Create Game"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Join mode
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 p-4">
      <div className="max-w-md mx-auto">
        <Button
          onClick={() => {
            setMode("menu");
            setError(null);
            joinForm.reset();
          }}
          variant="ghost"
          className="text-green-200 hover:text-white mb-4"
        >
          ← Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Join Game</CardTitle>
            <CardDescription>Enter the invite code to join</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...joinForm}>
              <form onSubmit={(e) => void joinForm.handleSubmit(handleJoinGame)(e)} className="space-y-4">
                <FormField
                  control={joinForm.control}
                  name="inviteCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invite Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter invite code" {...field} />
                      </FormControl>
                      <FormDescription>
                        Ask the host for the game invite code
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  disabled={joinForm.formState.isSubmitting} 
                  className="w-full"
                >
                  {joinForm.formState.isSubmitting ? "Joining..." : "Join Game"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
