// packages/squizwords-layoutgen/src/LayoutOptimizer.ts

import {
    ClueInput,
    LayoutData,
    AcceptableLayout,
    EvaluationResult,
    FailedAttempt,
    LayoutGeneratorFn
} from './types';

/**
 * Manages the iterative process of generating acceptable crossword layouts
 * by trying different permutations of input words against a provided generator.
 */
export class LayoutOptimizer {
    private inputClues: ClueInput[];
    private numLayoutsToGenerate: number;
    private maxIterations: number;
    private layoutGenerator: LayoutGeneratorFn; // Function provided externally

    public acceptableLayouts: AcceptableLayout[] = [];
    public failedPermutations: FailedAttempt[] = [];
    public currentIteration: number = 0;
    // Use a Set to track the string representation (answer order) of tried permutations
    private triedPermutations: Set<string> = new Set();

    /**
     * Creates an instance of LayoutOptimizer.
     * @param inputClues The list of clues and answers.
     * @param numLayoutsToGenerate The target number of acceptable layouts to find.
     * @param layoutGenerator The function responsible for generating a layout from a list of answers.
     * @param maxIterations The maximum number of permutations to attempt (default: 30).
     */
    constructor(
        inputClues: ClueInput[],
        numLayoutsToGenerate: number,
        layoutGenerator: LayoutGeneratorFn,
        maxIterations: number = 30,
    ) {
        if (numLayoutsToGenerate <= 0) {
            throw new Error('Number of layouts to generate must be positive.');
        }
        if (maxIterations <= 0) {
            throw new Error('Maximum iterations must be positive.');
        }
        this.inputClues = [...inputClues]; // Defensive copy
        this.numLayoutsToGenerate = numLayoutsToGenerate;
        this.layoutGenerator = layoutGenerator;
        this.maxIterations = maxIterations;
    }

