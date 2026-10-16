import spawn from 'cross-spawn';
import { execSync } from 'child_process';
import path from 'path';

/**
 * Detects the user's preferred or currently active package manager
 * @returns {'pnpm' | 'bun' | 'yarn' | 'npm'}
 */
export function detectPackageManager() {
  const userAgent = process.env.npm_config_user_agent;
  if (userAgent) {
    if (userAgent.startsWith('pnpm')) return 'pnpm';
    if (userAgent.startsWith('bun')) return 'bun';
    if (userAgent.startsWith('yarn')) return 'yarn';
    if (userAgent.startsWith('npm')) return 'npm';
  }

  // Fallback checks for global CLI availability
  try {
    execSync('pnpm --version', { stdio: 'ignore' });
    return 'pnpm';
  } catch {}

  try {
    execSync('bun --version', { stdio: 'ignore' });
    return 'bun';
  } catch {}

  try {
    execSync('yarn --version', { stdio: 'ignore' });
    return 'yarn';
  } catch {}

  return 'npm';
}

/**
 * Maps package manager names to CLI commands
 * @param {'pnpm' | 'bun' | 'yarn' | 'npm'} pm 
 */
export function getPackageManagerCommands(pm) {
  switch (pm) {
    case 'pnpm':
      return {
        install: ['install'],
        dev: 'pnpm dev',
        build: 'pnpm build',
        add: (pkg) => ['add', pkg],
      };
    case 'bun':
      return {
        install: ['install'],
        dev: 'bun dev',
        build: 'bun build',
        add: (pkg) => ['add', pkg],
      };
    case 'yarn':
      return {
        install: ['install'],
        dev: 'yarn dev',
        build: 'yarn build',
        add: (pkg) => ['add', pkg],
      };
    case 'npm':
    default:
      return {
        install: ['install'],
        dev: 'npm run dev',
        build: 'npm run build',
        add: (pkg) => ['install', pkg],
      };
  }
}

/**
 * Executes dependency installation inside target project path
 * @param {string} projectPath 
 * @param {'pnpm' | 'bun' | 'yarn' | 'npm'} pm 
 * @param {boolean} silent 
 * @returns {Promise<boolean>}
 */
export function installDependencies(projectPath, pm = 'npm', silent = true) {
  return new Promise((resolve, reject) => {
    const commands = getPackageManagerCommands(pm);
    const child = spawn(pm, commands.install, {
      cwd: projectPath,
      stdio: silent ? 'ignore' : 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`${pm} install exited with code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Initializes a new git repository in the project path and creates an initial commit
 * @param {string} projectPath 
 * @returns {boolean}
 */
export function initGitRepository(projectPath) {
  try {
    // Try git init -b main first, fallback to standard git init
    try {
      execSync('git init -b main', { cwd: projectPath, stdio: 'ignore' });
    } catch {
      execSync('git init', { cwd: projectPath, stdio: 'ignore' });
      try {
        execSync('git branch -M main', { cwd: projectPath, stdio: 'ignore' });
      } catch {}
    }

    execSync('git add -A', { cwd: projectPath, stdio: 'ignore' });
    execSync('git commit -m "chore: initial commit from create-vibe-app (Vibe-Stack)"', {
      cwd: projectPath,
      stdio: 'ignore',
    });
    return true;
  } catch (error) {
    return false;
  }
}
