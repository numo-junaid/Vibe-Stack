import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import {
  buildCursorRules,
  buildLlmsTxt,
  buildAgentsMd,
} from './dynamic-injector.js';

/**
 * Applies project naming transformation to package.json
 * @param {string} projectPath 
 * @param {string} projectName 
 */
export async function applyNamingTransform(projectPath, projectName) {
  const pkgPath = path.join(projectPath, 'package.json');
  if (await fs.pathExists(pkgPath)) {
    const pkg = await fs.readJson(pkgPath);
    pkg.name = projectName;
    await fs.writeJson(pkgPath, pkg, { spaces: 2 });
  }
}

/**
 * Applies Supabase configuration transformation
 * @param {string} projectPath 
 * @param {boolean} enabled 
 */
export async function applySupabaseTransform(projectPath, enabled = true) {
  if (enabled) {
    return; // Retain default Supabase scaffolding
  }

  // 1. Remove Supabase dependencies from package.json
  const pkgPath = path.join(projectPath, 'package.json');
  if (await fs.pathExists(pkgPath)) {
    const pkg = await fs.readJson(pkgPath);
    if (pkg.dependencies) {
      delete pkg.dependencies['@supabase/supabase-js'];
      delete pkg.dependencies['@supabase/ssr'];
    }
    await fs.writeJson(pkgPath, pkg, { spaces: 2 });
  }

  // 2. Remove Supabase helper files and types
  const supabaseLibDir = path.join(projectPath, 'lib', 'supabase');
  if (await fs.pathExists(supabaseLibDir)) {
    await fs.remove(supabaseLibDir);
  }

  const typesDbFile = path.join(projectPath, 'types', 'database.ts');
  if (await fs.pathExists(typesDbFile)) {
    await fs.remove(typesDbFile);
  }

  // 3. Remove root middleware.ts (only needed when Supabase session interception is active)
  const middlewareFile = path.join(projectPath, 'middleware.ts');
  if (await fs.pathExists(middlewareFile)) {
    await fs.remove(middlewareFile);
  }

  // 4. Strip Supabase credentials from .env.example
  const envExamplePath = path.join(projectPath, '.env.example');
  if (await fs.pathExists(envExamplePath)) {
    let envContent = await fs.readFile(envExamplePath, 'utf8');
    envContent = envContent
      .replace(/NEXT_PUBLIC_SUPABASE_URL=.*\r?\n/g, '')
      .replace(/NEXT_PUBLIC_SUPABASE_ANON_KEY=.*\r?\n/g, '');
    await fs.writeFile(envExamplePath, envContent, 'utf8');
  }
}

/**
 * Applies Tailwind CSS configuration transformation
 * @param {string} projectPath 
 * @param {boolean} enabled 
 */
