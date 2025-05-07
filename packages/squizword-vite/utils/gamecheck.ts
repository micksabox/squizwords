import { GuardianCrossword, GuessGrid } from '../../mycrossword/lib/types.js';
import { getGameClueGuesses } from './gamegrid.js';
import { poseidon2Hash } from '@zkpassport/poseidon2';
import { stringToHex } from 'viem';

// Constant matching the Noir circuit
// Exported for potential reuse or testing
export const MAX_SOLUTION_WORDS = 100;

/**
 * Retrieves and sorts guesses based on clue direction and ID.
 *
 * @param gameData The crossword game data containing clue definitions.
 * @param clueGuesses The array of clue guesses, typically from getGameClueGuesses.
 * @returns An array of guess strings, sorted by direction (down then across) and then by clue number.
 */
export const getSortedGuesses = (
  gameData: GuardianCrossword,
  clueGuesses: Array<{ id: string; guess: string; number: number }>,
): string[] => {
  // 1. Create a map for quick lookup
  const guessMap = new Map(clueGuesses.map(item => [item.id, item.guess]));

  // 2. Map game entries to include direction and guess for sorting
  const cluesWithDetails = gameData.entries.map(entry => ({
    id: entry.id,
    number: entry.number,
    direction: entry.direction,
    guess: guessMap.get(entry.id) || '', // Default to empty string if guess not found
  }));

  // 3. Sort clues: down before across, then by ID (clue number)
  cluesWithDetails.sort((a, b) => {
    if (a.direction === 'down' && b.direction === 'across') return -1;
    if (a.direction === 'across' && b.direction === 'down') return 1;
    if (a.number < b.number) return -1;
    if (a.number > b.number) return 1;
    return 0;
  });

  // 4. Get the sorted guess strings
  const sortedGuesses = cluesWithDetails.map(c => c.guess);
  return sortedGuesses;
};

/**
 * Pads an array of guess strings to MAX_SOLUTION_WORDS.
 * Each string is converted to a hex string, then to a BigInt.
 * Empty slots are filled with 0n.
 *
 * @param sortedGuesses An array of sorted guess strings.
 * @returns An array of BigInts, padded to MAX_SOLUTION_WORDS.
 */
export const padGuesses = (sortedGuesses: string[]): bigint[] => {
  // Create the padded array matching the circuit input size
  const paddedEncodedGuesses = Array(MAX_SOLUTION_WORDS).fill(0n);
  for (let i = 0; i < sortedGuesses.length && i < MAX_SOLUTION_WORDS; i++) {
    // Ensure the string is not empty before converting, or handle as needed
    // stringToHex will return '0x' for an empty string, which BigInt('0x') might error on or interpret as 0.
    // It's safer to explicitly handle empty strings if they should be represented differently than 0n.
    // For now, assuming stringToHex and BigInt handle this as intended (e.g., empty string becomes 0n or similar).
    paddedEncodedGuesses[i] = BigInt(stringToHex(sortedGuesses[i]));
  }
  return paddedEncodedGuesses;
};


/**
 * Calculates a Poseidon2 hash of the encoded and padded array of sorted clue guesses.
 * This is designed to be compatible with the Noir circuit verifier.
 *
 * @param gameData The crossword game data containing clue definitions.
 * @param clueGuesses The array of clue guesses, typically from getGameClueGuesses.
 * @returns The Poseidon2 hash of the padded array of encoded guesses as a bigint.
 */
export const calculateSortedGuessesHash = (
  gameData: GuardianCrossword,
  clueGuesses: Array<{ id: string; guess: string; number: number }>,
): bigint => {
  // 1. Get the sorted guess strings
  const sortedGuesses = getSortedGuesses(gameData, clueGuesses);

  // 2. Pad the sorted guess strings and encode them to BigInt
  const paddedEncodedFields = padGuesses(sortedGuesses);

  // 3. Calculate the Poseidon2 hash of the padded bigint array
  const finalHash = poseidon2Hash(paddedEncodedFields);

  // 4. Return the calculated hash
  return finalHash;
};


/**
 * Prepares the guesses inputs for the circuit
 * @param guesses - The array of guesses to prepare
 * @returns The padded array of encoded guesses
 */
export function prepareCircuitInput(guesses: string[]): bigint[] {
  const encodedFields = guesses.map(guess => stringToHex(guess));
  const paddedFields = Array(MAX_SOLUTION_WORDS).fill("0");
  // Copy encoded fields into the beginning of the padded array
  for (let i = 0; i < encodedFields.length && i < MAX_SOLUTION_WORDS; i++) {
      paddedFields[i] = encodedFields[i];
  }
  return paddedFields;
}
