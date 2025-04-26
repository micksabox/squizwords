import { describe, it, expect } from 'bun:test';
import { getGameClueGuesses } from './gamegrid.js';
import { GuardianCrossword, GuessGrid } from '../../mycrossword/lib/types.js';

describe('getGameClueGuesses', () => {
  it('should extract guesses correctly for the dog and age example', () => {
    // Example from gamegrid.ts documentation:
    // ■	D	■
    // ■	O	■
    // A	G	E
    const grid: GuessGrid = {
      value: [
        ['', '', 'A'], // Column 0
        ['D', 'O', 'G'], // Column 1
        ['', '', 'E'], // Column 2
      ],
    };

    const gameData: GuardianCrossword = {
      id: 'test/dog-age',
      number: 1,
      name: 'Dog Age Test',
      date: Date.now(),
      entries: [
        {
          id: '1-down',
          number: 1,
          humanNumber: '1',
          clue: 'Man\'s best friend',
          direction: 'down',
          length: 3,
          group: ['1-down'],
          position: { x: 1, y: 0 }, // Starts at D
          separatorLocations: {},
          // solution: 'DOG', // Not needed for this test
        },
        {
          id: '2-across',
          number: 2,
          humanNumber: '2',
          clue: 'How old you are',
          direction: 'across',
          length: 3,
          group: ['2-across'],
          position: { x: 0, y: 2 }, // Starts at A
          separatorLocations: {},
          // solution: 'AGE', // Not needed for this test
        },
      ],
      solutionAvailable: true,
      dateSolutionAvailable: Date.now(),
      dimensions: {
        cols: 3,
        rows: 3,
      },
      crosswordType: 'quick',
    };

    const expectedGuesses = [
      { id: '1-down', guess: 'DOG' },
      { id: '2-across', guess: 'AGE' },
    ];

    const actualGuesses = getGameClueGuesses(gameData, grid);

    // Use expect(...).toEqual(...) for deep equality comparison of arrays/objects
    expect(actualGuesses).toEqual(expectedGuesses);
  });

  it('should handle empty cells within a clue', () => {
    const grid: GuessGrid = {
      value: [
        ['Y', '', 'L', 'L', 'O', 'W'], // Column 0
        ['O', '', '', '', '', ''],    // Column 1
        ['Y', '', '', '', '', ''],    // Column 2
        ['O', '', 'D', '', '', ''],    // Column 3
      ],
    };

    const gameData: GuardianCrossword = {
        id: 'simple/1',
        number: 1,
        name: 'Simple Crossword #1',
        date: 1542326400000,
        entries: [
          {
            id: '1-across',
            number: 1,
            humanNumber: '1',
            clue: 'Toy on a string (2-2)',
            direction: 'across',
            length: 4,
            group: ['1-across'],
            position: { x: 0, y: 0 },
            separatorLocations: { '-': [2] },
            // solution: 'YOYO',
          },
          {
            id: '1-down',
            number: 1,
            humanNumber: '1',
            clue: 'Colour (6)',
            direction: 'down',
            length: 6,
            group: ['1-down'],
            position: { x: 0, y: 0 },
            separatorLocations: {},
            // solution: 'YELLOW',
          },
        ],
        solutionAvailable: true,
        dateSolutionAvailable: 1542326400000,
        dimensions: { cols: 4, rows: 6 },
        crosswordType: 'quick',
      };


    const expectedGuesses = [
      { id: '1-across', guess: 'YOYO' }, // Corrected expectation based on grid
      { id: '1-down', guess: 'Y LLOW' }, // Note the space for the empty cell
    ];

    const actualGuesses = getGameClueGuesses(gameData, grid);
    expect(actualGuesses).toEqual(expectedGuesses);
  });

  it('should handle grids larger than necessary for clues', () => {
    const grid: GuessGrid = {
      value: [
        ['', '', 'A', 'X'], // Column 0
        ['D', 'O', 'G', 'Y'], // Column 1
        ['', '', 'E', 'Z'], // Column 2
        ['P', 'Q', 'R', 'S'], // Column 3 (extra)
      ],
    };

     const gameData: GuardianCrossword = {
      id: 'test/dog-age-large',
      number: 1,
      name: 'Dog Age Test Large Grid',
      date: Date.now(),
      entries: [
        {
          id: '1-down',
          number: 1,
          humanNumber: '1',
          clue: 'Man\'s best friend',
          direction: 'down',
          length: 3,
          group: ['1-down'],
          position: { x: 1, y: 0 }, // Starts at D
          separatorLocations: {},
        },
        {
          id: '2-across',
          number: 2,
          humanNumber: '2',
          clue: 'How old you are',
          direction: 'across',
          length: 3,
          group: ['2-across'],
          position: { x: 0, y: 2 }, // Starts at A
          separatorLocations: {},
        },
      ],
      solutionAvailable: true,
      dateSolutionAvailable: Date.now(),
      dimensions: {
        cols: 4, // Grid is larger
        rows: 4,
      },
      crosswordType: 'quick',
    };

    const expectedGuesses = [
      { id: '1-down', guess: 'DOG' },
      { id: '2-across', guess: 'AGE' },
    ];

    const actualGuesses = getGameClueGuesses(gameData, grid);
    expect(actualGuesses).toEqual(expectedGuesses);
  });

  it('should return empty strings for clues outside grid bounds (though unlikely with valid data)', () => {
    // Grid is smaller than where the clues are placed
    const grid: GuessGrid = {
      value: [
        ['A'],
      ],
    };

     const gameData: GuardianCrossword = {
      id: 'test/out-of-bounds',
      number: 1,
      name: 'Out of Bounds Test',
      date: Date.now(),
      entries: [
        { // This clue is entirely outside the 1x1 grid
          id: '1-down',
          number: 1,
          humanNumber: '1',
          clue: 'Man\'s best friend',
          direction: 'down',
          length: 3,
          group: ['1-down'],
          position: { x: 1, y: 0 },
          separatorLocations: {},
        },
        { // This clue starts outside the 1x1 grid
          id: '2-across',
          number: 2,
          humanNumber: '2',
          clue: 'How old you are',
          direction: 'across',
          length: 3,
          group: ['2-across'],
          position: { x: 0, y: 2 },
          separatorLocations: {},
        },
      ],
      solutionAvailable: true,
      dateSolutionAvailable: Date.now(),
      dimensions: {
        cols: 1, // Grid is only 1x1
        rows: 1,
      },
      crosswordType: 'quick',
    };

    const expectedGuesses = [
      { id: '1-down', guess: '' }, // Should get nothing as x=1 is out of bounds
      { id: '2-across', guess: '' }, // Should get nothing as y=2 is out of bounds
    ];

    const actualGuesses = getGameClueGuesses(gameData, grid);
    expect(actualGuesses).toEqual(expectedGuesses);
  });


});
