// Runs a command from the repository root and captures its output.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('../../', import.meta.url));

export interface ExecResult {
  code: number;
  output: string;
}

export function exec(command: string, args: string[], env: Record<string, string> = {}): Promise<ExecResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd: ROOT, env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1', ...env } });
    let output = '';
    child.stdout.on('data', (d: Buffer) => (output += d.toString()));
    child.stderr.on('data', (d: Buffer) => (output += d.toString()));
    child.on('error', (err) => resolve({ code: 1, output: String(err) }));
    // eslint-disable-next-line no-control-regex
    child.on('close', (code) => resolve({ code: code ?? 1, output: output.replace(/\x1b\[[0-9;]*m/g, '') }));
  });
}

/** Runs a tool installed in the workspace's node_modules/.bin. */
export const bin = (name: string, args: string[], env?: Record<string, string>) =>
  exec(`${ROOT}node_modules/.bin/${name}`, args, env);

/** Runs a TypeScript file with Node's own type stripping. */
export const node = (file: string, args: string[] = []) => exec(process.execPath, [file, ...args]);
