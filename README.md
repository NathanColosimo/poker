# Texas Hold'em Chip Manager

A mobile-optimized poker chip management app for in-person Texas Hold'em games. Play with physical cards while the app handles all chip tracking, betting rounds, and game state.

## Features

- **Invite-Based Games**: Create a game with a custom invite code and approve join requests
- **Full Texas Hold'em Betting**: Complete betting rounds (pre-flop, flop, turn, river) with proper bet/call/raise/fold mechanics
- **Auto-Rotating Dealer & Blinds**: Automatically rotates dealer button and blind positions each hand
- **Real-Time Updates**: Powered by Convex for instant synchronization across all players
- **Mobile-First**: Optimized for phones and tablets with touch-friendly controls
- **Customizable Settings**:
  - Initial chip stack
  - Small blind amount
  - Big blind amount
  - Betting increment

## Technology Stack

- **Frontend**: React 19 + Vite
- **Backend**: Convex (real-time database and backend)
- **Styling**: Tailwind CSS v4
- **Authentication**: Convex Auth

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will open at `http://localhost:5173` with Convex backend running in the background.

### First Time Setup

1. Create a Convex account at https://convex.dev
2. Run `pnpm dev` and follow the prompts to link your project
3. The database schema will be automatically deployed

## How to Play

### Creating a Game

1. Sign in with email/password
2. Click "Create Game"
3. Set your game settings:
   - Initial chip stack (e.g., 1000)
   - Small blind (e.g., 10)
   - Big blind (e.g., 20)
   - Betting increment (e.g., 10)
4. Set an invite code
5. Share the invite code with your friends

### Joining a Game

1. Sign in with email/password
2. Click "Join Game"
3. Enter the invite code
4. Wait for the game creator to approve your request

### Game Flow

1. **Lobby**: Creator approves pending players
2. **Seat Ordering**: Creator arranges players in seat order
3. **Game Start**: First hand begins with dealer button and blinds
4. **Betting Rounds**: Each player sets their bet amount and commits:
   - The app enforces proper bet/call/raise amounts
   - Automatically handles all-ins and folds
   - Advances to next round when all players have acted
5. **Next Hand**: Creator starts the next hand when ready

## Game Rules

- Texas Hold'em only
- Players must have enough chips to call or fold
- Raises must be at least the betting increment above current bet
- Players who run out of chips are eliminated
- Dealer button and blinds auto-rotate clockwise each hand
- Once the game starts, no new players can join (feature coming later)

## Development

```bash
# Run frontend and backend
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Lint code
pnpm lint
```

## Project Structure

```
poker/
├── convex/              # Backend code (Convex functions)
│   ├── games.ts        # Game management functions
│   ├── hands.ts        # Hand/betting logic
│   ├── queries.ts      # Query functions
│   └── schema.ts       # Database schema
├── src/
│   ├── components/     # Reusable React components
│   ├── pages/          # Page components
│   ├── App.tsx         # Main app with routing
│   └── main.tsx        # Entry point
└── public/             # Static assets
```

## License

See LICENSE.txt
