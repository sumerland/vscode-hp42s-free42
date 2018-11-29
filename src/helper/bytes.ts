/** Hex string AA BB CC to byte array */
export function toBytes(content: string): number[] {
  var bytes: number[] = [];

  content.split(/\s+/).forEach(hex => {
    bytes.push(parseInt(hex, 16));
  });

  return bytes;
}