    /**
     * Runs the optimization process to find acceptable layouts.
     * Iterates through permutations, generates layouts, evaluates them, and collects results.
     */
    public async run(): Promise<void> {
        this.acceptableLayouts = [];
        this.failedPermutations = [];
        this.currentIteration = 0;
        this.triedPermutations.clear();

        // Keep original answers separately for evaluation checks
        const originalAnswers = this.inputClues.map(item => item.answer);

        console.log(`Starting layout optimization. Target: ${this.numLayoutsToGenerate} layouts, Max iterations: ${this.maxIterations}`);

        // --- Attempt 1: Sorted by answer ---
        if (this.inputClues.length > 0 && this.maxIterations > 0 && this.acceptableLayouts.length < this.numLayoutsToGenerate) {
            this.currentIteration++;
            const sortedCluePermutation = [...this.inputClues].sort((a, b) => a.answer.localeCompare(b.answer));
            const sortedPermutationKey = sortedCluePermutation.map(c => c.answer).join(',');

            console.log(`Iteration ${this.currentIteration}/${this.maxIterations}: Trying initial sorted permutation: ${sortedPermutationKey}`);
            this.triedPermutations.add(sortedPermutationKey);

            try {
                const generatedLayout = await Promise.resolve(this.layoutGenerator(sortedCluePermutation));
                const evaluationResult = this.evaluateLayout(generatedLayout, originalAnswers);

                if (evaluationResult.isAcceptable) {
                    console.log(`Iteration ${this.currentIteration}: Found acceptable layout (${this.acceptableLayouts.length + 1}/${this.numLayoutsToGenerate}) from sorted permutation.`);
                    const grid = this.generateGrid(generatedLayout);
                    this.acceptableLayouts.push({
                        layout: generatedLayout,
                        grid: grid,
                        permutation: [...sortedCluePermutation]
                    });
                } else if (evaluationResult.criticalIssues.length > 0) {
                    console.log(`Iteration ${this.currentIteration}: Critical issues found in sorted permutation: ${evaluationResult.criticalIssues.join('; ')}`);
                    this.failedPermutations.push({
                        permutation: [...sortedCluePermutation],
                        errors: evaluationResult.criticalIssues
                    });
                } else {
                    console.log(`Iteration ${this.currentIteration}: Sorted permutation generated but has suboptimal issues: ${evaluationResult.suboptimalIssues.join('; ')}`);
                }
            } catch (error) {
                console.error(`Iteration ${this.currentIteration}: Error during layout generation or evaluation for sorted permutation key [${sortedPermutationKey}]:`, error);
                this.failedPermutations.push({
                    permutation: [...sortedCluePermutation],
                    errors: [`Generator/Evaluation Error: ${error instanceof Error ? error.message : String(error)}`]
                });
            }
        }

        // --- Subsequent attempts: Shuffled permutations ---
        // Array to be shuffled contains ClueInput objects
        let currentCluePermutation = [...this.inputClues];

        while (
            this.acceptableLayouts.length < this.numLayoutsToGenerate &&
            this.currentIteration < this.maxIterations
        ) {
            this.currentIteration++;

            // Shuffle the array of ClueInput objects
            currentCluePermutation = this.shuffleArray(currentCluePermutation);

            // Generate a string key based on the order of answers in the current permutation
            const permutationKey = currentCluePermutation.map(c => c.answer).join(',');

            // Skip if this answer order has been tried
            if (this.triedPermutations.has(permutationKey)) {
                console.warn(`Iteration ${this.currentIteration}: Skipping duplicate permutation key: ${permutationKey}`);
                // Check if all permutations might have been tried. This check is more complex now
                // as the total number of unique permutations is factorial(N)
                // and we have triedPermutations.size.
                // A simple check: if triedPermutations.size is very large, close to factorial(N), then break.
                // This threshold can be adjusted. For small N, factorial(N) is manageable.
                const estimatedMaxPermutations = this.factorial(this.inputClues.length);
                if (this.inputClues.length > 0 && this.triedPermutations.size >= estimatedMaxPermutations) {
                    console.warn("All possible answer permutations seem to have been tried.");
                    break;
                }
                // To prevent infinite loops if shuffling somehow consistently produces seen permutations
                // before maxIterations is reached with few unique items, we add a safety break.
                // This condition can be refined. If currentIteration is much larger than triedPermutations.size
                // and we are not finding new ones. For now, just continue.
                if (this.currentIteration >= this.maxIterations) { // Ensure loop termination if stuck
                    console.warn("Max iterations reached while potentially stuck on duplicate permutations.");
                    break;
                }
                continue;
            }
            this.triedPermutations.add(permutationKey);

            console.log(`Iteration ${this.currentIteration}/${this.maxIterations}: Trying permutation order: ${permutationKey}`);

            try {
                // Pass the permuted ClueInput[] array to the generator
                const generatedLayout = await Promise.resolve(this.layoutGenerator(currentCluePermutation));

                // Evaluate using the original list of answers for completeness check
                const evaluationResult = this.evaluateLayout(generatedLayout, originalAnswers);

                if (evaluationResult.isAcceptable) {
                    console.log(`Iteration ${this.currentIteration}: Found acceptable layout (${this.acceptableLayouts.length + 1}/${this.numLayoutsToGenerate}).`);
                    const grid = this.generateGrid(generatedLayout);
                    // Store the results including the successful ClueInput[] permutation
                    this.acceptableLayouts.push({
                        layout: generatedLayout,
                        grid: grid,
                        permutation: [...currentCluePermutation] // Store the ClueInput[] array
                    });
                } else if (evaluationResult.criticalIssues.length > 0) {
                    console.log(`Iteration ${this.currentIteration}: Critical issues found: ${evaluationResult.criticalIssues.join('; ')}`);
                    // Store the failed ClueInput[] permutation
                    this.failedPermutations.push({
                        permutation: [...currentCluePermutation], // Store the ClueInput[] array
                        errors: evaluationResult.criticalIssues
                    });
                } else {
                    console.log(`Iteration ${this.currentIteration}: Layout generated but has suboptimal issues: ${evaluationResult.suboptimalIssues.join('; ')}`);
                }
            } catch (error) {
                console.error(`Iteration ${this.currentIteration}: Error during layout generation or evaluation for permutation key [${permutationKey}]:`, error);
                this.failedPermutations.push({
                    permutation: [...currentCluePermutation], // Store the ClueInput[] array
                    errors: [`Generator/Evaluation Error: ${error instanceof Error ? error.message : String(error)}`]
                });
            }
        }

        console.log(`
Optimization finished after ${this.currentIteration} iterations.`);
        console.log(`Found ${this.acceptableLayouts.length} acceptable layouts.`);
        if (this.failedPermutations.length > 0) {
            console.log(`${this.failedPermutations.length} permutations resulted in critical errors or exceptions.`);
        }
        if (this.acceptableLayouts.length < this.numLayoutsToGenerate && this.currentIteration >= this.maxIterations) {
            console.warn(`Target number of layouts (${this.numLayoutsToGenerate}) not reached within the maximum iterations (${this.maxIterations}).`);
        }
    }

