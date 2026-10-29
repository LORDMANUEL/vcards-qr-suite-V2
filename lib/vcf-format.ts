/** Fold vCard text by UTF-8 byte length; continuation consumes one byte. */
export function foldVcfLine(value: string): string {
  let output = ''; let length = 0;
  for (const character of value) {
    const bytes = Buffer.byteLength(character, 'utf8');
    if (length + bytes > 75) { output += '\r\n '; length = 1; }
    output += character; length += bytes;
  }
  return output;
}
export function serializeVcfLines(lines: string[]): string {
  return lines.map(foldVcfLine).join('\r\n') + '\r\n';
}