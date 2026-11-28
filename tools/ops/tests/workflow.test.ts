// The deploy's trigger (session 289). The repository is public, and the deploy runs after verify passes
// with the server's SSH key and every secret, on the commit verify ran. A `workflow_run` trigger's branch
// filter reads the head branch of the run that triggered it, so a pull request from a fork whose branch
// is named `main` passed it: its own verify (on code the fork chose) would start the deploy, which checked
// out that fork's commit and ran its deploy script on the server with the secrets. The deploy now goes
// only after a push to this repository's main.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const WORKFLOWS = join(import.meta.dirname, '..', '..', '..', '.github', 'workflows');
const deploy = readFileSync(join(WORKFLOWS, 'deploy.yml'), 'utf8');
const verify = readFileSync(join(WORKFLOWS, 'verify.yml'), 'utf8');

describe("the deploy's trigger", () => {
  const guard = /^ {4}if: (.+)$/m.exec(deploy)?.[1] ?? '';

  it('runs after verify only for a push to this repository’s main', () => {
    expect(guard).toContain("github.event.workflow_run.event == 'push'");
    expect(guard).toContain('github.event.workflow_run.head_repository.full_name == github.repository');
    expect(guard).toContain("github.event.workflow_run.head_branch == 'main'");
    expect(guard).toContain("github.event.workflow_run.conclusion == 'success'");
  });

  it('never hands a pull request the secrets', () => {
    expect(deploy).not.toMatch(/pull_request/);
    expect(verify).not.toMatch(/pull_request_target/);
    expect(verify).not.toMatch(/secrets\./);
  });
});