    /**
     * Evaluates a generated layout based on critical criteria:
     * - Missing words (orientation 'none' or not present in output)
     * - Overlapping words (conflicting characters in the same cell)
     */
    private evaluateLayout(layout: LayoutData[], originalAnswers: string[]): EvaluationResult {
        const criticalIssues: string[] = [];
        const suboptimalIssues: string[] = []; // For future use (e.g., connectivity)

        // Check 1: Missing words
        const layoutAnswers = new Set<string>();
        const placedWordsMap = new Map<string, LayoutData>(); // Track answers present in the layout data

        layout.forEach(item => {
            if (!item || typeof item.answer !== 'string') {
                // Handle malformed layout items if necessary
                console.warn('Encountered malformed item in layout data:', item);
                return;
            }
            placedWordsMap.set(item.answer, item);
            if (item.orientation === 'none') {
                criticalIssues.push(`Word not placed (orientation 'none'): "${item.answer}"`);
            } else {
                layoutAnswers.add(item.answer); // Only count words with a valid placement
            }
        });

        originalAnswers.forEach(answer => {
            if (!placedWordsMap.has(answer)) {
                criticalIssues.push(`Word missing entirely from layout output: "${answer}"`);
            }
            // No need for secondary check on layoutAnswers, as missing or 'none' covers it.
        });

        // Check 2: Overlapping words
        const overlapCheck = this.checkOverlap(layout);
        if (overlapCheck.isOverlapping) {
            criticalIssues.push(...overlapCheck.details);
        }

        // TODO: Implement Check 3: Disconnected components (Suboptimal)
        // const connectivityCheck = this.checkConnectivity(layout);
        // if (!connectivityCheck.isConnected) {
        //     suboptimalIssues.push(...connectivityCheck.details);
        // }

        return {
            isAcceptable: criticalIssues.length === 0,
            criticalIssues,
            suboptimalIssues,
        };
    }

    /**
     * Checks for critically overlapping words in the layout.
     * Critical overlap occurs when two words occupy the same cell with different characters.
     */
    private checkOverlap(layout: LayoutData[]): { isOverlapping: boolean; details: string[] } {
        const grid = new Map<string, { char: string; word: string }>(); // Key: "x,y", Value: {char, word_answer}
        const errors: string[] = [];
        let isOverlapping = false;

        for (const wordData of layout) {
            // Skip words that weren't placed or are malformed
            if (!wordData || wordData.orientation === 'none' || !wordData.answer) continue;

            const { answer, startx, starty, orientation } = wordData;
            let x = startx;
            let y = starty;

            for (let i = 0; i < answer.length; i++) {
                const char = answer[i];
                const key = `${x},${y}`;

                if (grid.has(key)) {
                    const existing = grid.get(key)!;
                    // Critical overlap ONLY if characters mismatch
                    if (existing.char !== char) {
                        isOverlapping = true;
                        const errorMsg = `Overlap conflict at (${x},${y}): "${answer}" ('${char}') conflicts with "${existing.word}" ('${existing.char}')`;
                        // Avoid adding essentially the same error twice from different perspectives
                        if (!errors.some(e => e.includes(`(${x},${y})`) && e.includes(answer) && e.includes(existing.word))) {
                           errors.push(errorMsg);
                        }
                    }
                    // If characters match, it's a valid intersection - do nothing.
                } else {
                    grid.set(key, { char, word: answer });
                }

                // Move to the next cell
                if (orientation === 'across') {
                    x++;
                } else if (orientation === 'down') {
                    y++;
                } else {
                    // Should not happen if 'none' is checked, but good for robustness
                    console.warn(`Word "${answer}" has invalid orientation during overlap check.`);
                    break; // Stop processing this word if orientation is invalid
                }
            }
        }

        return { isOverlapping, details: errors };
    }

