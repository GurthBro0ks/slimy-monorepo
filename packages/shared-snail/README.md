# @slimy/shared-snail

Core "snail" domain logic and business rules for Slimy.ai

## Purpose

Provides the core business logic and domain models for the Slimy.ai snail game, including:
- Snail state machine and lifecycle
- Game mechanics (feeding, battling, upgrading)
- Validation logic and business rules
- Domain events
- Pure, framework-agnostic business logic

## Current Status

⚠️ **SCAFFOLDING ONLY** - This package is currently a placeholder. Code needs to be extracted from:
- `apps/admin-api/vendor/slimy-core/` - Core domain logic
- Scattered game logic across apps
- Business rules in API routes

## Proposed Tech Stack

- **TypeScript** - Type-safe domain models
- **Pure Functions** - Framework-agnostic logic
- **Domain Events** - Event-driven architecture
- **No external dependencies** - Pure business logic only

## Proposed API

### Snail Entity

```typescript
import { Snail, createSnail, updateSnail } from '@slimy/shared-snail';

// Create a new snail
const snail = createSnail({
  ownerId: 'user-123',
  name: 'Speedy',
  type: 'garden',
});

// Update snail
const updatedSnail = updateSnail(snail, {
  level: snail.level + 1,
  experience: 0,
});
```

### Snail Actions

```typescript
import { feedSnail, battleSnail, restSnail } from '@slimy/shared-snail';

// Feed snail
const result = feedSnail(snail, { foodType: 'lettuce', amount: 5 });
if (result.success) {
  console.log(`Snail fed! New hunger: ${result.snail.hunger}`);
}

// Battle snails
const battleResult = battleSnail(snail1, snail2);
console.log(`Winner: ${battleResult.winner.name}`);
console.log(`Experience gained: ${battleResult.experienceGained}`);

// Rest snail
const restedSnail = restSnail(snail, { duration: 3600 }); // 1 hour
```

### Validation

```typescript
import { validateSnailAction, canPerformAction } from '@slimy/shared-snail';

// Check if action can be performed
if (canPerformAction(snail, 'battle')) {
  // Perform battle
} else {
  console.log('Snail is too tired to battle');
}

// Validate action with detailed result
const validation = validateSnailAction(snail, 'feed', { foodType: 'lettuce' });
if (!validation.valid) {
  console.error(validation.errors);
}
```

### State Machine

```typescript
import { SnailStateMachine, SnailState } from '@slimy/shared-snail';

// Create state machine
const sm = new SnailStateMachine(snail);

// Transition states
sm.transition(SnailState.FEEDING);
// Can only transition to valid states based on current state

// Get available transitions
const available = sm.getAvailableTransitions();
// ['resting', 'idle']
```

### Experience & Leveling

```typescript
import { addExperience, calculateLevel, getRequiredExperience } from '@slimy/shared-snail';

// Add experience
const result = addExperience(snail, 100);
if (result.leveledUp) {
  console.log(`Leveled up to ${result.snail.level}!`);
}

// Calculate level from experience
const level = calculateLevel(5000); // 15

// Get required experience for next level
const required = getRequiredExperience(10); // 2000
```

### Combat System

```typescript
import { calculateDamage, calculateDefense, determineBattleOutcome } from '@slimy/shared-snail';

// Calculate damage
const damage = calculateDamage(attacker, defender);

// Calculate defense
const defense = calculateDefense(defender);

// Determine battle outcome
const outcome = determineBattleOutcome(snail1, snail2);
// Returns: { winner, loser, turns, experienceGained, itemsDropped }
```

## Proposed Directory Structure

