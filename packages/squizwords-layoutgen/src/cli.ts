#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { input, select } from '@inquirer/prompts';
import { LayoutOptimizer } from './LayoutOptimizer';
import { actualLayoutGenerator } from './index'; // Assuming index.ts will export this
import { ClueInput } from './types';
// import { GuardianCrossword, GuardianClue, Direction } from '../../mycrossword/lib/types'; // Removed due to rootDir issue
import { calculateGridDimensions } from './util';

// --- Re-defined Types (Workaround for rootDir issue) ---
// Based on packages/mycrossword/lib/types.ts
type Direction = 'across' | 'down';
// Corrected syntax for optional keys
type SeparatorLocationsOptional = { 
    [key in ',']?: number[]; 
} & { 
    [key in '-']?: number[]; 
};

// --- Added Local Type Definitions from layoutgen/types.ts ---
// (To avoid rootDir issues and provide better types than any)
type LayoutOrientation = 'down' | 'across' | 'none';
type LayoutData = {
  clue: string;
  answer: string;
  startx: number;
  starty: number;
  orientation: LayoutOrientation;
  position?: number; // Optional position identifier from generator
};
// --- End Added Local Type Definitions ---

type GuardianClue = {
  clue: string;
  direction: Direction;
  group: string[];
  humanNumber: string;
  id: string;
  length: number;
  number: number;
  position: { x: number; y: number };
  separatorLocations: SeparatorLocationsOptional;
  solution?: string;
  // solutionPoseidonHash?: string; // Omitted
};

type GuardianCrossword = {
  creator?: {
    name: string;
    webUrl: string;
  };
  crosswordType:
    | 'cryptic'
    | 'quick'
    | 'quiptic'
    | 'speedy'
    | 'prize'
    | 'everyman';
  date: number;
  dateSolutionAvailable?: number;
  dimensions: {
    cols: number;
    rows: number;
  };
  entries: GuardianClue[];
  id: string;
  name: string;
  number: number;
  pdf?: string;
  solutionAvailable: boolean;
  webPublicationDate?: number;
};
// --- End Re-defined Types ---

const program = new Command();

