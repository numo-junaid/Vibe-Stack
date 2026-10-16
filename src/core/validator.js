import path from 'path';
import fs from 'fs-extra';

/**
 * Custom error thrown when option or directory validation fails
 */
export class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

/**
 * Custom error thrown when the post-generation project validation detects an anomaly
 */
export class ProjectValidationError extends ValidationError {
  constructor(message, details = []) {
    super(message, details);
    this.name = 'ProjectValidationError';
  }
}

export const VALID_PACKAGE_MANAGERS = ['npm', 'pnpm', 'yarn', 'bun'];

/**
 * Validates CLI input options
 * @param {object} options 
 * @param {string} rootDir 
 */
export async function validateCliOptions(options = {}, rootDir) {
  const errors = [];

  if (options.packageManager && !VALID_PACKAGE_MANAGERS.includes(options.packageManager)) {
    errors.push(
      `Invalid package manager "${options.packageManager}". Supported package managers are: ${VALID_PACKAGE_MANAGERS.join(', ')}`
    );
  }

  if (options.template && rootDir) {
    const templatePath = path.join(rootDir, 'templates', options.template);
    if (!(await fs.pathExists(templatePath))) {
      errors.push(`Template "${options.template}" not found.`);
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors[0], errors);
  }

  return true;
}

/**
 * Validates destination directory status
 * @param {string} projectPath 
 * @param {object} options 
 */
export async function validateTargetDirectory(projectPath, options = {}) {
  const exists = await fs.pathExists(projectPath);
  if (!exists) {
    return { exists: false, isEmpty: true, canProceed: true };
  }

  const files = await fs.readdir(projectPath);
  const isEmpty = files.length === 0;

  if (isEmpty) {
    return { exists: true, isEmpty: true, canProceed: true };
  }

  // Directory exists and has files
  if (options.overwrite) {
    return { exists: true, isEmpty: false, canProceed: true, willOverwrite: true };
  }

  const projectName = path.basename(projectPath);
  return {
    exists: true,
    isEmpty: false,
    canProceed: false,
    message: `Target directory "${projectName}" already exists and is not empty. Use --overwrite to overwrite existing files.`,
  };
}

/**
 * Thoroughly validates the final generated project before reporting success
 * @param {string} projectPath 
 * @param {object} config 
 */
