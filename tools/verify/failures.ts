// What a failed test run says of its failures, for verify's step 4.
/** What a failed run says of its failures (session 262: the first sixty lines shown were the passing files, and
 *  the failure itself lay in the lines cut off): vitest's failures section, or else the run's end. */
export function failuresOf(output: string): string {
  const lines = output.split('\n');
  const from = lines.findIndex((l) => /Failed Tests? \d+|FAIL\s/.test(l));
  return (from >= 0 ? lines.slice(from) : lines.slice(-60)).join('\n');
}