program
  .version('0.1.0') // Replace with your package version
  .description('Generates crossword layouts from words and clues.')
  .option('-i, --inputFile <path>', 'Path to a JSON file containing an array of {clue: string, answer: string} objects.')
  .option('-o, --outputFolder <path>', 'Directory to save generated layout files.')
  .option('--numLayouts <number>', 'Number of acceptable layouts to find.', '2') // Default 2
  .option('--maxIterations <number>', 'Maximum permutations to try.', '50') // Default 50
  .action(async (options) => {
    console.log('CLI options:', options);
    // TODO: Implement the rest of the logic from the old main function here
    // - Load input (from file or prompts)
    // - Determine output directory (or console)
    // - Instantiate and run LayoutOptimizer
    // - Handle output (save files or print to console)

    let inputClues: ClueInput[] = [];
    const outputDir = determineOutputDir(options.outputFolder); // Function to implement

    // --- Input Handling ---
    if (options.inputFile) {
      console.log(`Loading input clues from: ${options.inputFile}`);
      try {
        const rawData = fs.readFileSync(options.inputFile, 'utf-8');
        inputClues = JSON.parse(rawData);
        if (!Array.isArray(inputClues) || inputClues.length === 0 || !inputClues.every(item => typeof item.clue === 'string' && typeof item.answer === 'string')) {
          throw new Error('Invalid input JSON format. Expected an array of {clue: string, answer: string} objects.');
        }
        console.log(`Loaded ${inputClues.length} clues from file.`);
      } catch (error: any) {
        console.error(`Failed to load or parse input file at ${options.inputFile}:`, error.message);
        process.exit(1);
      }
    } else {
      console.log('No input file provided. Starting interactive mode...');
      inputClues = await promptForClues(); // Function to implement using inquirer
    }

    if (inputClues.length === 0) {
      console.error('No input clues provided. Exiting.');
      process.exit(1);
    }

    // --- Ensure Output Directory Exists (if specified) ---
    if (outputDir) {
        try {
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
                console.log(`Created output directory: ${outputDir}`);
            }
        } catch (error: any) {
            console.error(`Failed to create output directory at ${outputDir}:`, error.message);
            process.exit(1);
        }
    }


    // --- Run Optimizer ---
    console.log(`Attempting to find ${options.numLayouts} layouts with max ${options.maxIterations} iterations.`);
    const optimizer = new LayoutOptimizer(
        inputClues,
        parseInt(options.numLayouts, 10),
        actualLayoutGenerator, // Use the imported generator function
        parseInt(options.maxIterations, 10)
        // TODO: Pass outputDir or a flag to indicate console output
    );

    await optimizer.run();

    // --- Output Results ---
    // TODO: Implement output logic based on whether outputDir is set
    console.log("\n--- Optimization Results ---");

    if (optimizer.acceptableLayouts.length > 0) {
        if (outputDir) {
             // Save to files (similar to old main)
             console.log(`Saving ${optimizer.acceptableLayouts.length} acceptable layouts to: ${outputDir}`);
             optimizer.acceptableLayouts.forEach((result, index) => {
                // Create filename based on the answer order
                const permutationString = result.permutation.map(p => p.answer).join('-').substring(0, 30).replace(/[^a-zA-Z0-9-]/g, '_'); // Sanitize
                const fileBaseName = `layout_${index + 1}_${permutationString}`;
                const gridFilePath = path.join(outputDir, `${fileBaseName}_grid.txt`);
                const dataFilePath = path.join(outputDir, `${fileBaseName}_data.json`);
                const guardianFilePath = path.join(outputDir, `${fileBaseName}_guardian.json`); // New file path

                try {
                    // --- Save Original Grid and Layout Data ---
                    fs.writeFileSync(gridFilePath, result.grid);
                    console.log(`   - Saved grid to: ${gridFilePath}`);
                    fs.writeFileSync(dataFilePath, JSON.stringify(result.layout, null, 2));
                    console.log(`   - Saved layout data to: ${dataFilePath}`);

                    // --- Create and Save GuardianCrossword Data ---
                    const dimensions = calculateGridDimensions(result.grid);
                    if (!dimensions) {
                        console.error(`   - Failed to calculate dimensions for layout ${index + 1}. Skipping Guardian output.`);
                        return; // Skip this layout if dimensions are invalid
                    }

                    // Map directly from result.layout (which is LayoutData[])
                    const entries: GuardianClue[] = result.layout
                        .filter(ld => ld.orientation !== 'none') // Only include placed words
                        // Use the locally defined LayoutData type for ld
                        .map((ld: LayoutData): GuardianClue | null => { 
                            // Use the layout generator's position if available, otherwise fallback (e.g., 0 or index?)
                            // For now, defaulting to 0 if undefined, might need adjustment based on generator output.
                            const clueNumber = ld.position ?? 0; 
                            const direction = ld.orientation; // Assuming orientation maps directly to Direction
                            const clueId = `${clueNumber}-${direction}`;

                            // Basic validation
                            if (direction === 'none') {
                                console.warn(`Skipping Guardian entry for unplaced word: ${ld.answer}`);
                                return null; // Skip this entry
                            }
                             // No need for clue/answer check as LayoutData requires them
                            /*
                            if (typeof ld.clue !== 'string' || typeof ld.answer !== 'string') {
                                console.warn(`Skipping Guardian entry due to missing clue/answer:`, ld);
                                return null; // Skip malformed entries
                            }
                            */

                            // Cast direction to Direction type, assuming 'across'|'down' match
                            const guardianDirection = direction as Direction;

                            return {
                                clue: ld.clue, 
                                direction: guardianDirection, 
                                group: [clueId],
                                humanNumber: String(clueNumber),
                                id: clueId,
                                length: ld.answer.length, 
                                number: clueNumber,
                                // Add 1 to x/y for 1-based indexing required by Guardian format
                                position: { x: ld.startx + 1, y: ld.starty + 1 }, 
                                separatorLocations: {}, 
                                solution: ld.answer.toUpperCase(), 
                            };
                    }).filter((entry): entry is GuardianClue => entry !== null); 

                    const guardianCrossword: GuardianCrossword = {
                        // --- Required Fields ---
                        crosswordType: 'quick', // Changed from 'generated' to an allowed type
                        date: Date.now(), // Use current timestamp for date field
                        dimensions: dimensions,
                        entries: entries,
                        id: String(Date.now()), // Use string timestamp integer for ID field
                        name: `Generated Layout ${index + 1}`, // Simple name
                        number: index + 1, // Use the layout index
                        solutionAvailable: true, // Solution is always available for generated puzzles
                        // --- Optional Fields (can be omitted or set to default) ---
                         // creator: undefined,
                         // dateSolutionAvailable: undefined,
                         // pdf: undefined,
                         // webPublicationDate: undefined,
                    };

                    fs.writeFileSync(guardianFilePath, JSON.stringify(guardianCrossword, null, 2));
                    console.log(`   - Saved Guardian data to: ${guardianFilePath}`);
                    // --- End GuardianCrossword Data Handling ---

                } catch (error: any) {
                    console.error(`   - Failed to save layout ${index + 1} (or its Guardian data) to ${outputDir}:`, error.message);
                }
            });
        } else {
            // Print to console
            console.log(`${optimizer.acceptableLayouts.length} acceptable layouts found:`);
            optimizer.acceptableLayouts.forEach((layout, index) => {
                console.log(`\n--- Layout ${index + 1} ---`);
                console.log('Grid:');
                console.log(layout.grid);
                console.log('\nLayout Data:');
                console.log(JSON.stringify(layout.layout, null, 2));
                console.log(`Used permutation: ${layout.permutation.map(p => p.answer).join(', ')}`);
            });
        }
    } else {
        console.log("No acceptable layouts were found within the iteration limit.");
    }

     if (optimizer.failedPermutations.length > 0 && outputDir) {
         // Save failures log (similar to old main)
        console.log(`Logging ${optimizer.failedPermutations.length} failed permutations to ${outputDir}...`);
        const failureLogPath = path.join(outputDir, 'failed_permutations.json');
        try {
            const failuresToLog = optimizer.failedPermutations.map(failure => ({
                 permutation: failure.permutation,
                 errors: failure.errors
            }));
            fs.writeFileSync(failureLogPath, JSON.stringify(failuresToLog, null, 2));
            console.log(`   - Saved failure log to: ${failureLogPath}`);
        } catch (error: any) {
            console.error(`   - Failed to save failure log to ${outputDir}:`, error.message);
        }
     } else if (optimizer.failedPermutations.length > 0) {
        console.log(`\n${optimizer.failedPermutations.length} permutations resulted in errors (details not logged without an output directory).`);
     }

    console.log("\nCLI finished.");

  });