export async function applyTailwindTransform(projectPath, enabled = true) {
  if (enabled) {
    return; // Retain default Tailwind v4 scaffolding
  }

  // 1. Remove Tailwind dependencies from package.json
  const pkgPath = path.join(projectPath, 'package.json');
  if (await fs.pathExists(pkgPath)) {
    const pkg = await fs.readJson(pkgPath);
    if (pkg.devDependencies) {
      delete pkg.devDependencies['@tailwindcss/postcss'];
      delete pkg.devDependencies['tailwindcss'];
      delete pkg.devDependencies['postcss'];
    }
    if (pkg.dependencies) {
      delete pkg.dependencies['tailwind-merge'];
    }
    await fs.writeJson(pkgPath, pkg, { spaces: 2 });
  }

  // 2. Remove postcss.config.mjs
  const postcssConfig = path.join(projectPath, 'postcss.config.mjs');
  if (await fs.pathExists(postcssConfig)) {
    await fs.remove(postcssConfig);
  }

  // 3. Update lib/utils.ts to pure clsx without twMerge
  const utilsPath = path.join(projectPath, 'lib', 'utils.ts');
  if (await fs.pathExists(utilsPath)) {
    const cleanUtilsContent = `import { clsx, type ClassValue } from 'clsx';

/**
 * Combines conditional CSS class names
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
`;
    await fs.writeFile(utilsPath, cleanUtilsContent, 'utf8');
  }

  // 4. Update app/globals.css: strip @import "tailwindcss" and unwrap @layer base
  const globalsCssPath = path.join(projectPath, 'app', 'globals.css');
  if (await fs.pathExists(globalsCssPath)) {
    let cssContent = await fs.readFile(globalsCssPath, 'utf8');
    cssContent = cssContent.replace(/@import\s+['"]tailwindcss['"];?\r?\n*/g, '');
    cssContent = cssContent.replace(/@layer\s+base\s*\{([\s\S]*?)\n\}\s*\n/g, '$1\n');
    await fs.writeFile(globalsCssPath, cssContent.trimStart(), 'utf8');
  }
}

/**
 * Applies AI context files transformation
 * @param {string} projectPath 
 * @param {object} config 
 */
export async function applyAiContextTransform(projectPath, config = {}) {
  const enabled = config.aiContext !== false;
  const projectName = config.projectName || path.basename(projectPath);

  if (!enabled) {
    // If AI context is disabled, ensure instruction files do not exist
    const filesToRemove = ['.cursorrules', 'AGENTS.md', 'llms.txt'];
    for (const file of filesToRemove) {
      const filePath = path.join(projectPath, file);
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
      }
    }
    return;
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const templateAiDir = path.resolve(__dirname, '../../templates/ai-config');

  // 1. .cursorrules
  const cursorRulesPath = path.join(templateAiDir, '.cursorrules');
  if (await fs.pathExists(cursorRulesPath)) {
    let cursorRulesContent = await fs.readFile(cursorRulesPath, 'utf8');
    const { stackTags, uiRules, databaseRules } = buildCursorRules(config);

    cursorRulesContent = cursorRulesContent
      .replace(/\{\{PROJECT_NAME\}\}/g, projectName)
      .replace(/\{\{CURSORRULES_STACK_TAGS\}\}/g, stackTags)
      .replace(/\{\{CURSORRULES_UI_INJECTION\}\}/g, uiRules)
      .replace(/\{\{CURSORRULES_DATABASE_INJECTION\}\}/g, databaseRules);

    await fs.writeFile(path.join(projectPath, '.cursorrules'), cursorRulesContent, 'utf8');
  }

  // 2. llms.txt
  const llmsPath = path.join(templateAiDir, 'llms.txt');
  if (await fs.pathExists(llmsPath)) {
    let llmsContent = await fs.readFile(llmsPath, 'utf8');
    const {
      stylingOverview,
      cssRole,
      stylingConvention,
      databaseOverview,
      libFiles,
      databaseSchema,
    } = buildLlmsTxt(config);

    llmsContent = llmsContent
      .replace(/\{\{PROJECT_NAME\}\}/g, projectName)
      .replace(/\{\{LLMS_STYLING_OVERVIEW\}\}/g, stylingOverview)
      .replace(/\{\{LLMS_CSS_ROLE\}\}/g, cssRole)
      .replace(/\{\{LLMS_STYLING_CONVENTION\}\}/g, stylingConvention)
      .replace(/\{\{LLMS_DATABASE_OVERVIEW\}\}/g, databaseOverview)
      .replace(/\{\{LLMS_LIB_FILES\}\}/g, libFiles)
      .replace(/\{\{LLMS_DATABASE_SCHEMA\}\}/g, databaseSchema);

    await fs.writeFile(path.join(projectPath, 'llms.txt'), llmsContent, 'utf8');
  }

  // 3. AGENTS.md
  const agentsPath = path.join(templateAiDir, 'AGENTS.md');
  if (await fs.pathExists(agentsPath)) {
    let agentsContent = await fs.readFile(agentsPath, 'utf8');
    const { frontendRole, databaseRole, delegationRole } = buildAgentsMd(config);

    agentsContent = agentsContent
      .replace(/\{\{PROJECT_NAME\}\}/g, projectName)
      .replace(/\{\{AGENTS_FRONTEND_ROLE\}\}/g, frontendRole)
      .replace(/\{\{AGENTS_DATABASE_ROLE\}\}/g, databaseRole)
      .replace(/\{\{AGENTS_DELEGATION_ROLE\}\}/g, delegationRole);

    await fs.writeFile(path.join(projectPath, 'AGENTS.md'), agentsContent, 'utf8');
  }
}
