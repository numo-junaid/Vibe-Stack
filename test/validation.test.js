import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';

import {
  validateCliOptions,
  validateTargetDirectory,
  validateGeneratedProject,
  ValidationError,
  ProjectValidationError,
} from '../src/core/validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const TEST_DIR = path.join(ROOT_DIR, 'test-scratch-val');

describe('Validation Module Unit Tests (src/core/validator.js)', () => {
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

  describe('validateCliOptions()', () => {
    test('accepts supported package managers (npm, pnpm, yarn, bun)', async () => {
      for (const pm of ['npm', 'pnpm', 'yarn', 'bun']) {
        const res = await validateCliOptions({ packageManager: pm }, ROOT_DIR);
        assert.strictEqual(res, true);
      }
    });

    test('rejects unsupported package manager with ValidationError', async () => {
      await assert.rejects(
        async () => {
          await validateCliOptions({ packageManager: 'invalid-pm' }, ROOT_DIR);
        },
        (err) => {
          assert.ok(err instanceof ValidationError);
          assert.ok(err.message.includes('Invalid package manager "invalid-pm"'));
          return true;
        }
      );
    });

    test('accepts valid template directory', async () => {
      const res = await validateCliOptions({ template: 'base-next' }, ROOT_DIR);
      assert.strictEqual(res, true);
    });

    test('rejects non-existent template with ValidationError', async () => {
      await assert.rejects(
        async () => {
          await validateCliOptions({ template: 'non-existent-template' }, ROOT_DIR);
        },
        (err) => {
          assert.ok(err instanceof ValidationError);
          assert.ok(err.message.includes('Template "non-existent-template" not found'));
          return true;
        }
      );
    });
  });

  describe('validateTargetDirectory()', () => {
    test('returns canProceed: true when directory does not exist', async () => {
      const dirPath = path.join(TEST_DIR, 'does-not-exist');
      const status = await validateTargetDirectory(dirPath);
      assert.strictEqual(status.exists, false);
      assert.strictEqual(status.isEmpty, true);
      assert.strictEqual(status.canProceed, true);
    });

    test('returns canProceed: true when directory exists but is empty', async () => {
      const emptyDir = path.join(TEST_DIR, 'empty-dir');
      await fs.ensureDir(emptyDir);
      const status = await validateTargetDirectory(emptyDir);
      assert.strictEqual(status.exists, true);
      assert.strictEqual(status.isEmpty, true);
      assert.strictEqual(status.canProceed, true);
    });

    test('returns canProceed: false when directory exists and is not empty without overwrite', async () => {
      const nonEmptyDir = path.join(TEST_DIR, 'non-empty-dir');
      await fs.ensureDir(nonEmptyDir);
      await fs.writeFile(path.join(nonEmptyDir, 'file.txt'), 'hello');

      const status = await validateTargetDirectory(nonEmptyDir, { overwrite: false });
      assert.strictEqual(status.exists, true);
      assert.strictEqual(status.isEmpty, false);
      assert.strictEqual(status.canProceed, false);
      assert.ok(status.message.includes('already exists and is not empty'));
    });

    test('returns canProceed: true when directory exists and is not empty WITH overwrite: true', async () => {
      const overwriteDir = path.join(TEST_DIR, 'overwrite-dir');
      await fs.ensureDir(overwriteDir);
      await fs.writeFile(path.join(overwriteDir, 'file.txt'), 'hello');

      const status = await validateTargetDirectory(overwriteDir, { overwrite: true });
      assert.strictEqual(status.exists, true);
      assert.strictEqual(status.isEmpty, false);
      assert.strictEqual(status.canProceed, true);
      assert.strictEqual(status.willOverwrite, true);
    });
  });

  describe('validateGeneratedProject()', () => {
    test('throws ProjectValidationError when package.json is missing', async () => {
      const missingPkgDir = path.join(TEST_DIR, 'missing-pkg');
      await fs.ensureDir(missingPkgDir);

      await assert.rejects(
        async () => {
          await validateGeneratedProject(missingPkgDir, { projectName: 'missing-pkg' });
        },
        (err) => {
          assert.ok(err instanceof ProjectValidationError);
          assert.ok(err.message.includes('missing package.json'));
          return true;
        }
      );
    });

    test('throws ProjectValidationError when package.json name does not match requested name', async () => {
      const mismatchedDir = path.join(TEST_DIR, 'mismatched-name');
      await fs.ensureDir(mismatchedDir);
      await fs.writeJson(path.join(mismatchedDir, 'package.json'), {
        name: 'old-name',
        scripts: { dev: 'next dev', build: 'next build' },
      });

      await assert.rejects(
        async () => {
          await validateGeneratedProject(mismatchedDir, { projectName: 'expected-name' });
        },
        (err) => {
          assert.ok(err instanceof ProjectValidationError);
          assert.ok(err.message.includes('does not match requested project name'));
          return true;
        }
      );
    });

    test('detects residual Supabase files when Supabase is disabled', async () => {
      const residualDir = path.join(TEST_DIR, 'residual-supabase');
      await fs.ensureDir(residualDir);
      await fs.writeJson(path.join(residualDir, 'package.json'), {
        name: 'residual-supabase',
        scripts: { dev: 'next dev', build: 'next build' },
        dependencies: { '@supabase/supabase-js': '2.0.0' },
      });
      await fs.ensureDir(path.join(residualDir, 'lib', 'supabase'));

      await assert.rejects(
        async () => {
          await validateGeneratedProject(residualDir, {
            projectName: 'residual-supabase',
            supabase: false,
            tailwind: false,
            aiContext: false,
          });
        },
        (err) => {
          assert.ok(err instanceof ProjectValidationError);
          assert.ok(err.message.includes('Supabase dependency "@supabase/supabase-js" found but Supabase is disabled'));
          return true;
        }
      );
    });
  });
});
