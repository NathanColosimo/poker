import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface PokerTableProps {
  gameId: Id<"games">
  currentHand: {
    _id: Id<"hands">
    handNumber: number
    dealerPosition: number
    currentBettingRound: string
    pot: number
    currentBet: number
    activePlayerPosition: number
  } | null
}

interface PlayerCardProps {
  player: {
    _id: Id<"players">
    userId: Id<"users">
    chips: number
    seatPosition?: number
  }
  handState?: {
    status: "waiting" | "active" | "folded" | "all-in"
    currentBet: number
  }
  isDealer: boolean
  isActive: boolean
  isFolded: boolean
  isAllIn: boolean
}

function PlayerCard({ player, handState, isDealer, isActive, isFolded, isAllIn }: PlayerCardProps) {
  const user = useQuery(api.users.getUserById, { userId: player.userId })
  
  return (
    <div
      className={`
        relative p-4 rounded-lg border-2 transition-all
        ${isActive ? "border-primary bg-primary/10 ring-2 ring-primary/50" : "border-border"}
        ${isFolded ? "opacity-50" : ""}
      `}
    >
      {/* Dealer Button */}
      {isDealer && (
        <Badge
          variant="secondary"
          className="absolute -top-2 -right-2 bg-yellow-500 text-black border-yellow-600"
        >
          D
        </Badge>
      )}

      {/* Seat Position */}
      <div className="text-xs text-muted-foreground mb-1">
        Seat {(player.seatPosition ?? 0) + 1}
      </div>

      {/* Player Name */}
      <div className="font-medium text-sm mb-2">
        {user?.name || "Player"}
      </div>

      {/* Chips */}
      <div className="text-lg font-bold mb-2">{player.chips}</div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-1">
        {isFolded && (
          <Badge variant="outline" className="text-xs">
            Folded
          </Badge>
        )}
        {isAllIn && (
          <Badge variant="destructive" className="text-xs">
            All-In
          </Badge>
        )}
        {handState && handState.currentBet > 0 && !isFolded && (
          <Badge variant="secondary" className="text-xs">
            Bet: {handState.currentBet}
          </Badge>
        )}
      </div>
    </div>
  )
}

export function PokerTable({ gameId, currentHand }: PokerTableProps) {
  const players = useQuery(api.queries.getGamePlayers, { gameId })
  const playerHandStates = useQuery(
    api.queries.getPlayerHandStates,
    currentHand ? { handId: currentHand._id } : "skip"
  )

  const seatedPlayers = players
    ?.filter((p) => p.seatPosition !== undefined)
    .sort((a, b) => a.seatPosition! - b.seatPosition!) || []

  const getPlayerHandState = (playerId: Id<"players">) => {
    return playerHandStates?.find((state) => state.playerId === playerId)
  }

  return (
    <Card className="bg-gradient-to-br from-green-900/20 to-green-950/20 border-green-800/30">
      <CardContent className="p-6">
        {/* Pot Display */}
        <div className="text-center mb-8">
          <div className="inline-block bg-card border-2 border-primary/30 rounded-full px-8 py-4">
            <div className="text-sm text-muted-foreground">Pot</div>
            <div className="text-3xl font-bold">{currentHand?.pot || 0}</div>
            {currentHand && currentHand.currentBet > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                Current bet: {currentHand.currentBet}
              </div>
            )}
          </div>
        </div>

        {/* Community Cards Display */}
        {currentHand && (
          <div className="mb-8">
            <div className="text-center mb-3">
              <div className="text-sm text-muted-foreground">Community Cards</div>
            </div>
            <div className="flex justify-center gap-2">
              {(() => {
                // Determine number of cards based on betting round
                const round = currentHand.currentBettingRound
                let cardCount = 0
                
                if (round === "pre-flop") {
                  cardCount = 0
                } else if (round === "flop") {
                  cardCount = 3
                } else if (round === "turn") {
                  cardCount = 4
                } else {
                  // river, complete, selecting-winners, approving-winners, distributed
                  cardCount = 5
                }

                if (cardCount === 0) {
                  return (
                    <div className="text-sm text-muted-foreground flex items-center">
                      No community cards yet
                    </div>
                  )
                }

                // Render card placeholders
                return Array.from({ length: cardCount }).map((_, i) => (
                  <div
                    key={i}
                    className="w-16 h-24 bg-card border-2 border-primary/50 rounded-lg flex items-center justify-center shadow-lg"
                  >
                    <div className="text-2xl font-bold text-primary/30">?</div>
                  </div>
                ))
              })()}
            </div>
          </div>
        )}

        {/* Players Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {seatedPlayers.map((player) => {
            const handState = getPlayerHandState(player._id)
            const isDealer = currentHand?.dealerPosition === player.seatPosition
            const isActive = currentHand?.activePlayerPosition === player.seatPosition
            const isFolded = handState?.status === "folded"
            const isAllIn = handState?.status === "all-in"

            return (
              <PlayerCard
                key={player._id}
                player={player}
                handState={handState}
                isDealer={isDealer}
                isActive={isActive}
                isFolded={isFolded}
                isAllIn={isAllIn}
              />
            )
          })}
        </div>

        {/* Betting Round */}
        {currentHand && (
          <div className="mt-6 text-center">
            <Badge variant="outline" className="text-sm capitalize">
              {currentHand.currentBettingRound.replace("-", " ")}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

