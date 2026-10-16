#!/usr/bin/env node

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { Command } from 'commander';
import * as clack from '@clack/prompts';
import chalk from 'chalk';

import {
  displayBanner,
  createSpinner,
  displaySuccessSummary,
  theme,
  printError,
} from '../src/utils/ui-terminal.js';
import {
  detectPackageManager,
  installDependencies,
  initGitRepository,
} from '../src/core/installer.js';
import { injectContext } from '../src/core/dynamic-injector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const pkgJson = await fs.readJson(path.join(ROOT_DIR, 'package.json'));

const program = new Command();

program
  .name('create-vibe-app')
  .description('Scaffold production-ready, AI-optimized codebases with pre-tuned context configurations.')
  .version(pkgJson.version, '-v, --version', 'Display the current version')
  .argument('[project-directory]', 'Target directory for the new project')
  .option('-t, --template <name>', 'Template to scaffold (default: base-next)', 'base-next')
  .option('--supabase', 'Include Supabase backend & auth context', true)
  .option('--no-supabase', 'Exclude Supabase backend & auth context')
  .option('--tailwind', 'Include Tailwind CSS v4 styling', true)
  .option('--no-tailwind', 'Exclude Tailwind CSS v4 styling')
  .option('--ai-context', 'Generate tuned context files (.cursorrules, AGENTS.md, llms.txt)', true)
  .option('--no-ai-context', 'Skip generating AI context files')
  .option('-p, --package-manager <pm>', 'Specify package manager (npm, pnpm, yarn, bun)')
  .option('--install', 'Install dependencies automatically', true)
  .option('--no-install', 'Do not install dependencies')
  .option('--git', 'Initialize a new git repository', true)
  .option('--no-git', 'Do not initialize a git repository')
  .option('-y, --yes', 'Skip prompts and accept all intelligent defaults', false)
  .action(async (targetDirArg, options) => {
    try {
      await runCLI(targetDirArg, options);
    } catch (err) {
      printError(err.message, err);
      process.exit(1);
    }
  });

