import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useNavigate } from "./router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface GameLobbyProps {
  gameId: Id<"games">;
}

export default function GameLobby({ gameId }: GameLobbyProps) {
  const game = useQuery(api.queries.getGame, { gameId });
  const players = useQuery(api.queries.getGamePlayers, { gameId });
  const pendingRequests = useQuery(api.queries.getPendingRequests, { gameId });
  const myPlayer = useQuery(api.queries.getMyPlayerState, { gameId });

  const approveRequest = useMutation(api.games.approveJoinRequest);
  const rejectRequest = useMutation(api.games.rejectJoinRequest);
  const setPlayerOrder = useMutation(api.games.setPlayerOrder);

  const navigate = useNavigate();

  if (!game || !players || !myPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const isCreator = game.creatorId === myPlayer.userId;
  const approvedPlayers = players.filter((p) => p.status === "approved");

  const handleStartOrdering = async () => {
    // Automatically assign seat positions
    const playerOrder = approvedPlayers.map((player, index) => ({
      playerId: player._id,
      seatPosition: index,
    }));

    await setPlayerOrder({ gameId, playerOrder });
    navigate(`/ordering/${gameId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Game Lobby</CardTitle>
            <CardDescription>
              Invite Code: <span className="font-mono font-bold text-foreground">{game.inviteCode}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-muted-foreground">Initial Chips</div>
                <div className="font-bold">{game.settings.initialChips}</div>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-muted-foreground">Small / Big Blind</div>
                <div className="font-bold">
                  {game.settings.smallBlind} / {game.settings.bigBlind}
                </div>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-muted-foreground">Betting Increment</div>
                <div className="font-bold">{game.settings.bettingIncrement}</div>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-muted-foreground">Status</div>
                <div className="font-bold capitalize">{game.status}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isCreator && pendingRequests && pendingRequests.length > 0 && (
          <Alert className="border-yellow-400 bg-yellow-50 dark:bg-yellow-950">
            <AlertTitle className="text-yellow-900 dark:text-yellow-100">
              Pending Requests ({pendingRequests.length})
            </AlertTitle>
            <AlertDescription>
              <div className="space-y-2 mt-4">
                {pendingRequests.map((player) => (
                  <div
                    key={player._id}
                    className="flex items-center justify-between bg-background p-3 rounded-lg border"
                  >
                    <span className="font-medium">
                      {player.userName || "Unknown Player"}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => void approveRequest({ playerId: player._id })}
                        size="sm"
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => void rejectRequest({ playerId: player._id })}
                        variant="destructive"
                        size="sm"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Players ({approvedPlayers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {approvedPlayers.map((player) => (
                <div
                  key={player._id}
                  className="flex items-center justify-between bg-muted p-3 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {player.userName || "Unknown Player"}
                    </span>
                    {player.userId === game.creatorId && (
                      <Badge variant="default">Host</Badge>
                    )}
                  </div>
                  <span className="font-bold">
                    {player.chips} chips
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {isCreator && approvedPlayers.length >= 2 && game.status === "lobby" && (
          <Button
            onClick={() => void handleStartOrdering()}
            className="w-full h-14 text-lg"
            size="lg"
          >
            Arrange Seating →
          </Button>
        )}

        {!isCreator && (
          <Alert>
            <AlertDescription>
              Waiting for host to start the game...
            </AlertDescription>
          </Alert>
        )}

        {approvedPlayers.length < 2 && (
          <Alert variant="default">
            <AlertDescription>
              Need at least 2 players to start the game
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
