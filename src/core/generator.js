import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';

import {
  validateCliOptions,
  validateTargetDirectory,
  validateGeneratedProject,
  ValidationError,
  ProjectValidationError,
} from './validator.js';
import {
  applyNamingTransform,
  applySupabaseTransform,
  applyTailwindTransform,
  applyAiContextTransform,
} from './transforms.js';
import {
  installDependencies,
  initGitRepository,
} from './installer.js';

export { ValidationError, ProjectValidationError };

/**
 * Core project generation engine.
 * Coordinates validation, template copying, configuration transformations,
 * architectural health verification, git initialization, and dependency installation.
 * 
 * @param {object} options
 * @param {object} [events] Lifecycle hooks for UI/CLI feedback
 * @returns {Promise<object>} Generated project metadata
 */
export async function generateProject(options = {}, events = {}) {
  const {
    targetDir,
    template = 'base-next',
    supabase = true,
    tailwind = true,
    aiContext = true,
    packageManager = 'npm',
    install = true,
    git = true,
    overwrite = false,
    rootDir,
  } = options;

  if (!targetDir) {
    throw new ValidationError('Project target directory is required.');
  }

  const onStepStart = events.onStepStart || (() => {});
  const onStepSuccess = events.onStepSuccess || (() => {});
  const onStepFail = events.onStepFail || (() => {});
  const onStepWarn = events.onStepWarn || (() => {});

  // 1. Resolve paths
  const projectPath = path.resolve(process.cwd(), targetDir);
  const projectName = path.basename(projectPath);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const baseRootDir = rootDir || path.resolve(__dirname, '../..');
  const templateDir = path.join(baseRootDir, 'templates', template || 'base-next');

  // 2. Pre-flight Option & Directory Validations
  await validateCliOptions({ packageManager, template }, baseRootDir);
  const dirStatus = await validateTargetDirectory(projectPath, { overwrite });
  if (!dirStatus.canProceed) {
    throw new ValidationError(dirStatus.message);
  }

  // 3. Scaffolding Base Template
  onStepStart('scaffold', `Scaffolding project structure from ${template}...`);
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
  onStepSuccess('scaffold', `Base template scaffolded into ${targetDir}`);

  // 4. Apply Configuration Transformations
  onStepStart('configure', 'Configuring project naming and dependencies...');
  await applyNamingTransform(projectPath, projectName);
  await applySupabaseTransform(projectPath, supabase);
  await applyTailwindTransform(projectPath, tailwind);
  onStepSuccess('configure', 'Project configured successfully.');

  // 5. Apply AI Context Transformations
  if (aiContext) {
    onStepStart('context', 'Injecting pre-tuned AI Context Engines...');
    await applyAiContextTransform(projectPath, {
      projectName,
      supabase,
      tailwind,
      aiContext,
      packageManager,
    });
    onStepSuccess('context', 'Context Engines tuned & injected (.cursorrules, AGENTS.md, llms.txt)');
  } else {
    // Ensure any template context remnants are omitted
    await applyAiContextTransform(projectPath, { aiContext: false });
  }

  // 6. Project Architectural Validation (Validated BEFORE git, install, and reporting success)
  onStepStart('validate', 'Validating project architecture and contracts...');
  await validateGeneratedProject(projectPath, {
    projectName,
    supabase,
    tailwind,
    aiContext,
  });
  onStepSuccess('validate', 'Project architecture validated successfully.');

  // 7. Git Initialization
  if (git) {
    onStepStart('git', 'Initializing git repository...');
    const gitSuccess = initGitRepository(projectPath);
    if (gitSuccess) {
      onStepSuccess('git', 'Git repository initialized with initial commit.');
    } else {
      onStepWarn('git', 'Git initialization skipped (git command not found or repo already exists).');
    }
  }

  // 8. Dependency Installation
  if (install) {
    onStepStart('install', `Installing dependencies via ${packageManager}...`);
    try {
      await installDependencies(projectPath, packageManager, true);
      onStepSuccess('install', `Dependencies installed successfully with ${packageManager}.`);
    } catch (err) {
      onStepFail('install', `Dependency installation failed with ${packageManager}: ${err.message}`);
      throw err;
    }
  }

  return {
    projectName,
    projectPath,
    packageManager,
    features: {
      supabase,
      tailwind,
      aiContext,
      git,
      install,
    },
  };
}
