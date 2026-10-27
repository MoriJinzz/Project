# Idea Board

A minimal responsive idea board built with Next.js App Router, TypeScript, and Supabase PostgreSQL. Visitors can post ideas and vote once per idea using a browser cookie. No account or payment setup is needed.

## What is included

- Idea list with title, description, author nickname, date, and vote count
- Idea submission and voting through server-side Next.js route handlers
- PostgreSQL `ideas` and `votes` tables, with a primary key on `(idea_id, voter_id)` to reject duplicate votes
- Row Level Security and explicit grants for the Supabase `anon` role
- A view that returns vote counts without returning voter IDs
- A responsive layout for desktop and mobile

The Supabase publishable key is read only in server files. No `NEXT_PUBLIC_` variable, secret key, service-role key, or database password is used by this app. The browser calls only the app's own `/api` routes.

## Setup, one step at a time

### 1. Create a Supabase project

Create a project in the [Supabase Dashboard](https://supabase.com/dashboard). Wait until its database is ready. You do not need to enable Supabase Auth.

**Verify:** The new project opens in the dashboard and its SQL Editor is available.

### 2. Create the tables and access policies

Open **SQL Editor → New query**. Paste the complete contents of [`supabase/schema.sql`](supabase/schema.sql) and run it. It creates the tables, constraints, RLS policies, grants, and `idea_board` view. The script can be run again if needed.

**Verify:** In **Table Editor**, `ideas` and `votes` appear. In the SQL Editor, this query should return two rows with `rls_enabled = true`:

```sql
select tablename, rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public' and tablename in ('ideas', 'votes');
```

### 3. Configure local environment variables

From **Project Settings → API Keys** (or the project's Connect dialog), copy the project URL and **publishable** key. Copy `.env.example` to `.env.local` and replace the example values:

```bash
cp .env.example .env.local
```

```dotenv
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Do not put a secret/service-role key here. `.env.local` is ignored by Git.

**Verify:** Both values are filled in locally and `.env.local` is untracked.

### 4. Run locally

Use Node.js 20.9 or later:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). You can use `npm install` and `npm run dev` instead if you prefer npm.

**Verify:** The board opens without a setup error. Post a test idea, vote once, and try voting again from the same browser: the second attempt is rejected by the database constraint.

### 5. Deploy on Vercel Hobby

Push this project to a Git repository. In [Vercel](https://vercel.com/), import the repository into a Hobby project, keep the **Next.js** framework preset, and set the root directory to this `idea-board` folder if the repository contains parent folders. Add `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in **Project Settings → Environment Variables** for Production (and Preview if you want preview deployments). Deploy or redeploy after adding the variables.

**Verify:** Open the Vercel URL, post an idea, and vote. Check that the new rows appear in Supabase Table Editor. No additional Vercel configuration file is required.

## Access model and limits

The app uses the Supabase `anon` database role with only the required operations. Visitors may read ideas and vote counts, insert ideas, and insert votes. They cannot update or delete records through that role. RLS is enabled on both tables. `voter_id` is not readable through the publishable key.

Voting is tied to a random UUID stored in an HttpOnly browser cookie. The database blocks repeat votes for the same cookie identity. Without authentication, someone can clear cookies or use another browser to vote again. Public submissions can also attract spam; moderation and rate limiting would be sensible additions if the board grows.

## Project files

- `app/page.tsx` — server-rendered board data
- `app/idea-board.tsx` — responsive interface and form interactions
- `app/api/ideas/route.ts` — idea submission
- `app/api/votes/route.ts` — vote submission and cookie identity
- `supabase/schema.sql` — database schema and least-privilege policies
