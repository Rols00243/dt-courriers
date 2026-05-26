# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> ⚠️ This project uses **Next.js 16**, **Prisma 7**, and **NextAuth v5 beta** — all with breaking changes from widely-known versions. Read `AGENTS.md` before writing any Next.js code.

## Commands

```bash
# Node.js and PostgreSQL are NOT in the default PATH on this machine — prefix PowerShell commands:
$env:PATH = "C:\Program Files\nodejs;C:\Program Files\PostgreSQL\18\bin;$env:PATH"

npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build (also produces .next/standalone/ for Electron)
npm run lint         # ESLint

npm run db:push      # Sync schema to DB without migration history (use for dev)
npm run db:migrate   # Create and apply a named migration
npm run db:generate  # Regenerate Prisma client after schema changes
npm run db:studio    # Open Prisma Studio GUI

# Electron desktop build
npm run electron:dev    # Start Next.js + Electron together (development)
npm run dist:manual     # Build portable Windows desktop app → dist/DT Courriers-win32-x64/

# Seed initial users (run once after db:push):
curl -X POST http://localhost:3000/api/seed
# Admin: admin@dt-courriers.com / Admin@2024!
```

## Architecture

**Stack:** Next.js 16 App Router · Prisma 7 + PostgreSQL 18 · NextAuth v5 beta · Tailwind CSS v4 · shadcn/ui

```
app/
  layout.tsx                    # Root layout — wraps everything in <SessionProvider>
  dashboard/
    layout.tsx                  # Auth guard (server) + <Sidebar> shell
    page.tsx                    # Stats dashboard — all DB calls server-side
    courriers/
      page.tsx                  # List with server-side filtering via searchParams
      nouveau/page.tsx          # "use client" form — POSTs to /api/courriers then /api/upload
      [id]/page.tsx             # Detail view (server component)
      [id]/statut-selector.tsx  # "use client" island — PATCHes /api/courriers/[id]
    archives/page.tsx           # Filtered view: statut = ARCHIVE
    utilisateurs/page.tsx       # Admin-only (redirects non-admins server-side)
  api/
    auth/[...nextauth]/route.ts # NextAuth handler
    courriers/route.ts          # GET (search/filter) + POST (create + auto-número)
    courriers/[id]/route.ts     # GET + PATCH (statut/priorité) + DELETE (admin only)
    upload/route.ts             # Multipart — saves to public/uploads/{courrierId}/
    seed/route.ts               # One-time user seeding — idempotent

lib/
  prisma.ts      # Singleton PrismaClient — MUST use PrismaPg adapter (see below)
  numero.ts      # Auto-reference generator: {PREFIX}-{YEAR}-{SEQ:0004}
  constants.ts   # All enum → label/color mappings (TYPE_LABELS, STATUT_COLORS, etc.)
  utils.ts       # shadcn cn() helper

components/
  sidebar.tsx    # "use client" — uses useSession, usePathname
  ui/            # shadcn/ui primitives (do not edit manually)

auth.ts          # NextAuth config — JWT strategy, credentials provider, role in token
proxy.ts         # Auth gate (was middleware.ts in Next.js < 16 — see note below)
prisma.config.ts # Prisma CLI config — datasource URL lives HERE, not in schema.prisma

electron/        # Electron main + preload (TypeScript, compiled separately)
  main.ts        # Spawns Next.js standalone server, creates BrowserWindow
  preload.ts     # Secure renderer bridge (contextIsolation)
build/           # Icons + license used by electron-builder/installer
scripts/
  manual-package.ps1   # The Electron build script that ACTUALLY works on Windows
  generate-icons.js    # SVG → PNG + ICO conversion (sharp + to-ico)
tsconfig.electron.json # Separate tsconfig for electron/ (CommonJS, not ESM like Next.js)
electron-builder.yml   # Config kept for reference — DO NOT use electron-builder, see below
```

## Critical: Next.js 16 — middleware renamed to proxy

In Next.js 16, `middleware.ts` is deprecated and renamed to `proxy.ts` (default-exported `proxy` function or `export default auth(...)`). Using `middleware.ts` causes a cryptic edge-runtime error: `Cannot read properties of undefined (reading 'reduce')`. Place `proxy.ts` at the project root, exporting `default` + `config.matcher`.

## Critical: Prisma 7 differences

In Prisma 7 the datasource `url` is **removed from `schema.prisma`** and lives in `prisma.config.ts`. `PrismaClient` **must** receive a driver adapter:

```ts
// lib/prisma.ts — always create the client this way
import { PrismaPg } from "@prisma/adapter-pg"
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
```

After any schema change: run `npm run db:push` (dev) or `npm run db:migrate`, then `npm run db:generate`.

## Critical: NextAuth v5 beta differences

- Config and helpers export from root `auth.ts` (`handlers`, `auth`, `signIn`, `signOut`)
- Server components call `const session = await auth()` directly — no `getServerSession`
- Session contains `session.user.id` and `session.user.role` (typed in `types/next-auth.d.ts`)
- API routes check auth with `const session = await auth()` at the top

