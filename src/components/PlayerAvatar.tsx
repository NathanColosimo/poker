import { Badge } from "@/components/ui/badge";

interface PlayerAvatarProps {
  name: string;
  isDealer?: boolean;
  isSmallBlind?: boolean;
  isBigBlind?: boolean;
  className?: string;
}

export default function PlayerAvatar({
  name,
  isDealer,
  isSmallBlind,
  isBigBlind,
  className = "",
}: PlayerAvatarProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className="bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm">
          {name.slice(0, 2).toUpperCase()}
        </div>
        {isDealer && (
          <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-yellow-400 text-black hover:bg-yellow-400">
            D
          </Badge>
        )}
        {isSmallBlind && (
          <Badge className="absolute -bottom-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-blue-400 text-white hover:bg-blue-400">
            SB
          </Badge>
        )}
        {isBigBlind && (
          <Badge className="absolute -bottom-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-red-400 text-white hover:bg-red-400">
            BB
          </Badge>
        )}
      </div>
      <span className="text-sm font-medium truncate max-w-[100px]">{name}</span>
    </div>
  );
}
