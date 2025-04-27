import { describe, it, expect } from 'bun:test';
import { GuardianCrossword, GuessGrid, Char } from '../../mycrossword/lib/types.js';
import { calculateSortedGuessesHash, prepareHashInput } from './gamecheck.js';
import { getGameClueGuesses } from './gamegrid.js';
import { poseidon2Hash } from '@zkpassport/poseidon2';

// Corrected Mock GuardianCrossword data
const mockGameData: GuardianCrossword = {
  id: 'test-quick-1',
  number: 1,
  name: 'Test Quick Crossword',
  date: Date.now(), // Use number timestamp
  entries: [
    // Intentionally out of order to test sorting
    { id: '1-down', direction: 'down', number: 1, humanNumber: '1', clue: 'Farewell', length: 3, position: { x: 0, y: 0 }, solution: 'BYE', group: ['1-down'], separatorLocations: {} },
    { id: '2-down', direction: 'down', number: 2, humanNumber: '2', clue: 'Feline', length: 3, position: { x: 2, y: 0 }, solution: 'CAT', group: ['2-down'], separatorLocations: {} },
    { id: '1-across', direction: 'across', number: 1, humanNumber: '1', clue: 'Greeting', length: 2, position: { x: 0, y: 0 }, solution: 'HI', group: ['1-across'], separatorLocations: {} },
  ],
  solutionAvailable: true,
  dateSolutionAvailable: Date.now(), // Use number timestamp
  dimensions: { rows: 3, cols: 3 }, // rows: 3, cols: 3 means grid value[0..2][0..2]
  crosswordType: 'quick',
  pdf: 'test.pdf',
};

// Corrected Mock GuessGrid (value[col][row])
// Grid looks like:
// H I C
// B _ A
// Y _ T
// Transposed for value:
// H B Y
// I _ _
// C A T
const mockGrid: GuessGrid = {
  value: [
    ['H', 'B', 'Y'], // Column 0
    ['I', '', ''],   // Column 1
    ['C', 'A', 'T'], // Column 2
  ]
};

// Corrected Mock Partial GuessGrid
// Grid looks like:
// H X C
// B _ A
// _ _ _
// Transposed for value:
// H B _
// X _ _
// C A _
const mockPartialGrid: GuessGrid = {
   value: [
    ['H', 'B', ''], // Column 0
    ['X', '', ''],   // Column 1
    ['C', 'A', ''], // Column 2
  ]
};

// --- Mock Data Definitions (moved to describe scope) ---
let simpleGameData: GuardianCrossword;
let simpleSolvedGrid: GuessGrid;
let simplePartialGrid: GuessGrid;
let emptyGrid: GuessGrid;
let partialGrid: GuessGrid;
let mockGameDataWithSymbolsFixed: GuardianCrossword;
let mockGridWithSymbolsFixed: GuessGrid;


