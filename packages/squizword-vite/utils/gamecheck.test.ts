import { describe, it, expect } from 'bun:test';
import { GuardianCrossword, GuessGrid, Char } from '../../mycrossword/lib/types.js';
import { calculateSortedGuessesHash, MAX_SOLUTION_WORDS, prepareCircuitInput } from './gamecheck.js';
import { getGameClueGuesses } from './gamegrid.js';
import { poseidon2Hash } from '@zkpassport/poseidon2';
import { encodeStringToField } from './encoding.js';
import { getCircuitForTest } from '../../noir/compile.node.js';
import { UltraPlonkBackend } from '@aztec/bb.js';
import { InputMap, Noir } from '@noir-lang/noir_js';
import { InputValue, ProofData } from '@noir-lang/types';

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
    
    // Calculate expected hash directly
    const encodedFieldsExpected = expectedSortedGuesses.map(g => encodeStringToField(g));
    const paddedFieldsExpected = Array(MAX_SOLUTION_WORDS).fill(0n);
    for (let i = 0; i < encodedFieldsExpected.length; i++) {
      paddedFieldsExpected[i] = encodedFieldsExpected[i];
    }
    const expectedHash = poseidon2Hash(paddedFieldsExpected);

    const clueGuesses = getGameClueGuesses(simpleGameData, simpleSolvedGrid);
    const actualHash = calculateSortedGuessesHash(simpleGameData, clueGuesses);
    expect(actualHash).toEqual(expectedHash);
  });

  it('should handle partially filled or incorrectly guessed grids', () => {
    // Uses simpleGameData and simplePartialGrid defined above
    // 1-down reads "AD ", 1-across reads "AXC"
    const expectedSortedGuesses = ["AD ", "AXC"];
    // Calculate expected hash directly
    const encodedFields = expectedSortedGuesses.map(g => encodeStringToField(g));
    const paddedFields = Array(MAX_SOLUTION_WORDS).fill(0n);
    for (let i = 0; i < encodedFields.length; i++) {
      paddedFields[i] = encodedFields[i];
    }
    const expectedHash = poseidon2Hash(paddedFields);

    const clueGuesses = getGameClueGuesses(simpleGameData, simplePartialGrid);
    const actualHash = calculateSortedGuessesHash(simpleGameData, clueGuesses);
    expect(actualHash).toEqual(expectedHash);
  });

  it('should handle empty guesses correctly', () => {
    // Uses simpleGameData and emptyGrid defined above
    // 1-down reads "   ", 1-across reads "   "
    const expectedSortedGuesses = ["   ", "   "];
    // Calculate expected hash directly
    const encodedFields = expectedSortedGuesses.map(g => encodeStringToField(g));
    const paddedFields = Array(MAX_SOLUTION_WORDS).fill(0n);
    for (let i = 0; i < encodedFields.length; i++) {
      paddedFields[i] = encodedFields[i];
    }
    const expectedHash = poseidon2Hash(paddedFields);

    const clueGuesses = getGameClueGuesses(simpleGameData, emptyGrid);
    const actualHash = calculateSortedGuessesHash(simpleGameData, clueGuesses);
    expect(actualHash).toEqual(expectedHash);
  });

  it('should handle grids with only some clues guessed', () => {
    // Uses simpleGameData and partialGrid defined above
    // Expected sorted guesses: 1-down ("ADE"), 1-across ("A  ")
    const expectedSortedGuesses = ["ADE", "A  "];
    // Calculate expected hash directly
    const encodedFields = expectedSortedGuesses.map(g => encodeStringToField(g));
    const paddedFields = Array(MAX_SOLUTION_WORDS).fill(0n);
    for (let i = 0; i < encodedFields.length; i++) {
      paddedFields[i] = encodedFields[i];
    }
    const expectedHash = poseidon2Hash(paddedFields);

    const clueGuesses = getGameClueGuesses(simpleGameData, partialGrid);
    const actualHash = calculateSortedGuessesHash(simpleGameData, clueGuesses);
    expect(actualHash).toEqual(expectedHash);
  });

  it('should handle different character sets (e.g., numbers, symbols if allowed)', () => {
    // Uses mockGameDataWithSymbolsFixed and mockGridWithSymbolsFixed defined above
    // Expected sorted guesses: 1-down ("A0B"), 1-across ("N1")
    const expectedSortedGuesses = ["A0B", "N1"];
    // Calculate expected hash directly
    const encodedFields = expectedSortedGuesses.map(g => encodeStringToField(g));
    const paddedFields = Array(MAX_SOLUTION_WORDS).fill(0n);
    for (let i = 0; i < encodedFields.length; i++) {
      paddedFields[i] = encodedFields[i];
    }
    const expectedHash = poseidon2Hash(paddedFields);

    const clueGuesses = getGameClueGuesses(mockGameDataWithSymbolsFixed, mockGridWithSymbolsFixed);
    const actualHash = calculateSortedGuessesHash(mockGameDataWithSymbolsFixed, clueGuesses);
    expect(actualHash).toEqual(expectedHash);
  });


  // New test for Noir circuit compilation and proof generation
  it('should compile the Noir circuit and generate a proof for correct inputs', async () => {
    // 1. Get the compiled circuit using the test-specific function
    const circuit = await getCircuitForTest();
    expect(circuit, 'Circuit should be defined. Run `nargo compile` in packages/noir to compile the circuit.').toBeDefined();

    // 2. Calculate the expected hash for a known correct solution
    const clueGuesses = getGameClueGuesses(simpleGameData, simpleSolvedGrid); // Get clue guesses
    const correctHashBigInt = calculateSortedGuessesHash(simpleGameData, clueGuesses); // Use clue guesses
    // Convert BigInt to hex string (remove 0n suffix and add 0x prefix)
    const correctHashHex = `0x${correctHashBigInt.toString(16)}`;
    // 3. Prepare inputs for the Noir circuit
    const solutionWords = prepareCircuitInput(["ADE", "ABC"]);
    //    Assuming the public input is named 'solution_root' in main.nr
    const inputs: InputMap = {
      solution_words: solutionWords.map(word => word.toString()),
      solution_root: correctHashHex,
    };

    // 4. Initialize BB.js backend and Noir
    const backend = new UltraPlonkBackend(circuit.bytecode, {
      threads: 1, // Use 1 thread for testing consistency
    });
    const noir = new Noir(circuit);

    // 5. Initialize Noir (optional, but good practice)
    await noir.init();

    // 6. Generate witness
    let witness: { witness: Uint8Array<ArrayBufferLike>; returnValue: InputValue };
    try {
        witness = await noir.execute(inputs);
    } catch (e) {
        console.error("Error generating witness:", e);
        throw e; // Re-throw to fail the test
    }
    expect(witness).toBeDefined();

    // 7. Generate proof
    let proofData: ProofData | undefined;
    try {
        proofData = await backend.generateProof(witness.witness);
    } catch (e) {
        console.error("Error generating proof:", e);
        throw e; // Re-throw to fail the test
    }
    expect(proofData).toBeDefined();
    expect(proofData?.proof).toBeInstanceOf(Uint8Array);
    expect(proofData?.publicInputs).toBeDefined();

    // 8. Verify the proof (optional but recommended)
    let verification: boolean | undefined;
     try {
        verification = await backend.verifyProof(proofData as ProofData);
    } catch (e) {
        console.error("Error verifying proof:", e);
        throw e; // Re-throw to fail the test
    }
    expect(verification).toBe(true);

  }, 60000); // Increase timeout for compilation/proving
});