import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useNavigate } from "./router";

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
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-green-900">Game Lobby</h1>
              <p className="text-gray-600 text-sm">
                Invite Code: <span className="font-mono font-bold">{game.inviteCode}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-green-50 p-3 rounded">
              <div className="text-gray-600">Initial Chips</div>
              <div className="font-bold text-green-900">{game.settings.initialChips}</div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="text-gray-600">Small / Big Blind</div>
              <div className="font-bold text-green-900">
                {game.settings.smallBlind} / {game.settings.bigBlind}
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="text-gray-600">Betting Increment</div>
              <div className="font-bold text-green-900">{game.settings.bettingIncrement}</div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="text-gray-600">Status</div>
              <div className="font-bold text-green-900 capitalize">{game.status}</div>
            </div>
          </div>
        </div>

        {isCreator && pendingRequests && pendingRequests.length > 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mb-4">
            <h2 className="text-lg font-bold text-yellow-900 mb-4">
              Pending Requests ({pendingRequests.length})
            </h2>
            <div className="space-y-2">
              {pendingRequests.map((player) => (
                <div
                  key={player._id}
                  className="flex items-center justify-between bg-white p-3 rounded"
                >
                  <span className="font-medium">
                    {player.userName || "Unknown Player"}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => void approveRequest({ playerId: player._id })}
                      className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 text-sm font-medium"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => void rejectRequest({ playerId: player._id })}
                      className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700 text-sm font-medium"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-xl p-6 mb-4">
          <h2 className="text-lg font-bold text-green-900 mb-4">
            Players ({approvedPlayers.length})
          </h2>
          <div className="space-y-2">
            {approvedPlayers.map((player) => (
              <div
                key={player._id}
                className="flex items-center justify-between bg-green-50 p-3 rounded"
              >
                <span className="font-medium">
                  {player.userName || "Unknown Player"}
                  {player.userId === game.creatorId && (
                    <span className="ml-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded">
                      Host
                    </span>
                  )}
                </span>
                <span className="text-green-700 font-bold">
                  {player.chips} chips
                </span>
              </div>
            ))}
          </div>
        </div>

        {isCreator && approvedPlayers.length >= 2 && game.status === "lobby" && (
          <button
            onClick={() => void handleStartOrdering()}
            className="w-full bg-green-600 text-white font-bold py-4 rounded-lg hover:bg-green-700 transition-colors text-lg"
          >
            Arrange Seating →
          </button>
        )}

        {!isCreator && (
          <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-4 text-center">
            <p className="text-blue-900">
              Waiting for host to start the game...
            </p>
          </div>
        )}

        {approvedPlayers.length < 2 && (
          <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 text-center">
            <p className="text-gray-700">
              Need at least 2 players to start the game
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

