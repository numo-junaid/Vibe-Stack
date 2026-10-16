import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Builds custom injected section for .cursorrules based on configuration
 */
export function buildCursorRules(config = {}) {
  const { projectName, supabase = true, tailwind = true } = config;

  let stackTags = '';
  if (tailwind) stackTags += ' + Tailwind v4';
  if (supabase) stackTags += ' + Supabase';

  let uiRules = '';
  if (tailwind) {
    uiRules = `## 3. TAILWIND CSS v4 & UI DIRECTIVES
- Utilize modern Tailwind CSS v4 styling standards:
  - Reference CSS theme variables via standard utility tokens (\`bg-background\`, \`text-foreground\`, \`border-border\`).
  - Use \`cn()\` from \`@/lib/utils\` (clsx + twMerge) for dynamic class concatenation.
  - Prioritize responsive, mobile-first design with \`sm:\`, \`md:\`, \`lg:\`, \`xl:\` prefixes.
  - Avoid arbitrary pixel values when predefined spacing scales (\`p-4\`, \`m-6\`, \`gap-3\`) suffice.
  - Employ glassmorphism with subtle border highlights (\`backdrop-blur-md bg-white/5 border border-white/10\`).`;
  } else {
    uiRules = `## 3. UI & STYLING DIRECTIVES
- Utilize modern standard CSS styling standards:
  - Reference CSS theme variables from \`app/globals.css\` (\`var(--background)\`, \`var(--foreground)\`, etc.).
  - Use \`cn()\` from \`@/lib/utils\` for conditional class concatenation.
  - Prioritize responsive, mobile-first design using standard CSS media queries or utility classes.
  - Employ glassmorphism styling classes (\`.glass-panel\`, \`.glow-gradient-text\`, \`.ambient-blur\`).`;
  }

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
    uiRules,
    databaseRules,
  };
}

/**
 * Builds custom injected section for llms.txt
 */
export function buildLlmsTxt(config = {}) {
  const { projectName, supabase = true, tailwind = true } = config;

  let stylingOverview = '';
  let cssRole = '';
  let stylingConvention = '';

  if (tailwind) {
    stylingOverview = '- **Styling**: Tailwind CSS v4 with modern theme tokens and glassmorphism styling';
    cssRole = '  - `app/globals.css`: Tailwind v4 theme definitions and design tokens';
    stylingConvention = "2. **Tailwind v4 Clean Classes**: Do not use legacy `@apply` hacks. Use direct utility classes and CSS theme variables.";
  } else {
    stylingOverview = '- **Styling**: Standard CSS with custom design tokens, cyber gradients, and glassmorphic utilities';
    cssRole = '  - `app/globals.css`: Standard CSS theme definitions, glassmorphism, and color variables';
    stylingConvention = "2. **Standard CSS Tokens**: Use clean CSS variables and semantic classes defined in `app/globals.css`.";
  }

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
    stylingOverview,
    cssRole,
    stylingConvention,
    databaseOverview,
    libFiles,
    databaseSchema,
  };
}

/**
 * Builds custom injected section for AGENTS.md
 */
export function buildAgentsMd(config = {}) {
  const { supabase = true, tailwind = true } = config;

  let frontendRole = '';
  if (tailwind) {
    frontendRole = `### 🎨 Agent 2: Frontend & UI Engineer (\`@frontend\`)
- **Primary Domain**: React components, Tailwind v4 styling, UX states, animations, accessibility.
- **Execution Boundaries**:
  - May modify: \`components/**\`, \`app/**/page.tsx\`, \`app/globals.css\`.
  - May NOT execute raw database queries or mutate server-side secret credentials.
- **Standard Operating Procedure**:
  - Enforces Server Component boundaries; delegates interactive triggers to client leaves.
  - Uses Tailwind v4 classes and glassmorphic micro-interactions.
  - Handles loading states with skeletons and empty states with clear calls-to-action.`;
  } else {
    frontendRole = `### 🎨 Agent 2: Frontend & UI Engineer (\`@frontend\`)
- **Primary Domain**: React components, standard CSS styling, UX states, animations, accessibility.
- **Execution Boundaries**:
  - May modify: \`components/**\`, \`app/**/page.tsx\`, \`app/globals.css\`.
  - May NOT execute raw database queries or mutate server-side secret credentials.
- **Standard Operating Procedure**:
  - Enforces Server Component boundaries; delegates interactive triggers to client leaves.
  - Uses standard CSS tokens and glassmorphic micro-interactions.
  - Handles loading states with skeletons and empty states with clear calls-to-action.`;
  }

  let databaseRole = '';
  if (supabase) {
    databaseRole = `### 🗄️ Agent 3: Database & Backend Engineer (\`@database\`)
- **Primary Domain**: Supabase schemas, SQL migrations, Row Level Security (RLS), edge functions.
- **Execution Boundaries**:
  - May modify: \`lib/supabase/**\`, \`types/database.ts\`, SQL migration scripts, database policies.
  - May NOT modify front-end styling tokens or visual component JSX.
- **Standard Operating Procedure**:
  - Every table must have explicit RLS policies for SELECT, INSERT, UPDATE, DELETE.
  - Keeps \`types/database.ts\` synchronised with the PostgreSQL database schema.
  - Implements secure server-side queries using \`@supabase/ssr\` cookie adapters.`;
  } else {
    databaseRole = `### 🗄️ Agent 3: API & Backend Engineer (\`@backend\`)
- **Primary Domain**: Next.js Route Handlers, server actions, external API integrations.
- **Execution Boundaries**:
  - May modify: \`app/api/**\`, backend service utilities, integration types.
  - May NOT touch visual CSS styling or client layout trees.
- **Standard Operating Procedure**:
  - Enforces schema validation on all incoming payload bodies.
  - Implements predictable HTTP status codes and error payloads.`;
  }

  const delegationRole = supabase ? '@database' : '@backend';

  return {
    frontendRole,
    databaseRole,
    delegationRole,
  };
}

import {
  applyNamingTransform,
  applySupabaseTransform,
  applyTailwindTransform,
  applyAiContextTransform,
} from './transforms.js';

/**
 * Configures project dependencies, naming, and files based on feature flags.
 * Runs unconditionally regardless of AI context flag.
 * @param {string} projectPath 
 * @param {object} config 
 */
export async function configureProject(projectPath, config = {}) {
  const projectName = config.projectName || path.basename(projectPath);
  const supabase = config.supabase !== false;
  const tailwind = config.tailwind !== false;

  await applyNamingTransform(projectPath, projectName);
  await applySupabaseTransform(projectPath, supabase);
  await applyTailwindTransform(projectPath, tailwind);
}

/**
 * Main Dynamic Injector: injects tailored AI context configurations directly into project
 * @param {string} projectPath 
 * @param {object} config 
 */
export async function injectContext(projectPath, config = {}) {
  await configureProject(projectPath, config);
  await applyAiContextTransform(projectPath, config);
}