```
packages/shared-snail/
├── src/
│   ├── index.ts              # Main exports
│   ├── entities/             # Domain entities
│   │   ├── snail.ts          # Snail entity and factory
│   │   ├── item.ts           # Item entity
│   │   └── guild.ts          # Guild entity
│   ├── actions/              # Snail actions
│   │   ├── feed.ts           # Feeding logic
│   │   ├── battle.ts         # Battle logic
│   │   ├── rest.ts           # Resting logic
│   │   ├── upgrade.ts        # Upgrade logic
│   │   └── inventory.ts      # Inventory management
│   ├── state/                # State management
│   │   ├── machine.ts        # State machine
│   │   ├── states.ts         # State definitions
│   │   └── transitions.ts    # Valid transitions
│   ├── mechanics/            # Game mechanics
│   │   ├── experience.ts     # XP and leveling
│   │   ├── combat.ts         # Combat calculations
│   │   ├── stats.ts          # Stat calculations
│   │   └── items.ts          # Item effects
│   ├── validation/           # Validation logic
│   │   ├── rules.ts          # Business rules
│   │   ├── validators.ts     # Validation functions
│   │   └── errors.ts         # Validation errors
│   ├── events/               # Domain events
│   │   ├── types.ts          # Event types
│   │   ├── emitter.ts        # Event emitter
│   │   └── handlers.ts       # Event handlers
│   └── types/                # TypeScript types
│       ├── snail.ts
│       ├── battle.ts
│       └── item.ts
├── tests/
│   ├── entities/
│   ├── actions/
│   ├── mechanics/
│   └── validation/
├── package.json
├── tsconfig.json
└── README.md
```

## Migration Checklist

### Code to Extract

1. **From `apps/admin-api/vendor/slimy-core/`**:
   - All domain logic and business rules
   - Entity definitions
   - Game mechanics

2. **From API routes**:
   - Validation logic
   - Business rules scattered in controllers
   - Action handlers

3. **From services**:
   - Snail service logic
   - Battle service logic
   - Item service logic

### Domain Model

Define core domain entities:

```typescript
// Snail entity
export interface Snail {
  id: string;
  ownerId: string;
  name: string;
  type: SnailType;
  level: number;
  experience: number;
  stats: SnailStats;
  status: SnailStatus;
  hunger: number;
  energy: number;
  health: number;
  inventory: Item[];
  createdAt: Date;
  updatedAt: Date;
}

// Snail stats
export interface SnailStats {
  strength: number;
  defense: number;
  speed: number;
  intelligence: number;
}

// Snail types
export enum SnailType {
  GARDEN = 'garden',
  SEA = 'sea',
  LAND = 'land',
  HYBRID = 'hybrid',
}

// Snail status
export enum SnailStatus {
  IDLE = 'idle',
  FEEDING = 'feeding',
  BATTLING = 'battling',
  RESTING = 'resting',
  FAINTED = 'fainted',
}
```

### Dependencies to Install

```json
{
  "devDependencies": {
    "typescript": "^5.3.0",
    "vitest": "^2.0.0"
  }
}
```

Note: This package should have ZERO runtime dependencies to keep it pure.

### Integration Steps

1. Create package structure
2. Extract domain entities from vendor code
3. Extract game mechanics (combat, XP, etc.)
4. Extract validation logic
5. Create state machine
6. Add domain events
7. Write comprehensive unit tests (100% coverage goal)
8. Update `apps/admin-api` to use `@slimy/shared-snail`
9. Update `apps/bot` to use `@slimy/shared-snail`
10. Remove duplicate logic from apps

## Business Rules

Document all business rules in code:

```typescript
/**
 * Business Rule: Feeding
 * - Snail must not be fainted
 * - Snail must have hunger > 0
 * - Food type must match snail type preferences
 * - Energy cost: 5 per feeding
 */
export function feedSnail(snail: Snail, food: Food): FeedResult {
  // Validate
  if (snail.status === SnailStatus.FAINTED) {
    return { success: false, error: 'Snail is fainted' };
  }

  if (snail.hunger <= 0) {
    return { success: false, error: 'Snail is not hungry' };
  }

  if (snail.energy < 5) {
    return { success: false, error: 'Snail is too tired' };
  }

  // Apply feeding
  const newHunger = Math.max(0, snail.hunger - food.satiation);
  const newEnergy = snail.energy - 5;

  return {
    success: true,
    snail: {
      ...snail,
      hunger: newHunger,
      energy: newEnergy,
    },
  };
}
```

## Domain Events

Emit events for important domain changes:

```typescript
import { emitEvent, SnailEvent } from '@slimy/shared-snail';

// After leveling up
emitEvent(SnailEvent.LEVELED_UP, {
  snailId: snail.id,
  oldLevel: snail.level - 1,
  newLevel: snail.level,
  timestamp: new Date(),
});

// After battle
emitEvent(SnailEvent.BATTLE_COMPLETED, {
  winnerId: winner.id,
  loserId: loser.id,
  experienceGained: 100,
  timestamp: new Date(),
});
```

## Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch
```

### Test Coverage Goals

- **Entities**: 100% coverage
- **Actions**: 100% coverage
- **Mechanics**: 100% coverage
- **Validation**: 100% coverage

### Example Test

```typescript
import { describe, it, expect } from 'vitest';
import { feedSnail, createSnail } from '@slimy/shared-snail';

describe('feedSnail', () => {
  it('should reduce hunger when fed', () => {
    const snail = createSnail({ name: 'Test', hunger: 50, energy: 100 });
    const result = feedSnail(snail, { satiation: 20 });

    expect(result.success).toBe(true);
    expect(result.snail.hunger).toBe(30);
  });

  it('should fail if snail is fainted', () => {
    const snail = createSnail({ name: 'Test', status: 'fainted' });
    const result = feedSnail(snail, { satiation: 20 });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Snail is fainted');
  });
});
```

## Pure Functions

All functions should be pure (no side effects):

```typescript
// Good: Pure function
export function feedSnail(snail: Snail, food: Food): FeedResult {
  // Returns new snail, doesn't mutate input
  return {
    success: true,
    snail: { ...snail, hunger: snail.hunger - food.satiation },
  };
}

// Bad: Mutates input
export function feedSnail(snail: Snail, food: Food): void {
  snail.hunger -= food.satiation; // AVOID
}

// Bad: Has side effects
export function feedSnail(snail: Snail, food: Food): FeedResult {
  database.save(snail); // AVOID - side effect
  return { success: true, snail };
}
```

## Framework Agnostic

This package should NOT depend on:
- Express.js or any web framework
- Database libraries (Prisma, etc.)
- External services

It should be pure business logic that can be used in:
- REST APIs (Express, Fastify, etc.)
- GraphQL APIs
- gRPC services
- CLI tools
- Serverless functions
- Mobile apps (React Native)

## Used By

- `@slimy/admin-api` - API routes for snail actions
- `@slimy/bot` - Bot commands for snail interactions
- `@slimy/web` - Client-side snail logic (if needed)
- Future mobile apps

## Related Packages

- `@slimy/shared-codes` - Error codes and enums
- `@slimy/shared-types` - Shared TypeScript types (if any overlap)

## Game Balance

Document game balance parameters:

```typescript
export const GameBalance = {
  // Experience
  BASE_EXPERIENCE_PER_LEVEL: 100,
  EXPERIENCE_MULTIPLIER: 1.5,

  // Combat
  BASE_DAMAGE: 10,
  DAMAGE_PER_STRENGTH: 2,
  DEFENSE_REDUCTION: 0.1,

  // Energy
  MAX_ENERGY: 100,
  ENERGY_REGEN_PER_HOUR: 10,
  FEEDING_ENERGY_COST: 5,
  BATTLE_ENERGY_COST: 20,

  // Hunger
  MAX_HUNGER: 100,
  HUNGER_INCREASE_PER_HOUR: 5,

  // Leveling
  MAX_LEVEL: 100,
  STATS_PER_LEVEL: 5,
};
```

These values can be tuned for game balance without changing code.

## Future Enhancements

- **Skills System**: Active and passive skills
- **Equipment System**: Weapons, armor, accessories
- **Breeding System**: Combine snails to create offspring
- **Quests System**: Daily quests and achievements
- **Guild Wars**: Team-based battles
- **Trading System**: Player-to-player item trading
- **Seasonal Events**: Limited-time events with special rewards

## Documentation

Each function should have JSDoc comments:

```typescript
/**
 * Feeds a snail with the given food item.
 *
 * @param snail - The snail to feed
 * @param food - The food item to use
 * @returns Result containing updated snail or error
 *
 * @example
 * ```ts
 * const result = feedSnail(mySnail, { type: 'lettuce', satiation: 20 });
 * if (result.success) {
 *   console.log(`New hunger: ${result.snail.hunger}`);
 * }
 * ```
 */
export function feedSnail(snail: Snail, food: Food): FeedResult {
  // ...
}
```

## License

Proprietary - Slimy.ai
