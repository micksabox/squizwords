#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import clg from 'crossword-layout-generator';

// Determine the directory name in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine the input file path relative to the script's directory
const inputFilePath = path.join(__dirname, '../input.json');

let inputJson;

try {
  const rawData = fs.readFileSync(inputFilePath, 'utf8');
  inputJson = JSON.parse(rawData);
} catch (err) {
  console.error(`Error reading or parsing input file at ${inputFilePath}:`, err);
  process.exit(1);
}

if (!inputJson || !Array.isArray(inputJson)) {
    console.error('Input data is invalid. Expected an array of { clue, answer } objects.');
    process.exit(1);
}

// Generate the layout
const layout = clg.generateLayout(inputJson);

// Output the results
console.log('Generated Layout:');
console.log('Size:', `${layout.rows} rows x ${layout.cols} cols`);
console.log('\nLayout Data (JSON):');
console.log(JSON.stringify(layout.result, null, 2));

console.log('\nLayout Grid (Plain Text):');
// Replace <br> with newline for console output
const grid = layout.table_string.replace(/<br>/g, '\n'); 
console.log(grid); 