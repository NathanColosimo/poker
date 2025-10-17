import { JoinGameForm } from "@/components/JoinGameForm"
import { CreateGameForm } from "@/components/CreateGameForm"
import { ProfileSection } from "@/components/ProfileSection"
import { GamesList } from "@/components/GamesList"

export function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <ProfileSection />
        <GamesList />
        <JoinGameForm />
        <CreateGameForm />
      </div>
    </div>
  )
}
