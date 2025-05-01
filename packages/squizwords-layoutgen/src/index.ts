/// <reference path="./declarations.d.ts" />

import { LayoutOptimizer } from './LayoutOptimizer';
import { ClueInput, LayoutData, LayoutGeneratorFn, CLGResult, CLGResultItem } from './types';

// @ts-ignore
import clg from 'crossword-layout-generator';

// --- Actual Layout Generator Function ---
// This function now correctly takes ClueInput[] and passes it to the generator.
const actualLayoutGenerator: LayoutGeneratorFn = (clues: ClueInput[]): LayoutData[] => {
    const answerOrder = clues.map(c => c.answer).join(', '); // For logging
    console.log(`   [Generator] Generating layout for permutation order: ${answerOrder}...`);
    try {
        // Pass the ClueInput[] array directly
        const layoutResult = clg.generateLayout(clues) as CLGResult;

        if (!layoutResult || !Array.isArray(layoutResult.result)) {
            console.error("   [Generator] Error: Received invalid result format from crossword-layout-generator.", layoutResult);
            return []; // Indicate failure
        }

        console.log(`   [Generator] Layout generated (${layoutResult.result.length} words placed).`);

        // Map the generator's output (CLGResultItem[]) to LayoutData[]
        // Expecting 'clue' to be present in the result items since we provided it.
        const formattedResult: LayoutData[] = layoutResult.result.map((item: CLGResultItem) => ({
            clue: item.clue, // Assume clue is returned
            answer: item.answer,
            orientation: item.orientation,
            startx: item.startx,
            starty: item.starty,
            position: item.position
        }));

        return formattedResult;

    } catch (error) {
        // Catch potential errors from the generator library itself
        console.error("   [Generator] Error executing clg.generateLayout:", error);
        return []; // Indicate critical failure by returning empty layout
    }
};

// Exporting for potential external use, though primarily designed to be run directly
export { LayoutOptimizer, actualLayoutGenerator }; // Export actualLayoutGenerator
export * from './types'; 