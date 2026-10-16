import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import spawn from 'cross-spawn';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const TEST_DIR = path.join(ROOT_DIR, 'test-scratch');

describe('Vibe-Stack CLI (create-vibe-app) Test Suite', () => {
  before(async () => {
    await fs.remove(TEST_DIR);
    await fs.ensureDir(TEST_DIR);
  });

  after(async () => {
    await fs.remove(TEST_DIR);
  });

  test('Scaffolds default project with full Supabase & AI Context', async () => {
    const targetProject = path.join(TEST_DIR, 'vibe-test-app-full');
    
    // Run CLI
    const result = spawn.sync(
      'node',
      [
        path.join(ROOT_DIR, 'bin', 'cli.js'),
        targetProject,
        '--yes',
        '--no-install',
        '--no-git',
      ],
      { encoding: 'utf8' }
    );

    assert.strictEqual(result.status, 0, `CLI failed with error: ${result.stderr || result.stdout}`);

    // Verify critical project files exist
    assert.ok(await fs.pathExists(path.join(targetProject, 'package.json')), 'package.json should exist');
    assert.ok(await fs.pathExists(path.join(targetProject, 'tsconfig.json')), 'tsconfig.json should exist');
    assert.ok(await fs.pathExists(path.join(targetProject, 'app', 'layout.tsx')), 'app/layout.tsx should exist');
    assert.ok(await fs.pathExists(path.join(targetProject, 'app', 'page.tsx')), 'app/page.tsx should exist');
    assert.ok(await fs.pathExists(path.join(targetProject, 'lib', 'supabase', 'client.ts')), 'Supabase client should exist');
    assert.ok(await fs.pathExists(path.join(targetProject, 'lib', 'supabase', 'server.ts')), 'Supabase server helper should exist');

    // Verify AI Context files
    assert.ok(await fs.pathExists(path.join(targetProject, '.cursorrules')), '.cursorrules should exist');
    assert.ok(await fs.pathExists(path.join(targetProject, 'AGENTS.md')), 'AGENTS.md should exist');
    assert.ok(await fs.pathExists(path.join(targetProject, 'llms.txt')), 'llms.txt should exist');

    // Check content injection
    const cursorRules = await fs.readFile(path.join(targetProject, '.cursorrules'), 'utf8');
    assert.ok(cursorRules.includes('vibe-test-app-full'), 'Project name should be injected into .cursorrules');
    assert.ok(cursorRules.includes('SUPABASE & DATABASE ACCESS RULES'), 'Supabase rules should be injected');

    const agentsMd = await fs.readFile(path.join(targetProject, 'AGENTS.md'), 'utf8');
    assert.ok(agentsMd.includes('@database'), 'Database agent role should be present');

    const pkgJson = await fs.readJson(path.join(targetProject, 'package.json'));
    assert.strictEqual(pkgJson.name, 'vibe-test-app-full');
    assert.ok(pkgJson.dependencies['@supabase/supabase-js'], 'Supabase dependency should be included');
  });

  test('Scaffolds project without Supabase when --no-supabase flag is passed', async () => {
    const targetProject = path.join(TEST_DIR, 'vibe-test-app-minimal');

    // Run CLI
    const result = spawn.sync(
      'node',
      [
        path.join(ROOT_DIR, 'bin', 'cli.js'),
        targetProject,
        '--yes',
        '--no-supabase',
        '--no-install',
        '--no-git',
      ],
      { encoding: 'utf8' }
    );

    assert.strictEqual(result.status, 0, `CLI failed with error: ${result.stderr || result.stdout}`);

    // Verify Supabase files were excluded
    assert.ok(!(await fs.pathExists(path.join(targetProject, 'lib', 'supabase'))), 'lib/supabase should NOT exist');
    assert.ok(!(await fs.pathExists(path.join(targetProject, 'types', 'database.ts'))), 'types/database.ts should NOT exist');

    // Check package.json doesn't contain Supabase
    const pkgJson = await fs.readJson(path.join(targetProject, 'package.json'));
    assert.ok(!pkgJson.dependencies['@supabase/supabase-js'], 'Supabase dependency should NOT be in package.json');

    // Check .cursorrules does not contain Supabase section
    const cursorRules = await fs.readFile(path.join(targetProject, '.cursorrules'), 'utf8');
    assert.ok(!cursorRules.includes('SUPABASE & DATABASE ACCESS RULES'), 'Supabase rules should be excluded');
    assert.ok(cursorRules.includes('DATA ACCESS RULES'), 'Fallback data access rules should be included');
  });
});
