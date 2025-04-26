import { GuardianCrossword, GuessGrid } from '../../mycrossword/lib/types.js';
import { getGameClueGuesses } from './gamegrid.js';
import { poseidon2Hash } from '@zkpassport/poseidon2';

/**
 * Calculates a Poseidon2 hash of all concatenated clue guesses,
 * sorted first by direction ('down' then 'across') and then by clue ID.
 *
 * @param gameData The crossword game data containing clue definitions.
 * @param grid The current state of the user's guesses in the grid.
 * @returns The Poseidon2 hash of the sorted and concatenated guesses as a bigint.
 */
export const calculateSortedGuessesHash = (
  gameData: GuardianCrossword,
  grid: GuessGrid,
): bigint => {
  // 1. Get guesses for all clues using the function from gamegrid.ts
  const clueGuesses = getGameClueGuesses(gameData, grid); // Returns { id: string, guess: string }[]

  // 2. Create a map for quick lookup of guesses by ID
  const guessMap = new Map(clueGuesses.map(item => [item.id, item.guess]));

  // 3. Map game entries to include the retrieved guess along with direction for sorting
  const cluesWithDetails = gameData.entries.map(entry => ({
    id: entry.id,
    direction: entry.direction,
    guess: guessMap.get(entry.id) || '', // Use the retrieved guess or empty string if not found
  }));

  // 4. Sort the clues based on the specified criteria
  cluesWithDetails.sort((a, b) => {
    // Primary sort: direction ('down' comes before 'across')
    if (a.direction === 'down' && b.direction === 'across') {
      return -1; // a comes first
    }
    if (a.direction === 'across' && b.direction === 'down') {
      return 1; // b comes first
    }

    // Secondary sort: clue ID (lexicographical comparison)
    if (a.id < b.id) {
      return -1; // a comes first
    }
    if (a.id > b.id) {
      return 1; // b comes first
    }

    // Should not happen if IDs are unique, but good practice
    return 0;
  });

  // 5. Concatenate all the sorted guesses into a single string
  const concatenatedGuesses = cluesWithDetails.map(c => c.guess).join('');

  // 6. Convert the concatenated string into an array of bigints based on character codes
  const guessFields: bigint[] = [];
  for (let i = 0; i < concatenatedGuesses.length; i++) {
    guessFields.push(BigInt(concatenatedGuesses.charCodeAt(i)));
  }

  // 7. Calculate the Poseidon2 hash of the bigint array
  const finalHash = poseidon2Hash(guessFields);

  // 8. Return the calculated hash
  return finalHash;
};
