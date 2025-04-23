import { poseidon2Hash } from '@aztec/foundation/crypto';

export const calculateCluePoseidonHash = async (
  solution: string,
): Promise<string> => {
  // Map solution characters to BigInts (using ASCII values)
  // Treat potential empty strings/undefined chars in a solution string as 0
  const inputs = solution
    .split('')
    .map((char) => BigInt(char ? char.charCodeAt(0) : 0));

  console.log('inputs', inputs);

  // Calculate the Poseidon hash iteratively using poseidon2
  // poseidon2 takes exactly two inputs.
  // let currentHash = 0n; // Start with 0 (as BigInt)
  let currentHash = await poseidon2Hash(inputs);
  // for (const input of inputs) {
  //   // currentHash = await poseidon2Hash([currentHash, input]);
  // }

  console.log('currentHash', currentHash);

  // Convert the BigInt hash to a hexadecimal string
  const hexHash = currentHash.toString();

  console.log('hexHash', hexHash);

  // Return the hash as a string
  return currentHash.toString();
};