async function runCLI(targetDirArg, options) {
  displayBanner();

  let targetDir = targetDirArg;
  let useSupabase = options.supabase;
  let useTailwind = options.tailwind;
  let useAiContext = options.aiContext;
  let packageManager = options.packageManager || detectPackageManager();
  let shouldInstall = options.install;
  let shouldGit = options.git;

  // Interactive flow when not run with --yes flag or if targetDir is omitted
  if (!options.yes && (!targetDir || !options.packageManager)) {
    clack.intro(theme.highlight('⚡ Initiate Vibe-Stack Scaffolding Engine'));

    if (!targetDir) {
      targetDir = await clack.text({
        message: 'Where should we build your project?',
        placeholder: './my-vibe-app',
        defaultValue: 'my-vibe-app',
        validate(value) {
          if (!value.trim()) return 'Project directory name cannot be empty.';
        },
      });
      if (clack.isCancel(targetDir)) {
        clack.cancel('Scaffolding aborted.');
        process.exit(0);
      }
    }

    const dbChoice = await clack.select({
      message: 'Select your Backend & Database architecture:',
      options: [
        {
          value: 'supabase',
          label: 'Supabase (PostgreSQL + Auth + RLS + @supabase/ssr)',
          hint: 'Recommended for agentic apps',
        },
        {
          value: 'none',
          label: 'None / REST API Routes only',
          hint: 'Lightweight client-only architecture',
        },
      ],
      initialValue: useSupabase ? 'supabase' : 'none',
    });
    if (clack.isCancel(dbChoice)) {
      clack.cancel('Scaffolding aborted.');
      process.exit(0);
    }
    useSupabase = dbChoice === 'supabase';

    const contextChoice = await clack.multiselect({
      message: 'Select AI Context Engines to tune and inject:',
      options: [
        {
          value: 'cursorrules',
          label: '.cursorrules',
          hint: 'High-density operational rules for Cursor / Windsurf',
        },
        {
          value: 'agents',
          label: 'AGENTS.md',
          hint: 'Multi-agent role division and boundaries',
        },
        {
          value: 'llms',
          label: 'llms.txt',
          hint: 'Semantic specification for external LLM models',
        },
      ],
      initialValues: ['cursorrules', 'agents', 'llms'],
      required: true,
    });
    if (clack.isCancel(contextChoice)) {
      clack.cancel('Scaffolding aborted.');
      process.exit(0);
    }
    useAiContext = contextChoice.length > 0;

    packageManager = await clack.select({
      message: 'Select your preferred package manager:',
      options: [
        { value: 'npm', label: 'npm' },
        { value: 'pnpm', label: 'pnpm' },
        { value: 'bun', label: 'bun' },
        { value: 'yarn', label: 'yarn' },
      ],
      initialValue: packageManager,
    });
    if (clack.isCancel(packageManager)) {
      clack.cancel('Scaffolding aborted.');
      process.exit(0);
    }

    shouldInstall = await clack.confirm({
      message: `Install dependencies immediately using ${packageManager}?`,
      initialValue: true,
    });
    if (clack.isCancel(shouldInstall)) {
      clack.cancel('Scaffolding aborted.');
      process.exit(0);
    }

    shouldGit = await clack.confirm({
      message: 'Initialize a new git repository?',
      initialValue: true,
    });
    if (clack.isCancel(shouldGit)) {
      clack.cancel('Scaffolding aborted.');
      process.exit(0);
    }
  }

  // Resolve target directory path
  const projectPath = path.resolve(process.cwd(), targetDir);
  const projectName = path.basename(projectPath);

  // Check destination directory
  if (await fs.pathExists(projectPath)) {
    const files = await fs.readdir(projectPath);
    if (files.length > 0) {
      if (!options.yes) {
        const overwrite = await clack.confirm({
          message: `Directory "${projectName}" is not empty. Continue and overwrite existing files?`,
          initialValue: false,
        });
        if (clack.isCancel(overwrite) || !overwrite) {
          clack.cancel('Scaffolding aborted to protect existing files.');
          process.exit(0);
        }
      }
    }
  }

  // 1. Copy base template
  const spinner = createSpinner('Scaffolding project structure from base-next...').start();
  const templateDir = path.join(ROOT_DIR, 'templates', options.template || 'base-next');

  if (!(await fs.pathExists(templateDir))) {
    spinner.fail(`Template "${options.template}" not found.`);
    process.exit(1);
  }

  await fs.ensureDir(projectPath);
  await fs.copy(templateDir, projectPath, {
    filter: (src) => {
      const rel = path.relative(templateDir, src);
      return !rel.includes('node_modules') && !rel.includes('.next');
    },
  });

  // Ensure .gitignore is properly named
  const gitignoreAlt = path.join(projectPath, '_gitignore');
  const gitignoreTarget = path.join(projectPath, '.gitignore');
  if (await fs.pathExists(gitignoreAlt)) {
    await fs.move(gitignoreAlt, gitignoreTarget, { overwrite: true });
  }

  spinner.succeed(`Base template scaffolded into ${chalk.cyan(targetDir)}`);

  // 2. Dynamic Context Injection
  if (useAiContext) {
    const contextSpinner = createSpinner('Injecting pre-tuned AI Context Engines...').start();
    await injectContext(projectPath, {
      projectName,
      supabase: useSupabase,
      tailwind: useTailwind,
      packageManager,
    });
    contextSpinner.succeed('Context Engines tuned & injected (.cursorrules, AGENTS.md, llms.txt)');
  }

  // 3. Git Initialization
  if (shouldGit) {
    const gitSpinner = createSpinner('Initializing git repository...').start();
    const gitSuccess = initGitRepository(projectPath);
    if (gitSuccess) {
      gitSpinner.succeed('Git repository initialized with initial commit.');
    } else {
      gitSpinner.warn('Git initialization skipped (git command not found or repo already exists).');
    }
  }

  // 4. Install Dependencies
  if (shouldInstall) {
    const installSpinner = createSpinner(`Installing dependencies via ${packageManager}...`).start();
    try {
      await installDependencies(projectPath, packageManager, true);
      installSpinner.succeed(`Dependencies installed successfully with ${packageManager}.`);
    } catch (err) {
      installSpinner.warn(`Automatic dependency installation failed: ${err.message}. You can run "${packageManager} install" manually.`);
    }
  }

  // 5. Success Summary Box
  displaySuccessSummary({
    projectName,
    projectPath,
    packageManager,
    features: [
      { name: 'Next.js 16 (App Router)', desc: 'React 19 & Server Components' },
      { name: 'Tailwind CSS v4', desc: 'Modern styling tokens & glassmorphism' },
      {
        name: useSupabase ? 'Supabase & Auth' : 'REST Route Handlers',
        desc: useSupabase ? 'Postgres, RLS, @supabase/ssr' : 'Lightweight API structure',
      },
      { name: 'Strict TypeScript', desc: 'Type-safe contracts & schema mappings' },
    ],
    contextFiles: [
      { file: '.cursorrules', role: 'Operational agent loops & strict engineering rules' },
      { file: 'AGENTS.md', role: 'Multi-agent role division (@architect, @frontend, @database, @qa)' },
      { file: 'llms.txt', role: 'Semantic project map for LLM crawlers & external agents' },
    ],
  });
}

program.parse(process.argv);
