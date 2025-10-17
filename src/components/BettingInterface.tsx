import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Minus, Plus } from "lucide-react"

interface BettingInterfaceProps {
  handId: Id<"hands">
  myChips: number
  currentBet: number
  myCurrentBet: number
  bettingIncrement: number
  isMyTurn: boolean
}

export function BettingInterface({
  handId,
  myChips,
  currentBet,
  myCurrentBet,
  bettingIncrement,
  isMyTurn,
}: BettingInterfaceProps) {
  const commitAction = useMutation(api.hands.commitAction)
  const [betAmount, setBetAmount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const amountToCall = currentBet - myCurrentBet

  const handleCommit = async () => {
    setError(null)
    setIsSubmitting(true)
    try {
      await commitAction({ handId, betAmount })
      setBetAmount(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to commit action")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCheck = async () => {
    setError(null)
    setIsSubmitting(true)
    try {
      await commitAction({ handId, betAmount: 0 })
      setBetAmount(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFold = async () => {
    setError(null)
    setIsSubmitting(true)
    try {
      await commitAction({ handId, betAmount: 0, isFold: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fold")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCall = () => {
    setBetAmount(Math.min(amountToCall, myChips))
  }

  const handleRaise = (amount: number) => {
    setBetAmount(Math.min(amountToCall + amount, myChips))
  }

  const handleAllIn = () => {
    setBetAmount(myChips)
  }

  const adjustBet = (delta: number) => {
    setBetAmount((prev) => Math.max(0, Math.min(myChips, prev + delta)))
  }

  if (!isMyTurn) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Waiting for other players...
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Your Turn</span>
          <span className="text-sm font-normal text-muted-foreground">
            You have {myChips} chips
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Amount to Call */}
        {amountToCall > 0 && (
          <div className="text-sm text-muted-foreground">
            Amount to call: <span className="font-bold text-foreground">{amountToCall}</span>
          </div>
        )}

        {/* Bet Amount Input */}
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() => adjustBet(-bettingIncrement)}
            disabled={betAmount === 0}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Math.min(myChips, parseInt(e.target.value) || 0))}
            className="text-center text-lg font-bold"
            min={0}
            max={myChips}
          />
          <Button
            size="icon"
            variant="outline"
            onClick={() => adjustBet(bettingIncrement)}
            disabled={betAmount >= myChips}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={handleCall}
            disabled={amountToCall === 0 || amountToCall > myChips}
          >
            Call {amountToCall > 0 && `(${Math.min(amountToCall, myChips)})`}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleRaise(bettingIncrement)}
            disabled={myChips < amountToCall + bettingIncrement}
          >
            Raise {bettingIncrement}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleRaise(bettingIncrement * 2)}
            disabled={myChips < amountToCall + bettingIncrement * 2}
          >
            Raise {bettingIncrement * 2}
          </Button>
          <Button variant="outline" onClick={handleAllIn}>
            All-In ({myChips})
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Main Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button
            variant="destructive"
            onClick={() => void handleFold()}
            disabled={isSubmitting}
          >
            Fold
          </Button>
          {amountToCall === 0 && betAmount === 0 ? (
            <Button
              onClick={() => void handleCheck()}
              disabled={isSubmitting}
              variant="default"
            >
              {isSubmitting ? "Checking..." : "Check"}
            </Button>
          ) : (
            <Button
              onClick={() => void handleCommit()}
              disabled={isSubmitting || betAmount === 0}
            >
              {isSubmitting ? "Committing..." : `Commit ${betAmount > 0 ? `(${betAmount})` : ""}`}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

