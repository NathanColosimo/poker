interface ChipDisplayProps {
  amount: number;
  className?: string;
}

export default function ChipDisplay({ amount, className = "" }: ChipDisplayProps) {
  return (
    <span className={`font-bold ${className}`}>
      {amount.toLocaleString()}
    </span>
  );
}

