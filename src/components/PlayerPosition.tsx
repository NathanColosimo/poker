import PlayerAvatar from "./PlayerAvatar";
import ChipDisplay from "./ChipDisplay";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    if (status === "folded") return "bg-muted";
    if (status === "all-in") return "bg-purple-600 text-white";
    if (isActive) return "bg-yellow-400 text-black animate-pulse";
    return "bg-card";
  };

  const getStatusText = () => {
    if (status === "folded") return "FOLDED";
    if (status === "all-in") return "ALL-IN";
    return "";
  };

  return (
    <Card
      className={`${getStatusColor()} border-2 ${
        isActive ? "border-yellow-600" : "border-border"
      }`}
    >
      <CardContent className="p-3">
        <PlayerAvatar
          name={name}
          isDealer={isDealer}
          isSmallBlind={isSmallBlind}
          isBigBlind={isBigBlind}
          className="mb-2"
        />
        
        <div className="space-y-1 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-xs opacity-90">Chips:</span>
            <ChipDisplay amount={chips} />
          </div>
          
          {currentBet > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-xs opacity-90">Bet:</span>
              <ChipDisplay amount={currentBet} className="text-yellow-600 dark:text-yellow-400" />
            </div>
          )}
          
          {getStatusText() && (
            <Badge variant="secondary" className="w-full justify-center text-xs">
              {getStatusText()}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
