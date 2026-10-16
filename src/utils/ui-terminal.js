import chalk from 'chalk';
import gradient from 'gradient-string';
import boxen from 'boxen';
import ora from 'ora';

// Custom modern gradients
export const vibeGradient = gradient([
  '#00F5FF',
  '#7B2CBF',
  '#FF007F',
  '#9D4EDD',
  '#00F5D4'
]);

export const neonGradient = gradient([
  '#38bdf8',
  '#818cf8',
  '#c084fc',
  '#f472b6'
]);

export const theme = {
  primary: chalk.hex('#7B2CBF'),
  accent: chalk.hex('#00F5FF'),
  highlight: chalk.hex('#FF007F').bold,
  success: chalk.hex('#10B981').bold,
  warn: chalk.hex('#F59E0B').bold,
  error: chalk.hex('#EF4444').bold,
  dim: chalk.hex('#64748B'),
  code: chalk.hex('#38BDF8').italic,
  bold: chalk.bold,
};

/**
 * Renders the high-impact ASCII banner with glowing gradients and sub-badges
 */
export function displayBanner() {
  const ascii = `
  ██╗   ██╗██╗██████╗ ███████╗   ███████╗████████╗ █████╗  ██████╗██╗  ██╗
  ██║   ██║██║██╔══██╗██╔════╝   ██╔════╝╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝
  ██║   ██║██║██████╔╝█████╗     ███████╗   ██║   ███████║██║     █████╔╝ 
  ╚██╗ ██╔╝██║██╔══██╗██╔══╝     ╚════██║   ██║   ██╔══██║██║     ██╔═██╗ 
   ╚████╔╝ ██║██████╔╝███████╗   ███████║   ██║   ██║  ██║╚██████╗██║  ██╗
    ╚═══╝  ╚═╝╚═════╝ ╚══════╝   ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
  `;

  console.log(vibeGradient(ascii));
  console.log(
    boxen(
      `${theme.highlight('⚡ VIBE-STACK CLI')} ${theme.dim('•')} ${chalk.white('AI-Optimized Architecture Scaffolder')}\n` +
      `${theme.dim('Context Engines:')} ${theme.accent('.cursorrules')} ${theme.dim('|')} ${theme.accent('AGENTS.md')} ${theme.dim('|')} ${theme.accent('llms.txt')}`,
      {
        padding: { top: 0, bottom: 0, left: 2, right: 2 },
        margin: { top: 0, bottom: 1 },
        borderStyle: 'round',
        borderColor: '#7B2CBF',
        dimBorder: false,
      }
    )
  );
}

/**
 * Creates and returns a configured Ora spinner
 * @param {string} text 
 */
export function createSpinner(text) {
  return ora({
    text,
    color: 'magenta',
    spinner: 'dots12',
  });
}

/**
 * Displays a styled step badge
 * @param {number|string} step 
 * @param {string} label 
 */
export function printStep(step, label) {
  console.log(`\n${theme.accent(`[${step}]`)} ${theme.bold(label)}`);
}

/**
 * Displays completion banner with exact next steps
 */
export function displaySuccessSummary({
  projectName,
  projectPath,
  packageManager,
  features,
  contextFiles,
}) {
  const runCommand = packageManager === 'npm' ? 'npm run dev' : `${packageManager} dev`;
  const installCmd = packageManager === 'npm' ? 'npm install' : `${packageManager} install`;

  const featureList = features
    .map(f => `  ${theme.success('✔')} ${chalk.white(f.name)} ${theme.dim(`(${f.desc})`)}`)
    .join('\n');

  const contextList = contextFiles && contextFiles.length > 0
    ? contextFiles.map(c => `  ${theme.accent('✦')} ${theme.code(c.file)} ${theme.dim(`- ${c.role}`)}`).join('\n')
    : `  ${theme.dim('None (AI context generation skipped)')}`;

  const content = `
${vibeGradient.multiline('✨ YOUR VIBE-STACK IS READY FOR AGENTIC LOOPS ✨')}

${theme.bold('Target Project:')} ${theme.accent(projectName)}
${theme.dim('Location:')} ${theme.dim(projectPath)}

${theme.bold('Integrated Stack:')}
${featureList}

${theme.bold('Tuned AI Context Engines:')}
${contextList}

${theme.bold('Quickstart Commands:')}
  ${theme.accent('$')} cd ${projectName}
  ${theme.accent('$')} ${runCommand}

${theme.dim('Open with Cursor / Windsurf / Copilot for auto-loaded agentic rules.')}
`;

  console.log(
    boxen(content.trim(), {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: 'double',
      borderColor: '#00F5FF',
    })
  );
}

/**
 * Displays error message nicely
 * @param {string} message 
 * @param {Error} [error] 
 */
export function printError(message, error = null) {
  console.log(`\n${theme.error('✖ Error:')} ${chalk.white(message)}`);
  if (error && process.env.DEBUG) {
    console.error(theme.dim(error.stack || error));
  }
}
