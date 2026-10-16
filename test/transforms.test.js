import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';

import {
  applyNamingTransform,
  applySupabaseTransform,
  applyTailwindTransform,
  applyAiContextTransform,
} from '../src/core/transforms.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const TEST_DIR = path.join(ROOT_DIR, 'test-scratch-transforms');

describe('Configuration Transformations Unit Tests (src/core/transforms.js)', () => {
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

  test('applyNamingTransform: modifies package.json name attribute', async () => {
    const projectDir = path.join(TEST_DIR, 'test-naming');
    await fs.ensureDir(projectDir);
    await fs.writeJson(path.join(projectDir, 'package.json'), { name: 'initial-name' });

    await applyNamingTransform(projectDir, 'my-transformed-app');
    const updated = await fs.readJson(path.join(projectDir, 'package.json'));
    assert.strictEqual(updated.name, 'my-transformed-app');
  });

  test('applySupabaseTransform: removes Supabase dependencies, files, middleware, and env keys when disabled', async () => {
    const projectDir = path.join(TEST_DIR, 'test-supabase-transform');
    await fs.ensureDir(projectDir);
    await fs.writeJson(path.join(projectDir, 'package.json'), {
      name: 'test-supabase-transform',
      dependencies: {
        '@supabase/supabase-js': '^2.0.0',
        '@supabase/ssr': '^0.5.0',
        'next': '^15.0.0',
      },
    });

    await fs.ensureDir(path.join(projectDir, 'lib', 'supabase'));
    await fs.writeFile(path.join(projectDir, 'lib', 'supabase', 'client.ts'), '// client');
    await fs.ensureDir(path.join(projectDir, 'types'));
    await fs.writeFile(path.join(projectDir, 'types', 'database.ts'), '// types');
    await fs.writeFile(path.join(projectDir, 'middleware.ts'), '// middleware');
    await fs.writeFile(
      path.join(projectDir, '.env.example'),
      'PORT=3000\nNEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=ey...\n'
    );

    // Apply Supabase transform with enabled = false
    await applySupabaseTransform(projectDir, false);

    // Assert package.json dependencies removed
    const pkg = await fs.readJson(path.join(projectDir, 'package.json'));
    assert.ok(!pkg.dependencies['@supabase/supabase-js']);
    assert.ok(!pkg.dependencies['@supabase/ssr']);
    assert.ok(pkg.dependencies['next']);

    // Assert files removed
    assert.strictEqual(await fs.pathExists(path.join(projectDir, 'lib', 'supabase')), false);
    assert.strictEqual(await fs.pathExists(path.join(projectDir, 'types', 'database.ts')), false);
    assert.strictEqual(await fs.pathExists(path.join(projectDir, 'middleware.ts')), false);

    // Assert .env.example cleaned
    const envContent = await fs.readFile(path.join(projectDir, '.env.example'), 'utf8');
    assert.ok(!envContent.includes('NEXT_PUBLIC_SUPABASE_URL'));
    assert.ok(!envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY'));
    assert.ok(envContent.includes('PORT=3000'));
  });

  test('applyTailwindTransform: removes Tailwind dependencies, config, and unwraps globals.css when disabled', async () => {
    const projectDir = path.join(TEST_DIR, 'test-tailwind-transform');
    await fs.ensureDir(projectDir);
    await fs.writeJson(path.join(projectDir, 'package.json'), {
      name: 'test-tailwind-transform',
      dependencies: {
        'tailwind-merge': '^3.0.0',
        'clsx': '^2.1.0',
      },
      devDependencies: {
        'tailwindcss': '^4.0.0',
        '@tailwindcss/postcss': '^4.0.0',
        'postcss': '^8.5.0',
      },
    });

    await fs.writeFile(path.join(projectDir, 'postcss.config.mjs'), 'export default {}');
    await fs.ensureDir(path.join(projectDir, 'lib'));
    await fs.writeFile(
      path.join(projectDir, 'lib', 'utils.ts'),
      'import { twMerge } from "tailwind-merge";\nexport function cn() {}'
    );
    await fs.ensureDir(path.join(projectDir, 'app'));
    await fs.writeFile(
      path.join(projectDir, 'app', 'globals.css'),
      '@import "tailwindcss";\n\n@layer base {\n  :root {\n    --background: #000;\n  }\n}\n.glass { backdrop-filter: blur(8px); }\n'
    );

    // Apply Tailwind transform with enabled = false
    await applyTailwindTransform(projectDir, false);

    const pkg = await fs.readJson(path.join(projectDir, 'package.json'));
    assert.ok(!pkg.devDependencies['tailwindcss']);
    assert.ok(!pkg.devDependencies['@tailwindcss/postcss']);
    assert.ok(!pkg.devDependencies['postcss']);
    assert.ok(!pkg.dependencies['tailwind-merge']);
    assert.ok(pkg.dependencies['clsx']);

    assert.strictEqual(await fs.pathExists(path.join(projectDir, 'postcss.config.mjs')), false);

    const utilsContent = await fs.readFile(path.join(projectDir, 'lib', 'utils.ts'), 'utf8');
    assert.ok(!utilsContent.includes('tailwind-merge'));
    assert.ok(utilsContent.includes('clsx'));

    const cssContent = await fs.readFile(path.join(projectDir, 'app', 'globals.css'), 'utf8');
    assert.ok(!cssContent.includes('@import "tailwindcss"'));
    assert.ok(!cssContent.includes('@layer base'));
    assert.ok(cssContent.includes('--background: #000;'));
    assert.ok(cssContent.includes('.glass'));
  });

  test('applyAiContextTransform: omits instruction files when disabled', async () => {
    const projectDir = path.join(TEST_DIR, 'test-ai-disabled');
    await fs.ensureDir(projectDir);
    await fs.writeFile(path.join(projectDir, '.cursorrules'), 'old rules');
    await fs.writeFile(path.join(projectDir, 'AGENTS.md'), 'old agents');
    await fs.writeFile(path.join(projectDir, 'llms.txt'), 'old llms');

    await applyAiContextTransform(projectDir, { aiContext: false });

    assert.strictEqual(await fs.pathExists(path.join(projectDir, '.cursorrules')), false);
    assert.strictEqual(await fs.pathExists(path.join(projectDir, 'AGENTS.md')), false);
    assert.strictEqual(await fs.pathExists(path.join(projectDir, 'llms.txt')), false);
  });
});
