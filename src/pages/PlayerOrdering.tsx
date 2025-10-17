import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useNavigate } from "./router";

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
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md">
          <h2 className="text-xl font-bold text-green-900 mb-4">
            Please Wait
          </h2>
          <p className="text-gray-700">
            The host is arranging the seating order...
          </p>
        </div>
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
        <div className="bg-white rounded-lg shadow-xl p-6 mb-4">
          <h1 className="text-2xl font-bold text-green-900 mb-2">
            Arrange Seating
          </h1>
          <p className="text-gray-600 text-sm mb-4">
            Drag players to arrange them around the table. Position 0 will be the first dealer.
          </p>

          <div className="space-y-2 mb-6">
            {orderedPlayers.map((player, index) => (
              <div
                key={player._id}
                className="bg-green-50 p-4 rounded-lg border-2 border-green-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                      {index}
                    </div>
                    <span className="font-medium">
                      {player.userName || "Unknown Player"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => movePlayer(index, Math.max(0, index - 1))}
                      disabled={index === 0}
                      className="bg-green-600 text-white w-10 h-10 rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() =>
                        movePlayer(index, Math.min(orderedPlayers.length - 1, index + 1))
                      }
                      disabled={index === orderedPlayers.length - 1}
                      className="bg-green-600 text-white w-10 h-10 rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSaveAndStart}
            className="w-full bg-green-600 text-white font-bold py-4 rounded-lg hover:bg-green-700 transition-colors text-lg"
          >
            Start Game →
          </button>
        </div>
      </div>
    </div>
  );
}

