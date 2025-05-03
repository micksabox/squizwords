export type Dimensions = {
    cols: number;
    rows: number;
};

/**
 * Calculates the dimensions (rows and columns) of a crossword grid represented as a multi-line string.
 * Assumes a rectangular grid where all rows have the same length.
 * @param gridString The crossword grid as a single string with newline characters separating rows.
 * @returns An object containing the number of columns and rows, or null if the grid is empty or invalid.
 */
export function calculateGridDimensions(gridString: string): Dimensions | null {
    if (!gridString) {
        return null;
    }

    const rowsArray = gridString.trimEnd().split('\n');
    const rows = rowsArray.length;

    if (rows === 0) {
        return null;
    }

    // Assume all rows have the same length as the first row
    const cols = rowsArray[0].length;

    if (cols === 0) {
        // Handle case of empty rows if necessary, though split usually yields [""] for single empty line
        return null;
    }

    return { cols, rows };
} 