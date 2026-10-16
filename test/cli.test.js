import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import spawn from 'cross-spawn';
import { installDependencies } from '../src/core/installer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const TEST_DIR = path.join(ROOT_DIR, 'test-scratch');

describe('Vibe-Stack CLI (create-vibe-app) Automated Test Suite', () => {
  before(async () => {
    try {
      await fs.remove(TEST_DIR);
    } catch {}
    await fs.ensureDir(TEST_DIR);
  });

  after(async () => {
    try {
      await fs.remove(TEST_DIR);
    } catch {}
  });

  // 1. CLI Execution
  describe('1. CLI Execution & Help / Version Flags', () => {
    test('CLI execution: Command runs without crashing and displays help', () => {
      const result = spawn.sync('node', [path.join(ROOT_DIR, 'bin', 'cli.js'), '--help'], {
        encoding: 'utf8',
      });
      assert.strictEqual(result.status, 0, `CLI --help failed: ${result.stderr}`);
      assert.ok(result.stdout.includes('Usage: create-vibe-app'), 'Output should contain usage string');
      assert.ok(result.stdout.includes('--supabase'), 'Output should document --supabase option');
      assert.ok(result.stdout.includes('--no-supabase'), 'Output should document --no-supabase option');
      assert.ok(result.stdout.includes('--tailwind'), 'Output should document --tailwind option');
      assert.ok(result.stdout.includes('--no-tailwind'), 'Output should document --no-tailwind option');
      assert.ok(result.stdout.includes('--ai-context'), 'Output should document --ai-context option');
      assert.ok(result.stdout.includes('--no-ai-context'), 'Output should document --no-ai-context option');
      assert.ok(result.stdout.includes('--overwrite'), 'Output should document --overwrite option');
    });

    test('CLI execution: Command displays correct version matching package.json', async () => {
      const pkg = await fs.readJson(path.join(ROOT_DIR, 'package.json'));
      const result = spawn.sync('node', [path.join(ROOT_DIR, 'bin', 'cli.js'), '--version'], {
        encoding: 'utf8',
      });
      assert.strictEqual(result.status, 0, `CLI --version failed: ${result.stderr}`);
      assert.strictEqual(result.stdout.trim(), pkg.version, 'Output version should match package.json');
    });
  });

  // 2. Core Scaffolding & Combinations
  describe('2. Project Scaffolding & Configuration Combinations', () => {
    test('Combination 1 (Default): Full stack with Supabase, Tailwind, AI Context & Middleware', async () => {
      const targetProject = path.join(TEST_DIR, 'vibe-combo-default');

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

      // Verify core project files exist
      assert.ok(await fs.pathExists(path.join(targetProject, 'package.json')), 'package.json should exist');
      assert.ok(await fs.pathExists(path.join(targetProject, 'tsconfig.json')), 'tsconfig.json should exist');
      assert.ok(await fs.pathExists(path.join(targetProject, 'next.config.mjs')), 'next.config.mjs should exist');
      assert.ok(await fs.pathExists(path.join(targetProject, '.gitignore')), '.gitignore should exist');
      assert.ok(await fs.pathExists(path.join(targetProject, 'app', 'layout.tsx')), 'app/layout.tsx should exist');
      assert.ok(await fs.pathExists(path.join(targetProject, 'app', 'page.tsx')), 'app/page.tsx should exist');
      assert.ok(await fs.pathExists(path.join(targetProject, 'app', 'api', 'health', 'route.ts')), 'app/api/health/route.ts should exist');
      assert.ok(await fs.pathExists(path.join(targetProject, 'components', 'Hero.tsx')), 'components/Hero.tsx should exist');

      // Verify project naming in package.json matches requested name
      const pkgJson = await fs.readJson(path.join(targetProject, 'package.json'));
      assert.strictEqual(pkgJson.name, 'vibe-combo-default', 'Package name must match requested name');

      // Supabase enabled: dependencies, helpers, environment, and root middleware
      assert.ok(pkgJson.dependencies['@supabase/supabase-js'], 'Supabase dependency should be included');
      assert.ok(pkgJson.dependencies['@supabase/ssr'], '@supabase/ssr should be included');
      assert.ok(await fs.pathExists(path.join(targetProject, 'lib', 'supabase', 'client.ts')), 'Supabase client helper should exist');
      assert.ok(await fs.pathExists(path.join(targetProject, 'lib', 'supabase', 'server.ts')), 'Supabase server helper should exist');
      assert.ok(await fs.pathExists(path.join(targetProject, 'lib', 'supabase', 'middleware.ts')), 'Supabase middleware helper should exist');
      assert.ok(await fs.pathExists(path.join(targetProject, 'types', 'database.ts')), 'types/database.ts should exist');
      assert.ok(await fs.pathExists(path.join(targetProject, 'middleware.ts')), 'middleware.ts should exist at project root');

      const envExample = await fs.readFile(path.join(targetProject, '.env.example'), 'utf8');
      assert.ok(envExample.includes('NEXT_PUBLIC_SUPABASE_URL'), '.env.example must include Supabase URL');
      assert.ok(envExample.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY'), '.env.example must include Supabase anon key');

      // Tailwind enabled: dependencies, postcss, globals.css
      assert.ok(pkgJson.devDependencies['tailwindcss'], 'Tailwind dependency should be included');
      assert.ok(pkgJson.devDependencies['@tailwindcss/postcss'], '@tailwindcss/postcss should be included');
      assert.ok(pkgJson.dependencies['tailwind-merge'], 'tailwind-merge should be included');
      assert.ok(await fs.pathExists(path.join(targetProject, 'postcss.config.mjs')), 'postcss.config.mjs should exist');

      const globalsCss = await fs.readFile(path.join(targetProject, 'app', 'globals.css'), 'utf8');
      assert.ok(globalsCss.includes('@import "tailwindcss"'), 'globals.css should import tailwindcss');

      // AI Context enabled: all instruction files present and tuned
      assert.ok(await fs.pathExists(path.join(targetProject, '.cursorrules')), '.cursorrules should exist');
      assert.ok(await fs.pathExists(path.join(targetProject, 'AGENTS.md')), 'AGENTS.md should exist');
      assert.ok(await fs.pathExists(path.join(targetProject, 'llms.txt')), 'llms.txt should exist');

      const cursorRules = await fs.readFile(path.join(targetProject, '.cursorrules'), 'utf8');
      assert.ok(cursorRules.includes('vibe-combo-default'), 'Cursorrules should reference project name');
      assert.ok(cursorRules.includes('SUPABASE & DATABASE ACCESS RULES'), 'Cursorrules should include Supabase rules');
      assert.ok(cursorRules.includes('TAILWIND CSS v4 & UI DIRECTIVES'), 'Cursorrules should include Tailwind rules');

      const agentsMd = await fs.readFile(path.join(targetProject, 'AGENTS.md'), 'utf8');
      assert.ok(agentsMd.includes('@database'), 'AGENTS.md should include database engineer');
      assert.ok(agentsMd.includes('@frontend'), 'AGENTS.md should include frontend engineer');
    });

    test('Combination 2: No Supabase (--no-supabase)', async () => {
      const targetProject = path.join(TEST_DIR, 'vibe-combo-no-supabase');

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

      // Verify Supabase files were removed
      assert.ok(!(await fs.pathExists(path.join(targetProject, 'lib', 'supabase'))), 'lib/supabase should NOT exist');
      assert.ok(!(await fs.pathExists(path.join(targetProject, 'types', 'database.ts'))), 'types/database.ts should NOT exist');
      assert.ok(!(await fs.pathExists(path.join(targetProject, 'middleware.ts'))), 'middleware.ts should NOT exist when Supabase is disabled');

      // Verify package.json contains no Supabase dependencies
      const pkgJson = await fs.readJson(path.join(targetProject, 'package.json'));
      assert.strictEqual(pkgJson.name, 'vibe-combo-no-supabase');
      assert.ok(!pkgJson.dependencies['@supabase/supabase-js'], 'Supabase dependency should NOT be in package.json');
      assert.ok(!pkgJson.dependencies['@supabase/ssr'], '@supabase/ssr should NOT be in package.json');

      // Verify .env.example contains no Supabase keys
      const envExample = await fs.readFile(path.join(targetProject, '.env.example'), 'utf8');
      assert.ok(!envExample.includes('NEXT_PUBLIC_SUPABASE_URL'), 'NEXT_PUBLIC_SUPABASE_URL should be removed');
      assert.ok(!envExample.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY'), 'NEXT_PUBLIC_SUPABASE_ANON_KEY should be removed');

      // Verify AI Context rules adapted to REST API data access
      const cursorRules = await fs.readFile(path.join(targetProject, '.cursorrules'), 'utf8');
      assert.ok(!cursorRules.includes('SUPABASE & DATABASE ACCESS RULES'), 'Supabase rules should be excluded');
      assert.ok(cursorRules.includes('DATA ACCESS RULES'), 'Fallback data access rules should be included');

      const agentsMd = await fs.readFile(path.join(targetProject, 'AGENTS.md'), 'utf8');
      assert.ok(agentsMd.includes('@backend'), 'AGENTS.md should feature API & Backend Engineer role');
      assert.ok(!agentsMd.includes('@database'), 'AGENTS.md should omit Supabase-specific @database role');
    });

    test('Combination 3: No AI Context (--no-ai-context)', async () => {
      const targetProject = path.join(TEST_DIR, 'vibe-combo-no-ai');

      const result = spawn.sync(
        'node',
        [
          path.join(ROOT_DIR, 'bin', 'cli.js'),
          targetProject,
          '--yes',
          '--no-ai-context',
          '--no-install',
          '--no-git',
        ],
        { encoding: 'utf8' }
      );

      assert.strictEqual(result.status, 0, `CLI failed with error: ${result.stderr || result.stdout}`);

      // Verify package naming still matches requested name
      const pkgJson = await fs.readJson(path.join(targetProject, 'package.json'));
      assert.strictEqual(pkgJson.name, 'vibe-combo-no-ai', 'Package name must match requested name with --no-ai-context');

      // Verify AI context instruction files are omitted without breaking generation
      assert.ok(!(await fs.pathExists(path.join(targetProject, '.cursorrules'))), '.cursorrules should NOT exist');
      assert.ok(!(await fs.pathExists(path.join(targetProject, 'AGENTS.md'))), 'AGENTS.md should NOT exist');
      assert.ok(!(await fs.pathExists(path.join(targetProject, 'llms.txt'))), 'llms.txt should NOT exist');

      // Core application files remain intact
      assert.ok(await fs.pathExists(path.join(targetProject, 'app', 'page.tsx')), 'app/page.tsx should exist');
      assert.ok(await fs.pathExists(path.join(targetProject, 'app', 'layout.tsx')), 'app/layout.tsx should exist');
    });

    test('Combination 4: No Tailwind (--no-tailwind)', async () => {
      const targetProject = path.join(TEST_DIR, 'vibe-combo-no-tailwind');

      const result = spawn.sync(
        'node',
        [
          path.join(ROOT_DIR, 'bin', 'cli.js'),
          targetProject,
          '--yes',
          '--no-tailwind',
          '--no-install',
          '--no-git',
        ],
        { encoding: 'utf8' }
      );

      assert.strictEqual(result.status, 0, `CLI failed with error: ${result.stderr || result.stdout}`);

      // Verify Tailwind dependencies and configs are stripped
      const pkgJson = await fs.readJson(path.join(targetProject, 'package.json'));
      assert.strictEqual(pkgJson.name, 'vibe-combo-no-tailwind');
      assert.ok(!pkgJson.devDependencies['tailwindcss'], 'tailwindcss should NOT be in devDependencies');
      assert.ok(!pkgJson.devDependencies['@tailwindcss/postcss'], '@tailwindcss/postcss should NOT be in devDependencies');
      assert.ok(!pkgJson.devDependencies['postcss'], 'postcss should NOT be in devDependencies');
      assert.ok(!pkgJson.dependencies['tailwind-merge'], 'tailwind-merge should NOT be in dependencies');
      assert.ok(!(await fs.pathExists(path.join(targetProject, 'postcss.config.mjs'))), 'postcss.config.mjs should be removed');

      // Verify lib/utils.ts is pure clsx
      const utilsContent = await fs.readFile(path.join(targetProject, 'lib', 'utils.ts'), 'utf8');
      assert.ok(!utilsContent.includes('tailwind-merge'), 'lib/utils.ts should NOT import tailwind-merge');
      assert.ok(utilsContent.includes('export function cn'), 'lib/utils.ts should export cn');

      // Verify globals.css cleans Tailwind layers and keeps CSS variables
      const globalsCss = await fs.readFile(path.join(targetProject, 'app', 'globals.css'), 'utf8');
      assert.ok(!globalsCss.includes('@import "tailwindcss"'), 'globals.css should NOT have @import "tailwindcss"');
      assert.ok(!globalsCss.includes('@layer base'), 'globals.css should NOT have @layer base wrapper');
      assert.ok(globalsCss.includes('--background:'), 'globals.css should retain custom CSS variables');

      // Verify AI Context rules adapted to standard CSS
      const cursorRules = await fs.readFile(path.join(targetProject, '.cursorrules'), 'utf8');
      assert.ok(!cursorRules.includes('TAILWIND CSS v4 & UI DIRECTIVES'), 'Tailwind rules should NOT be in .cursorrules');
      assert.ok(cursorRules.includes('UI & STYLING DIRECTIVES'), 'Standard CSS rules should be in .cursorrules');
    });

    test('Combination 5: Multi-flag (--no-supabase --no-tailwind)', async () => {
      const targetProject = path.join(TEST_DIR, 'vibe-combo-no-sub-no-tw');

      const result = spawn.sync(
        'node',
        [
          path.join(ROOT_DIR, 'bin', 'cli.js'),
          targetProject,
          '--yes',
          '--no-supabase',
          '--no-tailwind',
          '--no-install',
          '--no-git',
        ],
        { encoding: 'utf8' }
      );

      assert.strictEqual(result.status, 0, `CLI failed with error: ${result.stderr || result.stdout}`);

      const pkgJson = await fs.readJson(path.join(targetProject, 'package.json'));
      assert.strictEqual(pkgJson.name, 'vibe-combo-no-sub-no-tw');
      assert.ok(!pkgJson.dependencies['@supabase/supabase-js'], 'No Supabase dependencies');
      assert.ok(!pkgJson.devDependencies['tailwindcss'], 'No Tailwind dependencies');
      assert.ok(!(await fs.pathExists(path.join(targetProject, 'middleware.ts'))), 'No Supabase middleware');
      assert.ok(!(await fs.pathExists(path.join(targetProject, 'postcss.config.mjs'))), 'No PostCSS config');

      // AI Context adapted for both
      const cursorRules = await fs.readFile(path.join(targetProject, '.cursorrules'), 'utf8');
      assert.ok(cursorRules.includes('DATA ACCESS RULES'), 'Includes standard data access rules');
      assert.ok(cursorRules.includes('UI & STYLING DIRECTIVES'), 'Includes standard CSS styling rules');
    });

    test('Combination 6: Multi-flag (--no-supabase --no-ai-context)', async () => {
      const targetProject = path.join(TEST_DIR, 'vibe-combo-no-sub-no-ai');

      const result = spawn.sync(
        'node',
        [
          path.join(ROOT_DIR, 'bin', 'cli.js'),
          targetProject,
          '--yes',
          '--no-supabase',
          '--no-ai-context',
          '--no-install',
          '--no-git',
        ],
        { encoding: 'utf8' }
      );

      assert.strictEqual(result.status, 0, `CLI failed with error: ${result.stderr || result.stdout}`);

      const pkgJson = await fs.readJson(path.join(targetProject, 'package.json'));
      assert.strictEqual(pkgJson.name, 'vibe-combo-no-sub-no-ai');
      assert.ok(!pkgJson.dependencies['@supabase/supabase-js'], 'No Supabase');
      assert.ok(pkgJson.devDependencies['tailwindcss'], 'Retains Tailwind');
      assert.ok(!(await fs.pathExists(path.join(targetProject, '.cursorrules'))), 'No AI context');
    });

    test('Combination 7: Multi-flag (--no-tailwind --no-ai-context)', async () => {
      const targetProject = path.join(TEST_DIR, 'vibe-combo-no-tw-no-ai');

      const result = spawn.sync(
        'node',
        [
          path.join(ROOT_DIR, 'bin', 'cli.js'),
          targetProject,
          '--yes',
          '--no-tailwind',
          '--no-ai-context',
          '--no-install',
          '--no-git',
        ],
        { encoding: 'utf8' }
      );

      assert.strictEqual(result.status, 0, `CLI failed with error: ${result.stderr || result.stdout}`);

      const pkgJson = await fs.readJson(path.join(targetProject, 'package.json'));
      assert.strictEqual(pkgJson.name, 'vibe-combo-no-tw-no-ai');
      assert.ok(!pkgJson.devDependencies['tailwindcss'], 'No Tailwind');
      assert.ok(pkgJson.dependencies['@supabase/supabase-js'], 'Retains Supabase');
      assert.ok(!(await fs.pathExists(path.join(targetProject, '.cursorrules'))), 'No AI context');
      assert.ok(await fs.pathExists(path.join(targetProject, 'middleware.ts')), 'Retains Supabase middleware');
    });

    test('Combination 8: Minimal base Next.js (--no-supabase --no-tailwind --no-ai-context)', async () => {
      const targetProject = path.join(TEST_DIR, 'vibe-combo-bare-minimal');

      const result = spawn.sync(
        'node',
        [
          path.join(ROOT_DIR, 'bin', 'cli.js'),
          targetProject,
          '--yes',
          '--no-supabase',
          '--no-tailwind',
          '--no-ai-context',
          '--no-install',
          '--no-git',
        ],
        { encoding: 'utf8' }
      );

      assert.strictEqual(result.status, 0, `CLI failed with error: ${result.stderr || result.stdout}`);

      const pkgJson = await fs.readJson(path.join(targetProject, 'package.json'));
      assert.strictEqual(pkgJson.name, 'vibe-combo-bare-minimal');
      assert.ok(!pkgJson.dependencies['@supabase/supabase-js']);
      assert.ok(!pkgJson.devDependencies['tailwindcss']);
      assert.ok(!(await fs.pathExists(path.join(targetProject, '.cursorrules'))));
      assert.ok(!(await fs.pathExists(path.join(targetProject, 'middleware.ts'))));
      assert.ok(!(await fs.pathExists(path.join(targetProject, 'postcss.config.mjs'))));
      assert.ok(await fs.pathExists(path.join(targetProject, 'app', 'page.tsx')));
    });
  });

  // 3. Git Initialization
  describe('3. Git Initialization Verification', () => {
    test('Git initialization: Initializes repository and creates initial commit when --git is enabled', async () => {
      const targetProject = path.join(TEST_DIR, 'vibe-git-enabled');

      const result = spawn.sync(
        'node',
        [
          path.join(ROOT_DIR, 'bin', 'cli.js'),
          targetProject,
          '--yes',
          '--git',
          '--no-install',
        ],
        { encoding: 'utf8' }
      );

      assert.strictEqual(result.status, 0, `CLI failed with error: ${result.stderr || result.stdout}`);

      // Verify .git directory exists
      assert.ok(await fs.pathExists(path.join(targetProject, '.git')), '.git directory should be initialized');

      // Verify git repository status is clean and initial commit was made
      const gitLog = spawn.sync('git', ['log', '-1', '--oneline'], {
        cwd: targetProject,
        encoding: 'utf8',
      });
      assert.strictEqual(gitLog.status, 0, 'git log should succeed');
      assert.ok(gitLog.stdout.includes('chore: initial commit'), 'Initial commit message should be present');
    });

    test('Git initialization: Omits repository initialization when --no-git is specified', async () => {
      const targetProject = path.join(TEST_DIR, 'vibe-git-disabled');

      const result = spawn.sync(
        'node',
        [
          path.join(ROOT_DIR, 'bin', 'cli.js'),
          targetProject,
          '--yes',
          '--no-git',
          '--no-install',
        ],
        { encoding: 'utf8' }
      );

      assert.strictEqual(result.status, 0, `CLI failed with error: ${result.stderr || result.stdout}`);

      // Verify .git directory does NOT exist
      assert.strictEqual(await fs.pathExists(path.join(targetProject, '.git')), false, '.git directory should NOT exist with --no-git');
    });
  });

  // 4. Error Handling
  describe('4. Error Handling & Edge Conditions', () => {
    test('Error handling: Unknown CLI option produces clear error and exits with code 1', () => {
      const result = spawn.sync(
        'node',
        [
          path.join(ROOT_DIR, 'bin', 'cli.js'),
          path.join(TEST_DIR, 'vibe-unknown-flag'),
          '--unknown-flag-xyz',
        ],
        { encoding: 'utf8' }
      );

      assert.strictEqual(result.status, 1, 'Should exit with code 1 for unknown option');
      assert.ok(
        result.stderr.includes("unknown option '--unknown-flag-xyz'") ||
        result.stdout.includes("unknown option '--unknown-flag-xyz'"),
        'Should report unknown option error'
      );
    });

    test('Error handling: Unsupported package manager produces clear error and exits with code 1', () => {
      const result = spawn.sync(
        'node',
        [
          path.join(ROOT_DIR, 'bin', 'cli.js'),
          path.join(TEST_DIR, 'vibe-bad-pm'),
          '--yes',
          '-p',
          'unsupported-pkg-mgr',
          '--no-install',
          '--no-git',
        ],
        { encoding: 'utf8' }
      );

      assert.strictEqual(result.status, 1, 'Should exit with code 1 for invalid package manager');
      const output = result.stderr + result.stdout;
      assert.ok(output.includes('Invalid package manager "unsupported-pkg-mgr"'), 'Should display error about invalid package manager');
      assert.ok(output.includes('Supported package managers are: npm, pnpm, yarn, bun'), 'Should list supported package managers');
    });

    test('Error handling: Invalid template produces clear error and exits with code 1', () => {
      const result = spawn.sync(
        'node',
        [
          path.join(ROOT_DIR, 'bin', 'cli.js'),
          path.join(TEST_DIR, 'vibe-bad-template'),
          '--yes',
          '-t',
          'non-existent-template',
          '--no-install',
          '--no-git',
        ],
        { encoding: 'utf8' }
      );

      assert.strictEqual(result.status, 1, 'Should exit with code 1 for invalid template');
      const output = result.stderr + result.stdout;
      assert.ok(output.includes('Template "non-existent-template" not found'), 'Should report template not found');
    });

    test('Error handling: Non-empty target directory without --overwrite produces clear error and aborts', async () => {
      const collisionDir = path.join(TEST_DIR, 'vibe-collision-dir');
      await fs.ensureDir(collisionDir);
      await fs.writeFile(path.join(collisionDir, 'important-user-file.txt'), 'do-not-delete');

      const result = spawn.sync(
        'node',
        [
          path.join(ROOT_DIR, 'bin', 'cli.js'),
          collisionDir,
          '--yes',
          '--no-install',
          '--no-git',
        ],
        { encoding: 'utf8' }
      );

      assert.strictEqual(result.status, 1, 'Should exit with code 1 when directory already exists and is non-empty');
      const output = result.stderr + result.stdout;
      assert.ok(output.includes('already exists and is not empty'), 'Should warn about non-empty directory collision');
      assert.ok(output.includes('--overwrite'), 'Should mention --overwrite flag in error message');

      // Verify existing file was preserved
      assert.ok(await fs.pathExists(path.join(collisionDir, 'important-user-file.txt')), 'Existing file should be preserved');
    });

    test('Error handling: Non-empty target directory WITH --overwrite succeeds and scaffolds project', async () => {
      const overwriteDir = path.join(TEST_DIR, 'vibe-overwrite-dir');
      await fs.ensureDir(overwriteDir);
      await fs.writeFile(path.join(overwriteDir, 'old-file.txt'), 'will-be-overwritten');

      const result = spawn.sync(
        'node',
        [
          path.join(ROOT_DIR, 'bin', 'cli.js'),
          overwriteDir,
          '--yes',
          '--overwrite',
          '--no-install',
          '--no-git',
        ],
        { encoding: 'utf8' }
      );

      assert.strictEqual(result.status, 0, `Scaffolding with --overwrite should succeed: ${result.stderr || result.stdout}`);
      assert.ok(await fs.pathExists(path.join(overwriteDir, 'package.json')), 'Project should be successfully scaffolded');
    });

    test('Error handling: installDependencies rejects when an invalid package manager is provided', async () => {
      await assert.rejects(
        async () => {
          await installDependencies(TEST_DIR, 'fake-pm', true);
        },
        /Unsupported package manager: "fake-pm"/,
        'Should reject with descriptive unsupported package manager error'
      );
    });
  });

  // 5. Dependency Installation & Production Build Verification
  describe('5. Dependency Installation & Production Build Verification', () => {
    test('Dependency installation: Generated application installs from a clean lockfile', () => {
      const demoDir = path.join(ROOT_DIR, 'demo-app');
      assert.ok(fs.existsSync(path.join(demoDir, 'pnpm-lock.yaml')), 'demo-app lockfile must exist');

      // Verify that the application installs from a frozen/clean lockfile with zero resolution drift
      const frozenInstall = spawn.sync('pnpm', ['install', '--frozen-lockfile'], {
        cwd: demoDir,
        encoding: 'utf8',
      });

      assert.strictEqual(
        frozenInstall.status,
        0,
        `pnpm install --frozen-lockfile failed: ${frozenInstall.stderr || frozenInstall.stdout}`
      );
      assert.ok(
        frozenInstall.stdout.includes('Lockfile is up to date') ||
        frozenInstall.stdout.includes('passes supply-chain') ||
        frozenInstall.stdout.includes('Already up to date'),
        'Lockfile should be clean and synchronized with package.json'
      );
    });

    test('Production build: npm run build succeeds and creates optimized assets', { timeout: 300000 }, () => {
      const demoDir = path.join(ROOT_DIR, 'demo-app');

      const buildResult = spawn.sync('npm', ['run', 'build'], {
        cwd: demoDir,
        encoding: 'utf8',
      });

      assert.strictEqual(
        buildResult.status,
        0,
        `Production build failed with error: ${buildResult.stderr || buildResult.stdout}`
      );

      // Verify build output assets (.next directory, server, and static chunks)
      assert.ok(fs.existsSync(path.join(demoDir, '.next')), '.next build output directory should exist');
      assert.ok(fs.existsSync(path.join(demoDir, '.next', 'server')), '.next/server should exist');
      assert.ok(fs.existsSync(path.join(demoDir, '.next', 'static')), '.next/static should exist');
    });
  });

  // 6. Version Alignment
  describe('6. Version Alignment & Dynamic Health Endpoint', () => {
    test('Dynamic health route imports package.json as single source of truth', async () => {
      const healthRoutePath = path.join(ROOT_DIR, 'templates', 'base-next', 'app', 'api', 'health', 'route.ts');
      const healthContent = await fs.readFile(healthRoutePath, 'utf8');
      assert.ok(healthContent.includes("import pkg from '@/package.json'"), 'Health route should import package.json');
      assert.ok(healthContent.includes('Next.js ${majorVersion}'), 'Health route should dynamically compute Next.js version');
    });

    test('All references across root and templates are aligned to Next.js 15', async () => {
      const rootPkg = await fs.readJson(path.join(ROOT_DIR, 'package.json'));
      assert.ok(rootPkg.description.includes('Next.js 15'), 'Root package.json description should reference Next.js 15');
      assert.ok(!rootPkg.description.includes('Next.js 16'), 'Root package.json description should NOT reference Next.js 16');

      const readmeContent = await fs.readFile(path.join(ROOT_DIR, 'README.md'), 'utf8');
      assert.ok(!readmeContent.includes('Next.js 16'), 'README.md should not reference Next.js 16');
      assert.ok(readmeContent.includes('Next.js 15'), 'README.md should reference Next.js 15');

      const heroContent = await fs.readFile(path.join(ROOT_DIR, 'templates', 'base-next', 'components', 'Hero.tsx'), 'utf8');
      assert.ok(!heroContent.includes('Next.js 16'), 'Hero.tsx should not reference Next.js 16');
      assert.ok(heroContent.includes('Next.js 15'), 'Hero.tsx should reference Next.js 15');

      const layoutContent = await fs.readFile(path.join(ROOT_DIR, 'templates', 'base-next', 'app', 'layout.tsx'), 'utf8');
      assert.ok(!layoutContent.includes('Next.js 16'), 'layout.tsx should not reference Next.js 16');
      assert.ok(layoutContent.includes('Next.js 15'), 'layout.tsx should reference Next.js 15');
    });
  });
});
