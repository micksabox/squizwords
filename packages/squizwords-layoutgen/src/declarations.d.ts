// packages/squizwords-layoutgen/src/declarations.d.ts

import { CLGResult } from './types';

/**
 * Minimal type declarations for the 'crossword-layout-generator' module.
 * This helps TypeScript understand the module exists and the basic signature
 * of the generateLayout function.
 */
declare module 'crossword-layout-generator' {
    // Define the input type accurately: Array of objects with optional clue and required answer
    type GeneratorInput = Array<{ clue?: string; answer: string }>;

    // Define the function signature based on observed usage
    export function generateLayout(input: GeneratorInput): CLGResult;

    // You could add other exported functions or types here if known
    // const clg: {
    //     generateLayout: (input: GeneratorInput) => CLGResult;
    // };
    // export default clg;
} 