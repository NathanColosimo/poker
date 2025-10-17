import ChipDisplay from "./ChipDisplay";
import { Card, CardContent } from "@/components/ui/card";

interface PotDisplayProps {
  amount: number;
}

export default function PotDisplay({ amount }: PotDisplayProps) {
  return (
    <Card className="bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-700 border-2">
      <CardContent className="p-4">
        <div className="text-center">
          <div className="text-yellow-900 text-xs font-medium mb-1">POT</div>
          <ChipDisplay amount={amount} className="text-2xl text-white font-bold" />
        </div>
      </CardContent>
    </Card>
  );
}
