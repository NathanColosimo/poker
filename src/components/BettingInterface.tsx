import { useState } from "react";
import ChipDisplay from "./ChipDisplay";

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
    <div className="bg-white rounded-t-3xl shadow-2xl p-4 border-t-4 border-green-600">
      <div className="mb-4 text-center">
        <div className="text-sm text-gray-600">Your Chips</div>
        <ChipDisplay amount={myChips} className="text-2xl text-green-700" />
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={decrement}
            disabled={disabled || betAmount <= 0}
            className="bg-gray-300 text-gray-700 font-bold w-10 h-10 rounded-lg hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed active:scale-95 transition-transform"
          >
            -
          </button>
          
          <div className="flex-1 text-center">
            <input
              type="number"
              value={betAmount}
              onChange={(e) => {
                const val = Number(e.target.value);
                setBetAmount(Math.min(Math.max(0, val), myChips));
              }}
              disabled={disabled}
              className="w-full text-center text-xl font-bold border-2 border-gray-300 rounded-lg p-2 focus:border-green-500 focus:outline-none"
            />
          </div>
          
          <button
            onClick={increment}
            disabled={disabled || betAmount >= myChips}
            className="bg-gray-300 text-gray-700 font-bold w-10 h-10 rounded-lg hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed active:scale-95 transition-transform"
          >
            +
          </button>
        </div>

        <div className="text-xs text-gray-600 text-center">
          To Call: <ChipDisplay amount={amountToCall} /> | Min Raise:{" "}
          <ChipDisplay amount={minRaise} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleFold}
          disabled={disabled}
          className="bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed active:scale-95 transition-transform"
        >
          Fold
        </button>

        <button
          onClick={handleCall}
          disabled={disabled || myChips === 0}
          className="bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed active:scale-95 transition-transform"
        >
          {amountToCall === 0 ? "Check" : `Call ${amountToCall}`}
        </button>

        <button
          onClick={handleRaise}
          disabled={disabled || betAmount < minRaise || betAmount > myChips}
          className="bg-yellow-600 text-white font-bold py-3 rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed active:scale-95 transition-transform"
        >
          Raise
        </button>

        <button
          onClick={handleAllIn}
          disabled={disabled || myChips === 0}
          className="bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed active:scale-95 transition-transform"
        >
          All-In
        </button>
      </div>
    </div>
  );
}