// Helper function to determine output directory
function determineOutputDir(outputFolderOption?: string): string {
    if (outputFolderOption) {
        // Use provided path
        return path.resolve(outputFolderOption);
    } else {
        // Create default timestamped directory
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const defaultDir = path.join(process.cwd(), 'generated_layouts', timestamp);
        console.log(`No output folder specified, using default: ${defaultDir}`);
        return defaultDir;
        // If you want console output by default, return null here and adjust the logic above.
        // return null;
    }
}


// Helper function for interactive clue input
async function promptForClues(): Promise<ClueInput[]> {
    const clues: ClueInput[] = [];
    console.log('Enter clues and answers. Press Enter with an empty answer to finish.');
    while (true) {
        const answer = await input({ message: `Enter answer #${clues.length + 1} (or leave blank to finish):` });
        if (!answer) {
            if (clues.length > 0) break; // Need at least one word
            else {
              console.log("Please enter at least one word.");
              continue;
            }
        }
        const clue = await input({ message: `Enter clue for "${answer}":` });
         if (!clue) { // Ensure clue is not empty
            console.log("Clue cannot be empty. Please provide a clue.");
            // Re-prompt for the clue for the same answer
             const correctedClue = await input({ message: `Enter clue for "${answer}":` });
             if (!correctedClue) {
                 console.log("Skipping word due to missing clue.");
                 continue;
             }
             clues.push({ clue: correctedClue, answer });
         } else {
            clues.push({ clue, answer });
         }
    }
    console.log(`Collected ${clues.length} clues interactively.`);
    return clues;
}


program.parse(process.argv);

// Make sure index.ts exports actualLayoutGenerator
// e.g., add `export { actualLayoutGenerator };` at the end of index.ts 