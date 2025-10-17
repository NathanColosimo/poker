import PlayerAvatar from "./PlayerAvatar";
import ChipDisplay from "./ChipDisplay";

interface PlayerPositionProps {
  name: string;
  chips: number;
  currentBet: number;
  status: string;
  isActive: boolean;
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
}

export default function PlayerPosition({
  name,
  chips,
  currentBet,
  status,
  isActive,
  isDealer,
  isSmallBlind,
  isBigBlind,
}: PlayerPositionProps) {
  const getStatusColor = () => {
    if (status === "folded") return "bg-gray-400";
    if (status === "all-in") return "bg-purple-600";
    if (isActive) return "bg-yellow-400 animate-pulse";
    return "bg-green-600";
  };

  const getStatusText = () => {
    if (status === "folded") return "FOLDED";
    if (status === "all-in") return "ALL-IN";
    return "";
  };

  return (
    <div
      className={`${getStatusColor()} p-3 rounded-lg shadow-lg border-2 ${
        isActive ? "border-yellow-600" : "border-transparent"
      }`}
    >
      <PlayerAvatar
        name={name}
        isDealer={isDealer}
        isSmallBlind={isSmallBlind}
        isBigBlind={isBigBlind}
        className="mb-2"
      />
      
      <div className="text-white text-sm space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs opacity-90">Chips:</span>
          <ChipDisplay amount={chips} className="text-white" />
        </div>
        
        {currentBet > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-xs opacity-90">Bet:</span>
            <ChipDisplay amount={currentBet} className="text-yellow-300" />
          </div>
        )}
        
        {getStatusText() && (
          <div className="text-center font-bold text-xs bg-black bg-opacity-30 py-1 rounded">
            {getStatusText()}
          </div>
        )}
      </div>
    </div>
  );
}

