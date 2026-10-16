import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Builds custom injected section for .cursorrules based on configuration
 */
export function buildCursorRules(config) {
  const { projectName, supabase = true, tailwind = true } = config;

  let stackTags = '';
  if (supabase) stackTags += ' + Supabase';
  if (tailwind) stackTags += ' + Tailwind v4';

  let databaseRules = '';
  if (supabase) {
    databaseRules = `## 3.1 SUPABASE & DATABASE ACCESS RULES
- **Client vs Server Instantiation**:
  - In Server Components, Server Actions, & Route Handlers: MUST use \`createClient()\` from \`@/lib/supabase/server\`.
  - In Client Components ('use client'): Use \`createClient()\` from \`@/lib/supabase/client\`.
  - NEVER share a single Supabase client instance across requests on the server.
- **Row Level Security (RLS)**:
  - Every table in PostgreSQL MUST have RLS enabled (\`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;\`).
  - Write explicit policies for \`SELECT\`, \`INSERT\`, \`UPDATE\`, and \`DELETE\` tied to \`auth.uid()\`.
  - Never bypass RLS using service role keys unless inside an isolated backend administrative task.
- **Type Safety**:
  - Always utilize the generated database definitions from \`@/types/database\`.
  - Cast supabase client with typed generic: \`createClient<Database>()\`.
- **Session Management**:
  - Keep authentication session active using Next.js middleware with \`@supabase/ssr\`.
  - Never store auth tokens in localStorage; use secure HTTP-only cookies managed by SSR helper.`;
  } else {
    databaseRules = `## 3.1 DATA ACCESS RULES
- Keep data fetching logic encapsulated in \`lib/api/\` or Server Actions.
- Ensure all API inputs and outputs are validated with TypeScript interfaces.
- Handle loading, error, and optimistic updates gracefully in UI components.`;
  }

  return {
    stackTags,
    databaseRules,
  };
}

/**
 * Builds custom injected section for llms.txt
 */
export function buildLlmsTxt(config) {
  const { projectName, supabase = true } = config;

  let databaseOverview = '';
  let libFiles = '';
  let databaseSchema = '';

  if (supabase) {
    databaseOverview = '- **Database & Auth**: Supabase (PostgreSQL, Auth, RLS policies, Realtime, @supabase/ssr)';
    libFiles = `  - \`lib/supabase/client.ts\`: Browser Supabase client helper
  - \`lib/supabase/server.ts\`: Server-side Supabase client with cookie storage adapter
  - \`lib/supabase/middleware.ts\`: Middleware session refresher`;
    databaseSchema = `## Database Schema (Supabase)
\`\`\`sql
-- Example Profiles Table with Row Level Security
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  username text unique,
  full_name text,
  avatar_url text,
  website text
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update their own profile."
  on public.profiles for update
  using ( auth.uid() = id );
\`\`\``;
  } else {
    databaseOverview = '- **Data Layer**: Clean REST API Route Handlers with TypeScript typing';
    libFiles = '  - `lib/utils.ts`: Class name mergers and general helper functions';
    databaseSchema = `## Data Architecture
- Modular REST Route Handlers located under \`app/api/\`
- Standardized JSON responses: \`{ success: boolean, data?: any, error?: string }\``;
  }

  return {
    databaseOverview,
    libFiles,
    databaseSchema,
  };
}

/**
 * Builds custom injected section for AGENTS.md
 */
export function buildAgentsMd(config) {
  const { supabase = true } = config;

  if (supabase) {
    return `### 🗄️ Agent 3: Database & Backend Engineer (\`@database\`)
- **Primary Domain**: Supabase schemas, SQL migrations, Row Level Security (RLS), edge functions.
- **Execution Boundaries**:
  - May modify: \`lib/supabase/**\`, \`types/database.ts\`, SQL migration scripts, database policies.
  - May NOT modify front-end styling tokens or visual component JSX.
- **Standard Operating Procedure**:
  - Every table must have explicit RLS policies for SELECT, INSERT, UPDATE, DELETE.
  - Keeps \`types/database.ts\` synchronised with the PostgreSQL database schema.
  - Implements secure server-side queries using \`@supabase/ssr\` cookie adapters.`;
  }

  return `### 🗄️ Agent 3: API & Backend Engineer (\`@backend\`)
- **Primary Domain**: Next.js Route Handlers, server actions, external API integrations.
- **Execution Boundaries**:
  - May modify: \`app/api/**\`, backend service utilities, integration types.
  - May NOT touch visual CSS styling or client layout trees.
- **Standard Operating Procedure**:
  - Enforces schema validation on all incoming payload bodies.
  - Implements predictable HTTP status codes and error payloads.`;
}

