// packages/squizwords-layoutgen/src/types.ts

/**
 * Represents the input structure for a clue and its answer.
 */
export type ClueInput = {
  clue: string;
  answer: string;
};

/**
 * Possible orientations for a word in the crossword grid.
 * 'none' indicates the word could not be placed.
 */
export type LayoutOrientation = 'down' | 'across' | 'none';

/**
 * Represents the data for a single word placed in the layout,
 * as output by the layout generator.
 */
export type LayoutData = {
  clue: string;
  answer: string;
  startx: number;
  starty: number;
  orientation: LayoutOrientation;
  position?: number; // Optional position identifier from generator
};

/**
 * Represents a successfully generated layout deemed acceptable,
 * including the layout data, the grid representation, and the ClueInput order used.
 */
export type AcceptableLayout = {
  layout: LayoutData[];
  grid: string;
  permutation: ClueInput[]; // Store the full ClueInput permutation
};

/**
 * Contains the results of evaluating a generated layout against
 * the defined critical and suboptimal criteria.
 */
export type EvaluationResult = {
  isAcceptable: boolean;
  criticalIssues: string[];
  suboptimalIssues: string[];
};

/**
 * Stores information about a permutation of ClueInput objects that resulted
 * in a failed layout generation (critical errors).
 */
export type FailedAttempt = {
  permutation: ClueInput[]; // Stores the ClueInput object permutation
  errors: string[];
};

/**
 * Type definition for the external layout generator function.
 * Takes an array of ClueInput objects (in a specific order)
 * and returns the corresponding layout data.
 * Can be synchronous or asynchronous.
 */
export type LayoutGeneratorFn = (clues: ClueInput[]) => LayoutData[] | Promise<LayoutData[]>;

/**
 * Represents a single item returned within the result array by the generator.
 */
export type CLGResultItem = {
    clue: string; // Generator should return the clue if it was provided
    answer: string;
    orientation: LayoutOrientation;
    startx: number;
    starty: number;
    position?: number;
};

/**
 * Represents the overall structure returned by the crossword-layout-generator library.
 */
export type CLGResult = {
    rows: number;
    cols: number;
    table_string: string;
    result: CLGResultItem[];
}; 