export async function validateGeneratedProject(projectPath, config = {}) {
  const errors = [];
  const projectName = config.projectName || path.basename(projectPath);
  const supabase = config.supabase !== false;
  const tailwind = config.tailwind !== false;
  const aiContext = config.aiContext !== false;

  // 1. Validate package.json
  const pkgPath = path.join(projectPath, 'package.json');
  if (!(await fs.pathExists(pkgPath))) {
    errors.push('Generated project is missing package.json');
  } else {
    try {
      const pkg = await fs.readJson(pkgPath);
      if (pkg.name !== projectName) {
        errors.push(`package.json name "${pkg.name}" does not match requested project name "${projectName}"`);
      }
      if (!pkg.scripts || !pkg.scripts.dev || !pkg.scripts.build) {
        errors.push('package.json is missing required scripts ("dev" and "build")');
      }

      // Check Supabase dependencies
      if (supabase) {
        if (!pkg.dependencies || !pkg.dependencies['@supabase/supabase-js']) {
          errors.push('Missing required dependency "@supabase/supabase-js"');
        }
        if (!pkg.dependencies || !pkg.dependencies['@supabase/ssr']) {
          errors.push('Missing required dependency "@supabase/ssr"');
        }
      } else {
        if (pkg.dependencies && pkg.dependencies['@supabase/supabase-js']) {
          errors.push('Supabase dependency "@supabase/supabase-js" found but Supabase is disabled');
        }
        if (pkg.dependencies && pkg.dependencies['@supabase/ssr']) {
          errors.push('Supabase dependency "@supabase/ssr" found but Supabase is disabled');
        }
      }

      // Check Tailwind dependencies
      if (tailwind) {
        if (!pkg.devDependencies || !pkg.devDependencies['tailwindcss']) {
          errors.push('Missing required devDependency "tailwindcss"');
        }
        if (!pkg.devDependencies || !pkg.devDependencies['@tailwindcss/postcss']) {
          errors.push('Missing required devDependency "@tailwindcss/postcss"');
        }
        if (!pkg.dependencies || !pkg.dependencies['tailwind-merge']) {
          errors.push('Missing required dependency "tailwind-merge"');
        }
      } else {
        if (pkg.devDependencies && pkg.devDependencies['tailwindcss']) {
          errors.push('Tailwind dependency "tailwindcss" found but Tailwind is disabled');
        }
        if (pkg.devDependencies && pkg.devDependencies['@tailwindcss/postcss']) {
          errors.push('Tailwind dependency "@tailwindcss/postcss" found but Tailwind is disabled');
        }
        if (pkg.dependencies && pkg.dependencies['tailwind-merge']) {
          errors.push('Tailwind dependency "tailwind-merge" found but Tailwind is disabled');
        }
      }
    } catch (err) {
      errors.push(`package.json is not valid JSON: ${err.message}`);
    }
  }

  // 2. Validate core Next.js structural files
  const coreFiles = [
    'tsconfig.json',
    'next.config.mjs',
    path.join('app', 'layout.tsx'),
    path.join('app', 'page.tsx'),
    path.join('app', 'api', 'health', 'route.ts'),
    path.join('components', 'Hero.tsx'),
    path.join('lib', 'utils.ts'),
  ];

  for (const file of coreFiles) {
    if (!(await fs.pathExists(path.join(projectPath, file)))) {
      errors.push(`Missing core application file: ${file}`);
    }
  }

  // 3. Validate Supabase-specific files & configurations
  if (supabase) {
    const supabaseFiles = [
      path.join('lib', 'supabase', 'client.ts'),
      path.join('lib', 'supabase', 'server.ts'),
      path.join('lib', 'supabase', 'middleware.ts'),
      path.join('types', 'database.ts'),
      'middleware.ts',
    ];
    for (const file of supabaseFiles) {
      if (!(await fs.pathExists(path.join(projectPath, file)))) {
        errors.push(`Missing required Supabase file: ${file}`);
      }
    }

    const envPath = path.join(projectPath, '.env.example');
    if (await fs.pathExists(envPath)) {
      const envContent = await fs.readFile(envPath, 'utf8');
      if (!envContent.includes('NEXT_PUBLIC_SUPABASE_URL')) {
        errors.push('.env.example is missing NEXT_PUBLIC_SUPABASE_URL');
      }
    }
  } else {
    if (await fs.pathExists(path.join(projectPath, 'lib', 'supabase'))) {
      errors.push('Found directory "lib/supabase" when Supabase is disabled');
    }
    if (await fs.pathExists(path.join(projectPath, 'types', 'database.ts'))) {
      errors.push('Found "types/database.ts" when Supabase is disabled');
    }
    if (await fs.pathExists(path.join(projectPath, 'middleware.ts'))) {
      errors.push('Found "middleware.ts" when Supabase is disabled');
    }
  }

  // 4. Validate Tailwind-specific files & configurations
  if (tailwind) {
    if (!(await fs.pathExists(path.join(projectPath, 'postcss.config.mjs')))) {
      errors.push('Missing "postcss.config.mjs" when Tailwind is enabled');
    }
    const globalsCssPath = path.join(projectPath, 'app', 'globals.css');
    if (await fs.pathExists(globalsCssPath)) {
      const globalsCss = await fs.readFile(globalsCssPath, 'utf8');
      if (!globalsCss.includes('@import "tailwindcss"')) {
        errors.push('app/globals.css is missing @import "tailwindcss"');
      }
    }
  } else {
    if (await fs.pathExists(path.join(projectPath, 'postcss.config.mjs'))) {
      errors.push('Found "postcss.config.mjs" when Tailwind is disabled');
    }
    const globalsCssPath = path.join(projectPath, 'app', 'globals.css');
    if (await fs.pathExists(globalsCssPath)) {
      const globalsCss = await fs.readFile(globalsCssPath, 'utf8');
      if (globalsCss.includes('@import "tailwindcss"')) {
        errors.push('app/globals.css still contains @import "tailwindcss" when Tailwind is disabled');
      }
    }
    const utilsPath = path.join(projectPath, 'lib', 'utils.ts');
    if (await fs.pathExists(utilsPath)) {
      const utilsContent = await fs.readFile(utilsPath, 'utf8');
      if (utilsContent.includes('tailwind-merge')) {
        errors.push('lib/utils.ts still imports tailwind-merge when Tailwind is disabled');
      }
    }
  }

  // 5. Validate AI Context files
  const aiFiles = ['.cursorrules', 'AGENTS.md', 'llms.txt'];
  if (aiContext) {
    for (const file of aiFiles) {
      const filePath = path.join(projectPath, file);
      if (!(await fs.pathExists(filePath))) {
        errors.push(`Missing AI context file: ${file}`);
      } else {
        const content = await fs.readFile(filePath, 'utf8');
        if (!content.trim()) {
          errors.push(`AI context file ${file} is empty`);
        }
        if (!content.includes(projectName)) {
          errors.push(`AI context file ${file} does not contain project name "${projectName}"`);
        }
      }
    }
  } else {
    for (const file of aiFiles) {
      if (await fs.pathExists(path.join(projectPath, file))) {
        errors.push(`Found AI context file "${file}" when AI context is disabled`);
      }
    }
  }

  if (errors.length > 0) {
    throw new ProjectValidationError(
      `Generated project failed architectural validation:\n- ${errors.join('\n- ')}`,
      errors
    );
  }

  return { valid: true, errors: [] };
}
