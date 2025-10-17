import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import PlayerPosition from "../components/PlayerPosition";
import PotDisplay from "../components/PotDisplay";
import BettingInterface from "../components/BettingInterface";

interface GameTableProps {
  gameId: Id<"games">;
}

export default function GameTable({ gameId }: GameTableProps) {
  const game = useQuery(api.queries.getGame, { gameId });
  const players = useQuery(api.queries.getGamePlayers, { gameId });
  const currentHand = useQuery(api.queries.getCurrentHand, { gameId });
  const myPlayer = useQuery(api.queries.getMyPlayerState, { gameId });
  
  const playerHandStates = useQuery(
    api.queries.getPlayerHandStates,
    currentHand ? { handId: currentHand._id } : "skip"
  );
  const myHandState = useQuery(
    api.queries.getMyHandState,
    currentHand ? { handId: currentHand._id } : "skip"
  );

  const commitAction = useMutation(api.hands.commitAction);
  const startNewHand = useMutation(api.hands.startNewHand);

  if (!game || !players || !myPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const isCreator = game.creatorId === myPlayer.userId;

  // Sort players by seat position
  const sortedPlayers = [...players]
    .filter((p) => p.seatPosition !== undefined && p.status !== "pending")
    .sort((a, b) => a.seatPosition! - b.seatPosition!);

  const getPlayerHandState = (playerId: Id<"players">) => {
    return playerHandStates?.find((s) => s.playerId === playerId);
  };

  const handleCommitAction = async (amount: number) => {
    if (!currentHand) return;
    try {
      await commitAction({ handId: currentHand._id, amount });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to commit action");
    }
  };

  const handleStartNewHand = async () => {
    try {
      await startNewHand({ gameId });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to start new hand");
    }
  };

  const isMyTurn =
    currentHand &&
    myPlayer.seatPosition !== undefined &&
    currentHand.activePlayerPosition === myPlayer.seatPosition &&
    currentHand.currentBettingRound !== "complete";

  const canStartNewHand =
    isCreator &&
    (!currentHand || currentHand.currentBettingRound === "complete");

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex flex-col">
      {/* Header */}
      <div className="bg-green-950 bg-opacity-80 p-4 text-white">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Texas Hold'em</h1>
            <p className="text-xs text-green-300">Code: {game.inviteCode}</p>
          </div>
          {currentHand && (
            <div className="text-right">
              <div className="text-sm">Hand #{currentHand.handNumber}</div>
              <div className="text-xs text-green-300 capitalize">
                {currentHand.currentBettingRound.replace("-", " ")}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main game area */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Pot display */}
          {!!currentHand && (
            <div className="flex justify-center mb-6">
              <PotDisplay amount={currentHand.pot} />
            </div>
          )}

          {/* Players grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {sortedPlayers.map((player) => {
              const handState = getPlayerHandState(player._id);
              const isDealer =
                currentHand?.dealerPosition === player.seatPosition;
              const dealerIndex = sortedPlayers.findIndex(
                (p) => p.seatPosition === currentHand?.dealerPosition
              );
              const smallBlindIndex =
                (dealerIndex + 1) % sortedPlayers.length;
              const bigBlindIndex = (dealerIndex + 2) % sortedPlayers.length;
              const playerIndex = sortedPlayers.findIndex(
                (p) => p._id === player._id
              );
              const isSmallBlind = playerIndex === smallBlindIndex && !!currentHand;
              const isBigBlind = playerIndex === bigBlindIndex && !!currentHand;
              const isActive =
                currentHand?.activePlayerPosition === player.seatPosition;

              return (
                <PlayerPosition
                  key={player._id}
                  name={player.userName || "Unknown"}
                  chips={player.chips}
                  currentBet={handState?.currentBet || 0}
                  status={handState?.status || player.status}
                  isActive={isActive}
                  isDealer={isDealer}
                  isSmallBlind={isSmallBlind}
                  isBigBlind={isBigBlind}
                />
              );
            })}
          </div>

          {/* Game status messages */}
          {!currentHand && (
            <div className="text-center bg-white rounded-lg shadow-xl p-6">
              <p className="text-gray-700 mb-4">
                {isCreator
                  ? "Ready to start a new hand?"
                  : "Waiting for host to start the next hand..."}
              </p>
              {canStartNewHand && (
                <button
                  onClick={() => void handleStartNewHand()}
                  className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700"
                >
                  Start New Hand
                </button>
              )}
            </div>
          )}

          {currentHand && currentHand.currentBettingRound === "complete" && (
            <div className="text-center bg-white rounded-lg shadow-xl p-6">
              <p className="text-gray-700 mb-4">
                Hand Complete! 
                {isCreator
                  ? " Click below to start the next hand."
                  : " Waiting for host to start the next hand..."}
              </p>
              {canStartNewHand && (
                <button
                  onClick={() => void handleStartNewHand()}
                  className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700"
                >
                  Start New Hand
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Betting interface (fixed at bottom on mobile) */}
      {!!(currentHand &&
        myHandState &&
        myHandState.status !== "folded" &&
        myHandState.status !== "all-in" &&
        currentHand.currentBettingRound !== "complete") && (
          <div className="sticky bottom-0">
            {!isMyTurn && (
              <div className="bg-gray-800 text-white text-center py-2 text-sm">
                Waiting for other players...
              </div>
            )}
            <BettingInterface
              myChips={myPlayer.chips}
              currentBet={currentHand.currentBet}
              myCurrentBet={myHandState.currentBet}
              bettingIncrement={game.settings.bettingIncrement}
              onCommit={(amount) => void handleCommitAction(amount)}
              disabled={!isMyTurn}
            />
          </div>
        )}

      {/* Status when folded or all-in */}
      {!!(currentHand &&
        myHandState &&
        (myHandState.status === "folded" || myHandState.status === "all-in") &&
        currentHand.currentBettingRound !== "complete") && (
          <div className="sticky bottom-0 bg-gray-800 text-white text-center py-4">
            <p className="font-bold text-lg">
              {myHandState.status === "folded" ? "You Folded" : "All-In!"}
            </p>
            <p className="text-sm text-gray-300">
              Waiting for hand to complete...
            </p>
          </div>
        )}
    </div>
  );
}

