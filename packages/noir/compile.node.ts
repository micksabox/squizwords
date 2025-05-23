import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { CompiledCircuit } from '@noir-lang/types';
// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Updated function for Bun test environment: Loads pre-compiled artifact
export async function getCircuitForTest(): Promise<CompiledCircuit> {
  
    // Resolve path to the pre-compiled circuit JSON in the target directory
    // Assuming the standard Nargo output file name is 'main.json'
    const circuitPath = path.resolve(__dirname, 'target', 'squizword.json');
  
    try {
      // Read the JSON file content
      const circuitJsonString = await fs.readFile(circuitPath, 'utf-8');
  
      // Parse the JSON content
      const compiledCircuit = JSON.parse(circuitJsonString);
  
      // Return the parsed circuit object.
      // The standard Nargo JSON output should conform to CompiledCircuit.
      return compiledCircuit as CompiledCircuit;
    } catch (error) {
      console.error(`Error reading or parsing circuit file at ${circuitPath}:`, error);
      throw new Error(`Could not load pre-compiled circuit from ${circuitPath}. Make sure 'nargo compile' has been run in packages/noir.`);
    }
  }
  