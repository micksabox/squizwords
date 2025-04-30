import { GuardianCrossword, GuessGrid } from '../../mycrossword/lib/types.js';
import { getGameClueGuesses } from './gamegrid.js';
import { poseidon2Hash } from '@zkpassport/poseidon2';
import { stringToHex } from 'viem';

// Constant matching the Noir circuit
// Exported for potential reuse or testing
export const MAX_SOLUTION_WORDS = 100;

/**
 * Calculates a Poseidon2 hash of the encoded and padded array of sorted clue guesses.
 * This is designed to be compatible with the Noir circuit verifier.
 *
 * @param gameData The crossword game data containing clue definitions.
 * @param grid The current state of the user's guesses in the grid.
 * @returns The Poseidon2 hash of the padded array of encoded guesses as a bigint.
 */
export const calculateSortedGuessesHash = (
  gameData: GuardianCrossword,
  grid: GuessGrid,
): bigint => {
  // 1. Get guesses for all clues { id: string, guess: string }[]
  const clueGuesses = getGameClueGuesses(gameData, grid);

  // 2. Create a map for quick lookup
  const guessMap = new Map(clueGuesses.map(item => [item.id, item.guess]));

  // 3. Map game entries to include direction and guess for sorting
  const cluesWithDetails = gameData.entries.map(entry => ({
    id: entry.id,
    direction: entry.direction,
    guess: guessMap.get(entry.id) || '',
  }));

  // 4. Sort clues: down before across, then by ID
  cluesWithDetails.sort((a, b) => {
    if (a.direction === 'down' && b.direction === 'across') return -1;
    if (a.direction === 'across' && b.direction === 'down') return 1;
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    return 0;
  });

  // 5. Get the sorted guess strings
  const sortedGuesses = cluesWithDetails.map(c => c.guess);

  // 6. Encode each guess string to a bigint Field element
  const encodedFields = sortedGuesses.map(guess => BigInt(stringToHex(guess)));

  // 7. Create the padded array matching the circuit input size
  const paddedFields = Array(MAX_SOLUTION_WORDS).fill(0n);
  for (let i = 0; i < encodedFields.length && i < MAX_SOLUTION_WORDS; i++) {
      paddedFields[i] = encodedFields[i];
  }

  // 8. Calculate the Poseidon2 hash of the padded bigint array
  const finalHash = poseidon2Hash(paddedFields);

  // 9. Return the calculated hash
  return finalHash;
};


/**
 * Prepares the guesses inputs for the circuit
 * @param guesses - The array of guesses to prepare
 * @returns The padded array of encoded guesses
 */
export function prepareHashInput(guesses: string[]): bigint[] {
  const encodedFields = guesses.map(guess => stringToHex(guess));
  const paddedFields = Array(MAX_SOLUTION_WORDS).fill("0");
  // Copy encoded fields into the beginning of the padded array
  for (let i = 0; i < encodedFields.length && i < MAX_SOLUTION_WORDS; i++) {
      paddedFields[i] = encodedFields[i];
  }
  return paddedFields;
}
