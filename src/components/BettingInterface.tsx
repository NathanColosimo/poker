import { useState } from "react";
import ChipDisplay from "./ChipDisplay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface BettingInterfaceProps {
  myChips: number;
  currentBet: number;
  myCurrentBet: number;
  bettingIncrement: number;
  onCommit: (amount: number) => void;
  disabled: boolean;
}

export default function BettingInterface({
  myChips,
  currentBet,
  myCurrentBet,
  bettingIncrement,
  onCommit,
  disabled,
}: BettingInterfaceProps) {
  const [betAmount, setBetAmount] = useState(0);

  const amountToCall = currentBet - myCurrentBet;
  const minRaise = amountToCall + bettingIncrement;

  const handleFold = () => {
    onCommit(0);
    setBetAmount(0);
  };

  const handleCall = () => {
    const amount = Math.min(amountToCall, myChips);
    onCommit(amount);
    setBetAmount(0);
  };

  const handleRaise = () => {
    if (betAmount >= minRaise && betAmount <= myChips) {
      onCommit(betAmount);
      setBetAmount(0);
    }
  };

  const handleAllIn = () => {
    onCommit(myChips);
    setBetAmount(0);
  };

  const increment = () => {
    setBetAmount((prev) => Math.min(prev + bettingIncrement, myChips));
  };

  const decrement = () => {
    setBetAmount((prev) => Math.max(prev - bettingIncrement, 0));
  };

  return (
    <Card className="rounded-t-3xl rounded-b-none border-t-4 border-t-primary shadow-2xl">
      <CardContent className="p-4">
        <div className="mb-4 text-center">
          <div className="text-sm text-muted-foreground">Your Chips</div>
          <ChipDisplay amount={myChips} className="text-2xl font-bold" />
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Button
              onClick={decrement}
              disabled={disabled || betAmount <= 0}
              size="icon"
              variant="outline"
            >
              -
            </Button>
            
            <Input
              type="number"
              value={betAmount}
              onChange={(e) => {
                const val = Number(e.target.value);
                setBetAmount(Math.min(Math.max(0, val), myChips));
              }}
              disabled={disabled}
              className="text-center text-xl font-bold"
            />
            
            <Button
              onClick={increment}
              disabled={disabled || betAmount >= myChips}
              size="icon"
              variant="outline"
            >
              +
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            To Call: <ChipDisplay amount={amountToCall} /> | Min Raise:{" "}
            <ChipDisplay amount={minRaise} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleFold}
            disabled={disabled}
            variant="destructive"
            size="lg"
          >
            Fold
          </Button>

          <Button
            onClick={handleCall}
            disabled={disabled || myChips === 0}
            variant="default"
            size="lg"
          >
            {amountToCall === 0 ? "Check" : `Call ${amountToCall}`}
          </Button>

          <Button
            onClick={handleRaise}
            disabled={disabled || betAmount < minRaise || betAmount > myChips}
            variant="secondary"
            size="lg"
          >
            Raise
          </Button>

          <Button
            onClick={handleAllIn}
            disabled={disabled || myChips === 0}
            className="bg-purple-600 hover:bg-purple-700 text-white"
            size="lg"
          >
            All-In
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
