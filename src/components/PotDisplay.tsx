import ChipDisplay from "./ChipDisplay";

interface PotDisplayProps {
  amount: number;
}

export default function PotDisplay({ amount }: PotDisplayProps) {
  return (
    <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 p-4 rounded-lg shadow-xl border-2 border-yellow-700">
      <div className="text-center">
        <div className="text-yellow-900 text-xs font-medium mb-1">POT</div>
        <ChipDisplay amount={amount} className="text-2xl text-white" />
      </div>
    </div>
  );
}