    /**
     * Generates a plaintext grid representation of the layout.
     * @param layout The layout data for placed words.
     * @returns A string representing the crossword grid.
     */
    private generateGrid(layout: LayoutData[]): string {
        const placedWords = layout.filter(wordData => wordData && wordData.orientation !== 'none' && wordData.answer);
        if (placedWords.length === 0) return 'Empty layout (no words placed)';

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

        // Determine grid boundaries from placed words
        placedWords.forEach(wordData => {
            const { startx, starty, orientation, answer } = wordData;
            minX = Math.min(minX, startx);
            minY = Math.min(minY, starty);

            if (orientation === 'across') {
                maxX = Math.max(maxX, startx + answer.length - 1);
                maxY = Math.max(maxY, starty);
            } else { // 'down'
                maxX = Math.max(maxX, startx);
                maxY = Math.max(maxY, starty + answer.length - 1);
            }
        });

        // Handle edge case where somehow boundaries are not finite (e.g., empty layout filtered incorrectly)
        if (![minX, maxX, minY, maxY].every(Number.isFinite)) {
           console.error("Could not determine valid grid boundaries.");
           return "Error generating grid: Invalid boundaries";
        }

        const gridWidth = maxX - minX + 1;
        const gridHeight = maxY - minY + 1;
        const grid: string[][] = Array.from({ length: gridHeight }, () =>
            Array(gridWidth).fill(' ') // Use space or another placeholder for empty cells
        );

        // Populate the grid
        placedWords.forEach(wordData => {
            const { startx, starty, orientation, answer } = wordData;
            let x = startx - minX; // Adjust coordinates to be relative to the grid's top-left
            let y = starty - minY;

            for (let i = 0; i < answer.length; i++) {
                if (y >= 0 && y < gridHeight && x >= 0 && x < gridWidth) {
                    // Check if the cell is already filled (potential intersection)
                    const currentChar = answer[i];
                    if (grid[y][x] !== ' ' && grid[y][x] !== currentChar) {
                         // This should have been caught by checkOverlap, but log as a safeguard
                         console.warn(`Grid Generation Warning: Overwriting cell (${x+minX},${y+minY}) with '${currentChar}' from "${answer}". Previous char: '${grid[y][x]}'.`);
                    }
                    grid[y][x] = currentChar;
                } else {
                    // This indicates an issue with boundary calculation or word placement data
                    console.error(`Error: Word "${answer}" character index ${i} at calculated relative coordinates (${x}, ${y}) is out of grid bounds (${gridWidth}x${gridHeight}). Original coords: (${startx}, ${starty})`);
                }

                if (orientation === 'across') {
                    x++;
                } else { // 'down'
                    y++;
                }
            }
        });

        // Convert grid array to a multi-line string
        return grid.map(row => row.join('')).join('\n');
    }


    /**
     * Shuffles an array in place using the Fisher-Yates algorithm.
     * @param array The array to shuffle.
     * @returns The shuffled array (mutated in place).
     */
    private shuffleArray<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
        return array;
    }

    /**
     * Calculates the factorial of a number.
     * Used to estimate the total number of permutations.
     */
    private factorial(n: number): number {
        if (n < 0) return 0;
        if (n === 0) return 1;
        let result = 1;
        for (let i = n; i > 1; i--) {
            result *= i;
        }
        return result;
    }

    // Placeholder for future suboptimal check
    // private checkConnectivity(layout: LayoutData[]): { isConnected: boolean; details: string[] } {
    //     // Implementation would involve building a graph of connected words
    //     // and checking if it's a single connected component.
    //     return { isConnected: true, details: [] }; // Assume connected for now
    // }
} 