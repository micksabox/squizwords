/**
 * Encodes a string into a bigint representation of its UTF-8 bytes in hexadecimal.
 * Empty strings are encoded as 0n.
 *
 * @param str The string to encode.
 * @returns The bigint representation of the hex-encoded UTF-8 bytes.
 */
export function encodeStringToField(str: string): bigint {
  if (str.length === 0) {
    return 0n;
  }
  const encoder = new TextEncoder(); // UTF-8 encoder
  const bytes = encoder.encode(str);
  let hexString = '0x';
  bytes.forEach(byte => {
    hexString += byte.toString(16).padStart(2, '0');
  });
  // Handle case where string might be empty or only contain null bytes resulting in just '0x'
  if (hexString === '0x') return 0n;
  // TODO: Consider potential field size limits if strings can be very long
  return BigInt(hexString);
}