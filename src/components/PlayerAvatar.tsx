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
        <div className="bg-green-700 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm">
          {name.slice(0, 2).toUpperCase()}
        </div>
        {isDealer && (
          <div className="absolute -top-1 -right-1 bg-yellow-400 text-black w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">
            D
          </div>
        )}
        {isSmallBlind && (
          <div className="absolute -bottom-1 -right-1 bg-blue-400 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">
            SB
          </div>
        )}
        {isBigBlind && (
          <div className="absolute -bottom-1 -right-1 bg-red-400 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">
            BB
          </div>
        )}
      </div>
      <span className="text-sm font-medium truncate max-w-[100px]">{name}</span>
    </div>
  );
}

