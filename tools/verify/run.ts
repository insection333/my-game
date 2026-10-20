// The verify runner: runs steps in order and prints one line per step. Kept free of process and
// file access so its tests can drive it directly.

export type Status = 'pass' | 'fail' | 'skip';

export interface StepResult {
  status: Status;
  /** One short line: what was checked, or why it was skipped. */
  summary: string;
  /** Shown below the step's line when it fails. */
  detail?: string;
}

export interface Step {
  n: number;
  name: string;
  run: () => StepResult | Promise<StepResult>;
}

export interface RunOptions {
  only?: number[];
  print: (line: string) => void;
  now?: () => number;
  /** On GitHub Actions: also print each failure as an annotation, readable through the API. */
  annotate?: boolean;
}

/** A GitHub Actions error annotation for a failed step. */
export function annotation(step: Step, result: StepResult): string {
  const esc = (s: string) => s.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
  const body = `${result.summary}\n${result.detail ?? ''}`.slice(0, 6000);
  return `::error title=verify step ${step.n} (${step.name})::${esc(body)}`;
}

const LABEL: Record<Status, string> = { pass: 'pass', fail: 'FAIL', skip: 'skip' };

export function formatLine(step: Step, result: StepResult, seconds: number): string {
  const time = result.status === 'skip' ? '' : ` (${seconds.toFixed(1)} s)`;
  return `${String(step.n).padStart(2)}  ${step.name.padEnd(22)} ${LABEL[result.status]}  ${result.summary}${time}`;
}

/** Runs the steps and returns the process exit code: 1 if any step failed, else 0. */
export async function runSteps(steps: Step[], opts: RunOptions): Promise<number> {
  const now = opts.now ?? (() => performance.now());
  const chosen = opts.only?.length ? steps.filter((s) => opts.only!.includes(s.n)) : steps;
  const counts: Record<Status, number> = { pass: 0, fail: 0, skip: 0 };
  for (const step of chosen) {
    const start = now();
    let result: StepResult;
    try {
      result = await step.run();
    } catch (err) {
      result = {
        status: 'fail',
        summary: 'the step itself crashed',
        detail: String(err instanceof Error ? err.stack : err),
      };
    }
    counts[result.status]++;
    opts.print(formatLine(step, result, (now() - start) / 1000));
    if (result.status === 'fail' && result.detail) opts.print(indent(result.detail.trim()));
    if (result.status === 'fail' && opts.annotate) opts.print(annotation(step, result));
  }
  const notBuilt = counts.skip ? `, ${counts.skip} not built yet` : '';
  opts.print(
    counts.fail
      ? `verify: RED (${counts.fail} failed, ${counts.pass} passed${notBuilt})`
      : `verify: green (${counts.pass} passed${notBuilt})`,
  );
  return counts.fail ? 1 : 0;
}

function indent(text: string, max = 60): string {
  const lines = text.split('\n');
  const shown = lines.length > max ? [...lines.slice(0, max), `… ${lines.length - max} more lines`] : lines;
  return shown.map((l) => `      ${l}`).join('\n');
}