/**
 * Main Dynamic Injector: injects tailored AI context configurations directly into project
 * @param {string} projectPath 
 * @param {object} config 
 */
export async function injectContext(projectPath, config) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const templateAiDir = path.resolve(__dirname, '../../templates/ai-config');

  const projectName = config.projectName || path.basename(projectPath);

  // 1. Process .cursorrules
  const cursorRulesPath = path.join(templateAiDir, '.cursorrules');
  if (await fs.pathExists(cursorRulesPath)) {
    let cursorRulesContent = await fs.readFile(cursorRulesPath, 'utf8');
    const { stackTags, databaseRules } = buildCursorRules(config);

    cursorRulesContent = cursorRulesContent
      .replace(/\{\{PROJECT_NAME\}\}/g, projectName)
      .replace(/\{\{CURSORRULES_STACK_TAGS\}\}/g, stackTags)
      .replace(/\{\{CURSORRULES_DATABASE_INJECTION\}\}/g, databaseRules);

    await fs.writeFile(path.join(projectPath, '.cursorrules'), cursorRulesContent, 'utf8');
  }

  // 2. Process llms.txt
  const llmsPath = path.join(templateAiDir, 'llms.txt');
  if (await fs.pathExists(llmsPath)) {
    let llmsContent = await fs.readFile(llmsPath, 'utf8');
    const { databaseOverview, libFiles, databaseSchema } = buildLlmsTxt(config);

    llmsContent = llmsContent
      .replace(/\{\{PROJECT_NAME\}\}/g, projectName)
      .replace(/\{\{LLMS_DATABASE_OVERVIEW\}\}/g, databaseOverview)
      .replace(/\{\{LLMS_LIB_FILES\}\}/g, libFiles)
      .replace(/\{\{LLMS_DATABASE_SCHEMA\}\}/g, databaseSchema);

    await fs.writeFile(path.join(projectPath, 'llms.txt'), llmsContent, 'utf8');
  }

  // 3. Process AGENTS.md
  const agentsPath = path.join(templateAiDir, 'AGENTS.md');
  if (await fs.pathExists(agentsPath)) {
    let agentsContent = await fs.readFile(agentsPath, 'utf8');
    const databaseRole = buildAgentsMd(config);

    agentsContent = agentsContent
      .replace(/\{\{PROJECT_NAME\}\}/g, projectName)
      .replace(/\{\{AGENTS_DATABASE_ROLE\}\}/g, databaseRole);

    await fs.writeFile(path.join(projectPath, 'AGENTS.md'), agentsContent, 'utf8');
  }

  // 4. Adjust project dependencies and files if Supabase is disabled
  if (!config.supabase) {
    const supabaseLibDir = path.join(projectPath, 'lib', 'supabase');
    if (await fs.pathExists(supabaseLibDir)) {
      await fs.remove(supabaseLibDir);
    }

    const typesDbFile = path.join(projectPath, 'types', 'database.ts');
    if (await fs.pathExists(typesDbFile)) {
      await fs.remove(typesDbFile);
    }
  }

  // 5. Adjust target project package.json
  const targetPkgPath = path.join(projectPath, 'package.json');
  if (await fs.pathExists(targetPkgPath)) {
    const pkg = await fs.readJson(targetPkgPath);
    pkg.name = projectName;
    if (!config.supabase) {
      if (pkg.dependencies) {
        delete pkg.dependencies['@supabase/supabase-js'];
        delete pkg.dependencies['@supabase/ssr'];
      }
    }
    await fs.writeJson(targetPkgPath, pkg, { spaces: 2 });
  }

  // 6. Adjust .env.example
  const envExamplePath = path.join(projectPath, '.env.example');
  if (await fs.pathExists(envExamplePath)) {
    let envContent = await fs.readFile(envExamplePath, 'utf8');
    if (!config.supabase) {
      envContent = envContent
        .replace(/NEXT_PUBLIC_SUPABASE_URL=.*\n/g, '')
        .replace(/NEXT_PUBLIC_SUPABASE_ANON_KEY=.*\n/g, '');
    }
    await fs.writeFile(envExamplePath, envContent, 'utf8');
  }
}