// --- Main Test Suite ---
describe('calculateSortedGuessesHash', () => {

  // Initialize shared test data within the describe block
  simpleGameData = {
     id: 'simple-test', number: 1, name: 'Simple', date: Date.now(),
     entries: [
         { id: '1-across', direction: 'across', number: 1, humanNumber: '1', clue: '1a', length: 3, position: { x: 0, y: 0 }, solution: 'ABC', group: ['1a'], separatorLocations: {} },
         { id: '1-down', direction: 'down', number: 1, humanNumber: '1', clue: '1d', length: 3, position: { x: 0, y: 0 }, solution: 'ADE', group: ['1d'], separatorLocations: {} },
     ],
     dimensions: { rows: 3, cols: 3 },
     solutionAvailable: true, dateSolutionAvailable: Date.now(), crosswordType: 'quick', pdf: 's.pdf'
  };

  simpleSolvedGrid = {
      value: [
          ['A', 'D', 'E'], // Col 0 - Assuming Char accepts single letters
          ['B', '', ''],  // Col 1 - Assuming Char accepts ''
          ['C', '', ''],  // Col 2
      ]
  };

  simplePartialGrid = {
      value: [
          ['A', 'D', ''], // Col 0
          ['X', '', ''],  // Col 1
          ['C', '', ''],  // Col 2
      ]
  };

  // Define emptyGrid based on simpleGameData dimensions
  const emptyCols = simpleGameData.dimensions.cols;
  const emptyRows = simpleGameData.dimensions.rows;
  // Explicitly type as Char[][]
  const emptyGridValue: Char[][] = Array(emptyCols).fill(0).map(() => Array(emptyRows).fill(''));
  emptyGrid = { value: emptyGridValue };

  // Define partialGrid based on simpleGameData dimensions
  const partialCols = simpleGameData.dimensions.cols;
  const partialRows = simpleGameData.dimensions.rows;
  const partialGridValue: Char[][] = Array(partialCols).fill(0).map(() => Array(partialRows).fill(''));
  partialGridValue[0][0] = 'A';
  partialGridValue[0][1] = 'D';
  partialGridValue[0][2] = 'E';
  partialGrid = { value: partialGridValue };

  // Define game data with numbers/letters
  mockGameDataWithSymbolsFixed = {
     id: 'symbol-test', number: 2, name: "Symbol Test", date: Date.now(),
     entries: [
       { id: '1-down', direction: 'down', number: 1, humanNumber: '1', clue: 'Mixed', length: 3, position: { x: 0, y: 0 }, solution: 'A0B', group: ['1-down'], separatorLocations: {} },
       { id: '1-across', direction: 'across', number: 1, humanNumber: '1', clue: 'Number', length: 2, position: { x: 1, y: 0 }, solution: 'N1', group: ['1-across'], separatorLocations: {} },
     ],
     dimensions: { rows: 3, cols: 3 },
     solutionAvailable: true, dateSolutionAvailable: Date.now(), crosswordType: 'quick', pdf: 'sym.pdf'
  };

  // Define grid with numbers/letters
  mockGridWithSymbolsFixed = {
      value: [
          ['A', '0', 'B'],
          ['N', '', ''],
          ['1', '', ''],
      ]
  } as GuessGrid; // Use type assertion on the whole object

  // --- Test Cases ---

  it('should calculate the correct hash for a fully and correctly guessed grid', () => {
    // Uses simpleGameData and simpleSolvedGrid defined above
    const expectedSortedGuesses = ["ADE", "ABC"]; // From previous logic: 1-down, 1-across
    const expectedPaddedInput = prepareHashInput(expectedSortedGuesses);
    const expectedHash = poseidon2Hash(expectedPaddedInput);

    const actualHash = calculateSortedGuessesHash(simpleGameData, simpleSolvedGrid);
    expect(actualHash).toEqual(expectedHash);
  });

  it('should handle partially filled or incorrectly guessed grids', () => {
    // Uses simpleGameData and simplePartialGrid defined above
    // Test expectation: 1-down reads "AD", 1-across reads "AXC" (Removing space assumption)
    const expectedSortedGuesses = ["AD ", "AXC"]; // Test with space missing
    const expectedPaddedInput = prepareHashInput(expectedSortedGuesses);
    const expectedHash = poseidon2Hash(expectedPaddedInput);

    const actualHash = calculateSortedGuessesHash(simpleGameData, simplePartialGrid);
    expect(actualHash).toEqual(expectedHash);
  });

  it('should handle empty guesses correctly', () => {
    // Uses simpleGameData and emptyGrid defined above
    // 1-down reads "   ", 1-across reads "   "
    const expectedSortedGuesses = ["   ", "   "]; // Sorted: 1-down, 1-across (Corrected from ["", "", ""])
    const expectedPaddedInput = prepareHashInput(expectedSortedGuesses);
    const expectedHash = poseidon2Hash(expectedPaddedInput);

    const actualHash = calculateSortedGuessesHash(simpleGameData, emptyGrid);
    expect(actualHash).toEqual(expectedHash);
  });

    it('should handle grids with only some clues guessed', () => {
    // Uses simpleGameData and partialGrid defined above
    // Expected sorted guesses: 1-down ("ADE"), 1-across ("A  ") -> "ADEA  "
    const expectedSortedGuesses = ["ADE", "A  "];
    const expectedPaddedInput = prepareHashInput(expectedSortedGuesses);
    const expectedHash = poseidon2Hash(expectedPaddedInput);

    const actualHash = calculateSortedGuessesHash(simpleGameData, partialGrid);
    expect(actualHash).toEqual(expectedHash);
  });

    it('should handle different character sets (e.g., numbers, symbols if allowed)', () => {
    // Uses mockGameDataWithSymbolsFixed and mockGridWithSymbolsFixed defined above
    // Expected sorted guesses: 1-down ("A0B"), 1-across ("N1") -> "A0BN1"
    const expectedSortedGuesses = ["A0B", "N1"];
    const expectedPaddedInput = prepareHashInput(expectedSortedGuesses);
    const expectedHash = poseidon2Hash(expectedPaddedInput);

    const actualHash = calculateSortedGuessesHash(mockGameDataWithSymbolsFixed, mockGridWithSymbolsFixed);
    expect(actualHash).toEqual(expectedHash);
  });

});