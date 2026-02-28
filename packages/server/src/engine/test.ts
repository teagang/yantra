/**
 * Terminal test script — simulates a 2-player game to smoke-test the engine.
 * Run with:  npm run test -w packages/server
 */

import { createInitialState, applyMove } from './gameStateMachine.js';

const players = [
  { playerId: 'p1', username: 'Alice', rating: 1000 },
  { playerId: 'p2', username: 'Bob', rating: 1000 },
];

let state = createInitialState(
  'test-game-1',
  'TESTXX',
  players,
  'unranked',
  false,
  60
);

console.log('=== Yantra Engine Test ===\n');
console.log(`Pool size: ${state.tilePool.length}`);
console.log(`Alice hand: ${JSON.stringify(state.players[0].hand.map((t) => `${t.colour}-${t.value}`))}`);
console.log(`Bob hand:   ${JSON.stringify(state.players[1].hand.map((t) => `${t.colour}-${t.value}`))}`);
console.log('\n--- Turn 1: Alice tries to skip ---');

let result = applyMove(state, 'p1', { type: 'skip' });
console.log(`Success: ${result.success}`);
state = result.updatedState;
console.log(`Current turn: ${state.players[state.currentTurnIndex].username}`);

console.log('\n--- Turn 2: Bob skips ---');
result = applyMove(state, 'p2', { type: 'skip' });
state = result.updatedState;
console.log(`Consecutive skips: ${state.consecutiveSkips}`);

console.log('\n--- Turn 3: Alice tries to place a single tile on center ---');
const aliceHand = state.players[0].hand;
const firstTile = aliceHand[0];
result = applyMove(state, 'p1', {
  type: 'place',
  placements: [{ tile: firstTile, row: 7, col: 7 }],
});
if (result.success) {
  console.log(`Placed ${firstTile.colour}-${firstTile.value} on center! Score: ${result.scoreGained}`);
} else {
  console.log(`Failed: ${result.reason}`);
}
state = result.updatedState;

console.log('\n--- Final state ---');
console.log(`Alice score: ${state.players[0].score}`);
console.log(`Bob score:   ${state.players[1].score}`);
console.log(`Status: ${state.status}`);
console.log(`Current turn: ${state.players[state.currentTurnIndex]?.username ?? 'finished'}`);
console.log('\nTest complete.');
