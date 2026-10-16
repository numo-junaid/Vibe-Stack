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
import { detectPackageManager } from '../src/core/installer.js';
import { generateProject } from '../src/core/generator.js';
import { validateCliOptions, validateTargetDirectory } from '../src/core/validator.js';

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
  .option('--overwrite', 'Overwrite existing files in target directory if it already exists', false)
  .option('-y, --yes', 'Skip prompts and accept all intelligent defaults', false)
  .action(async (targetDirArg, options) => {
    try {
      await runCLI(targetDirArg, options);
    } catch (err) {
      printError(err.message, err);
      process.exit(1);
    }
  });

/**
 * Main CLI Action Runner
 * Handles argument parsing, interactive user prompts, and UI feedback
 */
async function runCLI(targetDirArg, options) {
  displayBanner();

  let targetDir = targetDirArg;
  let useSupabase = options.supabase;
  let useTailwind = options.tailwind;
  let useAiContext = options.aiContext;
  let packageManager = options.packageManager || detectPackageManager();
  let shouldInstall = options.install;
  let shouldGit = options.git;
  let shouldOverwrite = options.overwrite;

  // 1. Pre-validate CLI options before interactive prompts
  await validateCliOptions(options, ROOT_DIR);

  // 2. Interactive prompt flow when not using --yes
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

    const stylingChoice = await clack.select({
      message: 'Select your Styling framework:',
      options: [
        {
          value: 'tailwind',
          label: 'Tailwind CSS v4 (Modern tokens, @import "tailwindcss")',
          hint: 'Recommended for rapid UI iteration',
        },
        {
          value: 'css',
          label: 'Standard CSS (CSS variables, glassmorphic utilities)',
          hint: 'Zero external styling dependencies',
        },
      ],
      initialValue: useTailwind ? 'tailwind' : 'css',
    });
    if (clack.isCancel(stylingChoice)) {
      clack.cancel('Scaffolding aborted.');
      process.exit(0);
    }
    useTailwind = stylingChoice === 'tailwind';

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

  // 3. Interactive directory collision handling
  const projectPath = path.resolve(process.cwd(), targetDir);
  const dirStatus = await validateTargetDirectory(projectPath, { overwrite: shouldOverwrite });
  if (dirStatus.exists && !dirStatus.isEmpty && !shouldOverwrite) {
    if (!options.yes) {
      const confirmOverwrite = await clack.confirm({
        message: `Directory "${path.basename(projectPath)}" is not empty. Continue and overwrite existing files?`,
        initialValue: false,
      });
      if (clack.isCancel(confirmOverwrite) || !confirmOverwrite) {
        printError(`Target directory "${path.basename(projectPath)}" is not empty. Aborting to protect existing files.`);
        process.exit(1);
      }
      shouldOverwrite = true;
    }
  }

  // 4. Delegate project generation, transformations & validation to src/core/generator.js
  let currentSpinner = null;
  const projectMetadata = await generateProject(
    {
      targetDir,
      template: options.template,
      supabase: useSupabase,
      tailwind: useTailwind,
      aiContext: useAiContext,
      packageManager,
      install: shouldInstall,
      git: shouldGit,
      overwrite: shouldOverwrite,
      rootDir: ROOT_DIR,
    },
    {
      onStepStart: (step, message) => {
        if (currentSpinner) currentSpinner.stop();
        currentSpinner = createSpinner(message).start();
      },
      onStepSuccess: (step, message) => {
        if (currentSpinner) {
          currentSpinner.succeed(message);
          currentSpinner = null;
        }
      },
      onStepFail: (step, message) => {
        if (currentSpinner) {
          currentSpinner.fail(message);
          currentSpinner = null;
        }
      },
      onStepWarn: (step, message) => {
        if (currentSpinner) {
          currentSpinner.warn(message);
          currentSpinner = null;
        }
      },
    }
  );

  // 5. Present Success Summary Output
  displaySuccessSummary({
    projectName: projectMetadata.projectName,
    projectPath: projectMetadata.projectPath,
    packageManager: projectMetadata.packageManager,
    features: [
      { name: 'Next.js 15 (App Router)', desc: 'React 19 & Server Components' },
      {
        name: useTailwind ? 'Tailwind CSS v4' : 'Standard CSS',
        desc: useTailwind ? 'Modern styling tokens & glassmorphism' : 'Clean CSS variables & glassmorphism',
      },
      {
        name: useSupabase ? 'Supabase & Auth' : 'REST Route Handlers',
        desc: useSupabase ? 'Postgres, RLS, @supabase/ssr' : 'Lightweight API structure',
      },
      { name: 'Strict TypeScript', desc: 'Type-safe contracts & schema mappings' },
    ],
    contextFiles: useAiContext
      ? [
          { file: '.cursorrules', role: 'Operational agent loops & strict engineering rules' },
          { file: 'AGENTS.md', role: 'Multi-agent role division (@architect, @frontend, @database, @qa)' },
          { file: 'llms.txt', role: 'Semantic project map for LLM crawlers & external agents' },
        ]
      : [],
  });
}

program.parse(process.argv);
