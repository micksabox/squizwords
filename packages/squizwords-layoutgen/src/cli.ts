#!/usr/bin/env node
import * as fs from 'fs';
import { stringToHex } from 'viem';
import * as path from 'path';
import { Command } from 'commander';
import { input, select } from '@inquirer/prompts';
import { LayoutOptimizer } from './LayoutOptimizer';
import { actualLayoutGenerator } from './index'; // Assuming index.ts will export this
import { ClueInput } from './types';
// import { GuardianCrossword, GuardianClue, Direction } from '../../mycrossword/lib/types'; // Removed due to rootDir issue
import { calculateGridDimensions } from './util';
import { poseidon2Hash } from '@zkpassport/poseidon2';

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
  solutionPoseidonHash?: string;
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

// --- Constants ---
const PUZZLES_DIR = path.join(__dirname, 'puzzles'); // Assuming puzzles is relative to src
const DEFAULT_OUTPUT_BASE = 'generated_layouts';

const program = new Command();

program
  .version('0.1.0') // Replace with your package version
  .description('Generates crossword layouts from words and clues.')
  .option('-i, --inputFile <path>', 'Path to a JSON or CSV file containing clues. CSV format: ANSWER,CLUE')
  .option('-o, --outputFolder <path>', 'Directory to save generated layout files. Defaults based on input file or timestamp.')
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
    let clueSource: string | 'manual' = 'manual'; // Track where clues came from

    // --- Input Handling ---
    if (options.inputFile) {
        const filePath = path.resolve(options.inputFile);
        clueSource = filePath; // Store the input file path
        console.log(`Loading input clues from: ${filePath}`);
        try {
            if (filePath.endsWith('.json')) {
                const rawData = fs.readFileSync(filePath, 'utf-8');
                inputClues = JSON.parse(rawData);
                if (!Array.isArray(inputClues) || inputClues.length === 0 || !inputClues.every(item => typeof item.clue === 'string' && typeof item.answer === 'string')) {
                    throw new Error('Invalid input JSON format. Expected an array of {clue: string, answer: string} objects.');
                }
            } else if (filePath.endsWith('.csv')) {
                inputClues = loadCluesFromCSV(filePath); // Use helper function
            } else {
                throw new Error('Unsupported input file type. Please use .json or .csv');
            }
            console.log(`Loaded ${inputClues.length} clues from file.`);
        } catch (error: any) {
            console.error(`Failed to load or parse input file at ${filePath}:`, error.message);
            process.exit(1);
        }
    } else {
        // No input file specified, check puzzles directory
        let puzzleFiles: string[] = [];
        try {
            if (fs.existsSync(PUZZLES_DIR)) {
                 puzzleFiles = fs.readdirSync(PUZZLES_DIR).filter(file => file.endsWith('.csv'));
            }
        } catch (err) {
            console.warn(`Warning: Could not read puzzles directory at ${PUZZLES_DIR}. Proceeding to manual entry.`, err);
            // clueSource remains 'manual'
        }

        if (puzzleFiles.length > 0) {
            const choices = [
                ...puzzleFiles.map(file => ({ name: file, value: path.join(PUZZLES_DIR, file) })),
                { name: 'Enter clues manually', value: 'manual' }
            ];

            const selectedSource = await select({
                message: 'Select a puzzle CSV file or choose manual entry:',
                choices: choices,
            });

            if (selectedSource !== 'manual') {
                 clueSource = selectedSource; // Store selected CSV path
                 console.log(`Loading clues from selected CSV: ${path.basename(selectedSource)}`);
                 try {
                    inputClues = loadCluesFromCSV(selectedSource);
                    console.log(`Loaded ${inputClues.length} clues from ${path.basename(selectedSource)}.`);
                 } catch (error: any) {
                    console.error(`Failed to load or parse selected CSV file at ${selectedSource}:`, error.message);
                    process.exit(1);
                 }
            } else {
                 console.log('Proceeding with manual clue entry...');
                 // clueSource remains 'manual'
                 inputClues = await promptForClues();
            }

        } else {
            console.log('No input file provided and no CSV files found in puzzles directory. Starting interactive mode...');
            // clueSource remains 'manual'
            inputClues = await promptForClues(); // Function to implement using inquirer
        }
    }

    if (inputClues.length === 0) {
      console.error('No input clues provided or loaded. Exiting.');
      process.exit(1);
    }

    // --- Determine Output Directory --- (Moved before optimizer)
    const outputDir = determineOutputDir(options.outputFolder, clueSource);

    // --- Ensure Output Directory Exists --- (Run after determining path)
    try {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
            console.log(`Created output directory: ${outputDir}`);
        }
    } catch (error: any) {
        console.error(`Failed to create output directory at ${outputDir}:`, error.message);
        process.exit(1);
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

                    const cluesWithDetails = result.layout.map((entry, index) => ({
                      number: entry.position || index,
                      direction: entry.orientation,
                      guess: entry.answer
                    }));

                    cluesWithDetails.sort((a, b) => {
                      if (a.direction === 'down' && b.direction === 'across') return -1;
                      if (a.direction === 'across' && b.direction === 'down') return 1;
                      // Use the clue number for secondary sorting
                      if (a.number < b.number) return -1;
                      if (a.number > b.number) return 1;
                      return 0;
                    });

                    const sortedGuesses = cluesWithDetails.map(c => c.guess);

                    const solutionHash = `0x${poseidon2Hash(sortedGuesses.map(guess => BigInt(stringToHex(guess)))).toString(16)}`;
                  
                    console.log('solutionHash', solutionHash);


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
                                // solution: ld.answer.toUpperCase(), // Removed
                                // Convert string to BigInt array char by char for hashing
                                solutionPoseidonHash: (() => {
                                    const answerUpper = ld.answer.toUpperCase();
                                    const answerFields: bigint[] = [];
                                    for (let i = 0; i < answerUpper.length; i++) {
                                        answerFields.push(BigInt(answerUpper.charCodeAt(i)));
                                    }
                                    const hashedAnswerBigInt = poseidon2Hash(answerFields);
                                    return `0x${hashedAnswerBigInt.toString(16)}`; // Convert final hash to hex string
                                })(),
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
                        solutionAvailable: false, // Changed to false
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

// Helper function to load clues from CSV
function loadCluesFromCSV(filePath: string): ClueInput[] {
    const clues: ClueInput[] = [];
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    let skippedLines = 0;

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) { // Skip empty lines and comments
             return;
        }

        // Basic CSV parsing: Split by the first comma only to handle commas in clues
        // Handles cases like "ANSWER,Clue with, a comma"
        // Handles quoted clues like "ANSWER,""Quoted, clue"""
        let answer = '';
        let clue = '';
        let inQuotes = false;
        let splitIndex = -1;

        for (let i = 0; i < trimmedLine.length; i++) {
            const char = trimmedLine[i];
            if (char === '"') {
                // Handle escaped quotes ("") inside quoted field
                if (inQuotes && i + 1 < trimmedLine.length && trimmedLine[i+1] === '"') {
                     i++; // Skip the next quote
                     continue;
                }
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                 splitIndex = i;
                 break;
            }
        }

        if (splitIndex !== -1) {
            answer = trimmedLine.substring(0, splitIndex).trim();
            clue = trimmedLine.substring(splitIndex + 1).trim();

             // Remove surrounding quotes if present
            if (answer.startsWith('"') && answer.endsWith('"')) {
                answer = answer.substring(1, answer.length - 1).replace(/""/g, '"'); // Unescape quotes
            }
             if (clue.startsWith('"') && clue.endsWith('"')) {
                clue = clue.substring(1, clue.length - 1).replace(/""/g, '"'); // Unescape quotes
            }

        } else {
             // If no comma found, maybe it's just an answer? Or malformed. Skip for now.
             console.warn(`Skipping malformed CSV line ${index + 1} in ${path.basename(filePath)}: No comma found or incorrect format.`);
             skippedLines++;
             return;
        }


        // Validate
        if (!answer || !clue) {
            console.warn(`Skipping incomplete CSV line ${index + 1} in ${path.basename(filePath)}: Missing answer or clue.`);
            skippedLines++;
        } else {
            clues.push({ answer: answer.toUpperCase(), clue }); // Convert answer to uppercase
        }
    });

    if (skippedLines > 0) {
        console.log(`Skipped ${skippedLines} lines due to formatting issues or missing data.`);
    }
     if (clues.length === 0 && lines.length > 0 && skippedLines === lines.length) {
         throw new Error(`Failed to parse any valid clues from ${path.basename(filePath)}. Ensure the format is ANSWER,CLUE.`);
     }


    return clues;
}


