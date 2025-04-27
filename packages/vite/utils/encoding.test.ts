import { describe, it, expect } from 'bun:test';
import { encodeStringToField } from './encoding.js';
import { stringToHex } from 'viem';

describe('encodeStringToField', () => {
  it('should correctly encode "BYE" to its hex bigint representation', () => {
    const inputString = "BYE";
    const expectedHex = "0x425945";

    const expectedBigInt = BigInt(expectedHex);
    const actualBigInt = encodeStringToField(inputString);
    expect(actualBigInt).toEqual(expectedBigInt);
  });

  it('should return 0n for an empty string', () => {
    const inputString = "";
    const expectedBigInt = 0n;
    const actualBigInt = encodeStringToField(inputString);
    expect(actualBigInt).toEqual(expectedBigInt);
  });

  // Add more test cases as needed, e.g., for strings with numbers, symbols, etc.
  it('should correctly encode strings with numbers', () => {
    const inputString = "H3LLO";
    // H=48, 3=33, L=4C, L=4C, O=4F
    const expectedHex = "0x48334c4c4f";
    const expectedBigInt = BigInt(expectedHex);
    const actualBigInt = encodeStringToField(inputString);
    expect(actualBigInt).toEqual(expectedBigInt);
  });

}); 

describe('stringToHex', () => {
  it('should correctly convert "BYE" to its hex representation', () => {
    const inputString = "BYE";
    const expectedHex = "0x425945";
    const actualHex = stringToHex(inputString);
    expect(actualHex).toEqual(expectedHex);
  });
});