## Enum reference numbers

`lib/numero.ts` generates reference numbers as `{PREFIX}-{YEAR}-{SEQ}` (e.g. `CE-2026-0001`). Prefixes are defined in the `PREFIXES` map — add a new entry when adding a new `TypeCourrier` enum value.

## Adding new enum display values

All human-readable labels and Tailwind color classes for enums are centralized in `lib/constants.ts`. When adding a new enum value to the schema, update the corresponding `*_LABELS` and `*_COLORS` objects there.

## Roles and permissions

Three roles: `ADMIN` > `GESTIONNAIRE` > `AGENT`. Role is stored in the JWT and available as `session.user.role`. Server-side role checks use `redirect()` (see `utilisateurs/page.tsx`). API-level checks return 403. No middleware-level role enforcement yet.

## File uploads

Files are saved to `public/uploads/{courrierId}/{timestamp}-{sanitized-filename}` and served as static assets. The DB stores the relative URL `/uploads/...`. Max upload size is configured in `next.config.ts` via `serverActions.bodySizeLimit`.

## Critical: Electron build on Windows — use the manual script, NOT electron-builder/packager

**Use `npm run dist:manual`** (calls `scripts/manual-package.ps1`). Both `electron-builder` and `@electron/packager` fail silently on this Windows setup due to symlink-extraction issues. The PowerShell script uses `Expand-Archive` which handles symlinks gracefully. The `electron-builder.yml` is kept for reference only — do not try to use `dist:win` or `dist:package`.

**Symptoms of using the wrong tool:**
- electron-builder: `7za.exe ... ERROR: Cannot create symbolic link ... darwin/10.12/lib/libcrypto.dylib ... privilège nécessaire` — winCodeSign archive contains macOS symlinks that 7za can't extract without `SeCreateSymbolicLinkPrivilege` (Developer Mode or admin).
- @electron/packager: silently exits at "Packaging app for platform win32 x64 using electron v…" with exit code 0 but no output folder. Same root cause via a different extractor.

### Build flow (`dist:manual`)

1. `next build` → produces `.next/standalone/` (self-contained Next.js server)
2. `tsc -p tsconfig.electron.json` → produces `dist-electron/{main.js, preload.js}`
3. `scripts/manual-package.ps1` does the assembly:
   - Finds (or downloads) `electron-v{X}-win32-x64.zip`
   - `Expand-Archive` into `dist/DT Courriers-win32-x64/`
   - Renames `electron.exe` → `DT Courriers.exe`
   - Deletes `resources/default_app.asar`
   - Creates `resources/app/` and `robocopy`s into it:
     - `.next/standalone/*` (server.js, .env, package.json, node_modules subset, .next/)
     - `.next/static/` → `resources/app/.next/static/`
     - `public/` → `resources/app/public/`
     - `dist-electron/` (main.js + preload.js)
     - `node_modules/tree-kill/` (NOT in standalone — must copy explicitly)

### Critical gotchas

1. **`tree-kill` (and any other Electron-only dep) is NOT in `.next/standalone/node_modules/`.** Next.js standalone only includes deps used by the Next.js server. Electron's main.ts is invisible to that scan. → explicitly `robocopy` it.
2. **`Copy-Item "$src\*"` silently drops `.env` and `server.js`.** Use `robocopy` for the standalone tree.
3. **NextAuth v5 rejects `localhost` host** in the packaged app with `UntrustedHost: Host must be trusted`. Set `AUTH_TRUST_HOST=true` and `NEXTAUTH_URL=http://localhost:{port}` in the env passed to the spawned Next.js process (see `electron/main.ts`).
4. **Spawning the Next.js server uses `process.execPath` + `ELECTRON_RUN_AS_NODE=1`** — the same Electron .exe is reused as a Node runtime. No separate Node binary needed in the bundle.
5. **Renaming `electron.exe` to anything else** keeps the binary functional. Just rename, don't try to "rebuild" it.

### Debugging: app launches but no window/log

If the packaged app starts processes but never logs or shows a window, `main.js` is failing at an `import`/`require` of a missing dep. The symptom is: `DT Courriers.exe` runs, 3 processes spawn (main + GPU + crashpad), then they die quietly. To diagnose, temporarily replace `resources/app/dist-electron/main.js` with a minimal `fs.writeFileSync` test — if it writes, then the issue is a missing module in your real main.ts. Check that every `import` in `electron/main.ts` resolves under `resources/app/node_modules/`.

Logs land in `%APPDATA%\dt-courriers\app.log` once `main.js` loads successfully. Look there first when debugging the packaged app.

### Distribution

```powershell
Compress-Archive -Path "dist/DT Courriers-win32-x64" -DestinationPath "DT Courriers-v0.1.0.zip"
```

End users dezip, then double-click `DT Courriers.exe`. Requires PostgreSQL accessible at the URL in the bundled `.env` (currently `localhost:5432`).
