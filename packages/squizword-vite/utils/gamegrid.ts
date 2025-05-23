/*
{
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
      separatorLocations: {
        '-': [2],
      },
      solution: 'YOYO',
    },
    {
      id: '4-across',
      number: 4,
      humanNumber: '4',
      clue: 'Have a rest (3,4)',
      direction: 'across',
      length: 7,
      group: ['4-across'],
      position: { x: 0, y: 2 },
      separatorLocations: {
        ',': [3],
      },
      solution: 'LIEDOWN',
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
      solution: 'YELLOW',
    },
    {
      id: '2-down',
      number: 2,
      humanNumber: '2',
      clue: 'Bits and bobs (4,3,4)',
      direction: 'down',
      length: 7,
      group: ['2-down', '3-down'],
      position: { x: 3, y: 0 },
      separatorLocations: {
        ',': [4, 7],
      },
      solution: 'ODDSAND',
    },
    {
      id: '3-down',
      number: 3,
      humanNumber: '3',
      clue: 'See 2',
      direction: 'down',
      length: 4,
      group: ['2-down', '3-down'],
      position: {
        x: 6,
        y: 1,
      },
      separatorLocations: {},
      solution: 'ENDS',
    },
  ],
  solutionAvailable: true,
  dateSolutionAvailable: 1542326400000,
  dimensions: {
    cols: 13,
    rows: 13,
  },
  crosswordType: 'quick',
};


Guess grid

Some functions require or return the state of the crossword grid. This is a 2-dimensional array holding the user's guess for each cell. Incomplete cells or cells that are not part of any answer are represented as the empty string (""). Note that it follows the convention of indexing by column first (x) and then row (y) so the printed array is transposed compared to how the crossword grid appears. For example, the following crossword...

■	D	■
■	O	■
A	G	E
...would be represented as...

{
  "value": [
    ["",  "",  "A"],
    ["D", "O", "G"],
    ["",  "",  "E"]
  ]
}
*/


export const NULLISH_CELL = ' ';

import { GuessGrid } from "../../mycrossword/lib/types.js";
import { GuardianCrossword } from "../../mycrossword/lib/types.js";
// For each clue, get the guess from the grid
// use the representation of the grid as a 2D array as seen above
export const getGameClueGuesses = ( gameData:GuardianCrossword, grid:GuessGrid) => {
  return gameData.entries.map((clue) => {
    let guess = '';
    const { direction, position, length } = clue;
    const { x: startCol, y: startRow } = position;

    if (direction === 'across') {
      for (let i = 0; i < length; i++) {
        const col = startCol + i;
        // Ensure we don't go out of bounds
        if (grid.value[col] !== undefined && grid.value[col][startRow] !== undefined) {
          guess += grid.value[col][startRow] || NULLISH_CELL; // Use space for empty/nullish defined cells
        } else {
          // Do nothing if out of bounds for this test case
          // guess += ''; // Or append nothing if truly out of bounds needed
        }
      }
    } else if (direction === 'down') {
      for (let i = 0; i < length; i++) {
        const row = startRow + i;
        // Ensure we don't go out of bounds
        if (grid.value[startCol] !== undefined && grid.value[startCol][row] !== undefined) {
          guess += grid.value[startCol][row] || ' '; // Use space for empty/nullish defined cells
        } else {
          // Do nothing if out of bounds for this test case
           // guess += ''; // Or append nothing if truly out of bounds needed
        }
      }
    }

    return {
      id: clue.id,
      guess: guess,
      number: clue.number,
    };
  }); // Closing parenthesis for map was missing, added it here.
};