// Helper function to determine output directory
function determineOutputDir(outputFolderOption: string | undefined, clueSource: string | 'manual'): string {
    if (outputFolderOption) {
        // Use provided path directly
        const resolvedPath = path.resolve(outputFolderOption);
        console.log(`Using specified output directory: ${resolvedPath}`);
        return resolvedPath;
    } else {
        // Determine default path based on clue source
        let defaultDirName: string;
        if (clueSource === 'manual') {
            // Use timestamp for manual entry
             defaultDirName = new Date().toISOString().replace(/[:.]/g, '-');
             console.log(`Using default timestamped directory for manual input: ${defaultDirName}`);
        } else {
             // Use filename (without extension) for file input
            const inputFileName = path.basename(clueSource, path.extname(clueSource));
            defaultDirName = inputFileName.replace(/[^a-zA-Z0-9_-]/g, '_'); // Sanitize name
             console.log(`Using default directory based on input file: ${defaultDirName}`);
        }
        // Construct the full path relative to the current working directory
        const defaultPath = path.join(process.cwd(), DEFAULT_OUTPUT_BASE, defaultDirName);
        return defaultPath;
    }
}


// Helper function for interactive clue input
async function promptForClues(): Promise<ClueInput[]> {
    const clues: ClueInput[] = [];
    console.log('Enter clues and answers. Press Enter with an empty answer to finish.');
    while (true) {
        const answerRaw = await input({ message: `Enter answer #${clues.length + 1} (or leave blank to finish):` });
        const answer = answerRaw.trim().toUpperCase(); // Trim and convert to uppercase
        if (!answer) {
            if (clues.length > 0) break; // Need at least one word
            else {
              console.log("Please enter at least one word.");
              continue;
            }
        }
        // Basic validation for answer (only letters)
        if (!/^[A-Z]+$/.test(answer)) {
             console.log("Invalid answer format. Please use only letters (A-Z).");
             continue;
        }

        const clueRaw = await input({ message: `Enter clue for "${answer}":` });
        const clue = clueRaw.trim(); // Trim clue

         if (!clue) { // Ensure clue is not empty after trimming
            console.log("Clue cannot be empty. Please provide a clue.");
            // Re-prompt for the clue for the same answer
             const correctedClueRaw = await input({ message: `Enter clue for "${answer}":` });
             const correctedClue = correctedClueRaw.trim();
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