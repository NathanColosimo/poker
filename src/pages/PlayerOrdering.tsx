import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useNavigate } from "./router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PlayerOrderingProps {
  gameId: Id<"games">;
}

export default function PlayerOrdering({ gameId }: PlayerOrderingProps) {
  const game = useQuery(api.queries.getGame, { gameId });
  const players = useQuery(api.queries.getGamePlayers, { gameId });
  const myPlayer = useQuery(api.queries.getMyPlayerState, { gameId });

  const setPlayerOrder = useMutation(api.games.setPlayerOrder);
  const startGame = useMutation(api.games.startGame);

  const navigate = useNavigate();

  const [orderedPlayers, setOrderedPlayers] = useState<Array<{
    _id: Id<"players">;
    userName?: string;
    seatPosition?: number;
  }>>([]);

  useEffect(() => {
    if (players) {
      const approved = players.filter((p) => p.status === "approved");
      // Sort by existing seat position or keep current order
      const sorted = [...approved].sort((a, b) => {
        if (a.seatPosition !== undefined && b.seatPosition !== undefined) {
          return a.seatPosition - b.seatPosition;
        }
        return 0;
      });
      setOrderedPlayers(sorted);
    }
  }, [players]);

  if (!game || !players || !myPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const isCreator = game.creatorId === myPlayer.userId;

  if (!isCreator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Please Wait</CardTitle>
            <CardDescription>
              The host is arranging the seating order...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const movePlayer = (fromIndex: number, toIndex: number) => {
    const newOrder = [...orderedPlayers];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    setOrderedPlayers(newOrder);
  };

  const handleSaveAndStart = async () => {
    // Update seat positions
    const playerOrder = orderedPlayers.map((player, index) => ({
      playerId: player._id,
      seatPosition: index,
    }));

    await setPlayerOrder({ gameId, playerOrder });
    
    // Start the game and first hand
    await startGame({ gameId });
    
    navigate(`/game/${gameId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Arrange Seating</CardTitle>
            <CardDescription>
              Order players around the table. Position 0 will be the first dealer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              {orderedPlayers.map((player, index) => (
                <div
                  key={player._id}
                  className="bg-muted p-4 rounded-lg border-2 border-muted"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="default" className="w-10 h-10 flex items-center justify-center text-lg">
                        {index}
                      </Badge>
                      <span className="font-medium">
                        {player.userName || "Unknown Player"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => movePlayer(index, Math.max(0, index - 1))}
                        disabled={index === 0}
                        size="icon"
                        variant="outline"
                      >
                        ↑
                      </Button>
                      <Button
                        onClick={() =>
                          movePlayer(index, Math.min(orderedPlayers.length - 1, index + 1))
                        }
                        disabled={index === orderedPlayers.length - 1}
                        size="icon"
                        variant="outline"
                      >
                        ↓
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={() => void handleSaveAndStart()}
              className="w-full h-14 text-lg"
              size="lg"
            >
              Start Game →
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
