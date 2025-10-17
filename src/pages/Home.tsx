import { JoinGameForm } from "@/components/JoinGameForm"
import { CreateGameForm } from "@/components/CreateGameForm"

export function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Texas Hold'em</h1>
          <p className="text-muted-foreground">Chip Manager</p>
        </div>

        <JoinGameForm />
        <CreateGameForm />
      </div>
    </div>
  )
}
