# Texas Hold'em Chip Manager

A mobile-optimized poker chip management app for playing Texas Hold'em with physical cards but without physical chips. Perfect for home games where you want to play with real cards but track chips digitally.

## Features

- **Invite-based Games**: Create a game and share an invite code with friends
- **Full Texas Hold'em Betting**: Complete betting rounds (pre-flop, flop, turn, river) with proper action validation
- **Auto-rotating Dealer & Blinds**: Automatically rotates dealer button and collects blinds each hand
- **Real-time Updates**: All players see chip counts and pot updates instantly via Convex
- **Mobile-First Design**: Optimized for portrait mobile screens with touch-friendly controls
- **Chip Management**: Customizable initial stacks, blinds, and betting increments

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Convex (real-time database and serverless functions)
- **Auth**: Convex Auth (password-based authentication)

## How It Works

1. **Create a Game**: Set initial chip stacks, blinds, and betting increments
2. **Invite Players**: Share the invite code with your friends
3. **Approve Join Requests**: Game creator approves players who want to join
4. **Arrange Seats**: Creator arranges players around the virtual table
5. **Play Poker**: Deal physical cards, use the app to manage bets and chip counts
6. **Track Everything**: App handles chip deductions, pot calculations, and turn order

## Game Flow

- Players play with physical cards
- Each betting round, players enter their bet amount and press "Commit"
- App validates all actions (call/raise/fold/all-in)
- Dealer and blinds automatically rotate to the next player after each hand
- Players who run out of chips are marked as "out"

## Get Started

### Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm run dev
```

This will start both the Convex backend and the Vite frontend in development mode.

### First Time Setup

1. Sign up for a free [Convex account](https://convex.dev/)
2. Run `pnpm run dev` and follow the prompts to create a new Convex project
3. The Convex dashboard will open automatically

## Project Structure

```
├── convex/              # Backend (Convex functions and schema)
│   ├── games.ts        # Game management (create, join, approve)
│   ├── hands.ts        # Hand management (betting, actions)
│   ├── queries.ts      # Query functions for game state
│   └── schema.ts       # Database schema
├── src/
│   ├── pages/          # Main page components
│   ├── components/     # Reusable UI components
│   └── App.tsx         # Main app component with routing
└── package.json
```

## Game Settings

When creating a game, you can customize:

- **Initial Chip Stack**: Starting chips for each player (e.g., 1000)
- **Small Blind**: Amount for small blind (e.g., 5)
- **Big Blind**: Amount for big blind (e.g., 10)
- **Betting Increment**: Minimum raise amount (e.g., 10)

## Learn More

- [Convex Documentation](https://docs.convex.dev/)
- [Convex Auth Documentation](https://labs.convex.dev/auth)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

## License

See LICENSE.txt
