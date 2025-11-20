# Dotport - Project Guidelines

## Purpose

Dotport is a TypeScript/Node.js CLI tool that automates backing up and restoring development environment configurations, dotfiles, and packages across machines. It supports macOS and Linux with GitHub integration for secure storage.

## Critical Rules

### Type System
- **ALWAYS use `type` instead of `interface`** - This is strictly enforced by ESLint
- All type definitions must use the `type` keyword
- Type definitions should be placed in `/types/` directory

### Quality Gates
Before marking any feature complete, ensure:
1. **Linting passes:** `pnpm lint` or `pnpm lint:fix`
2. **Build succeeds:** `pnpm build`
3. **Tests pass:** `pnpm test`

## Code Conventions

### Naming Conventions
- **Files:** kebab-case (e.g., `github-auth.ts`, `file-backup.ts`)
- **Functions:** camelCase (e.g., `expandTilde()`, `discoverConfigFiles()`)
- **Types:** PascalCase (e.g., `BackupConfig`, `TrackedFile`)
- **Constants:** SCREAMING_SNAKE_CASE (e.g., `DEFAULT_REPO_NAME`, `SYSTEM_ROOT_FOLDER`)

### Code Style
- **Prettier config:** Single quotes, no semicolons, trailing commas
- **ES Modules:** Use `import/export` (ESNext module system)
- **Type imports:** Use `import type { ... }` for type-only imports
- **Error handling:** Return objects with `{ success: boolean, error?: string }` pattern

### File Organization
```typescript
// 1. Type imports at top
import type { TrackedFile } from '../types/backup-config'

// 2. Regular imports
import { expandTilde } from './path-helpers'

// 3. Type definitions
export type LocalType = { ... }

// 4. Main functions
export function mainFunction() { ... }

// 5. Helper functions at bottom
function helperFunction() { ... }
```

## Project Structure

### Key Directories
- `/scripts/` - Main executable scripts (backup.ts, restore.ts, index.ts)
- `/utils/` - Utility modules (~8,887 lines, 30+ modules)
- `/types/` - TypeScript type definitions
- `/constants/` - Application constants
- `/config/` - Configuration files and schemas
- `/tests/` - Test suites
- `/docs/` - Documentation files

### Important Type Files
- `/types/backup-config.ts` - Main configuration types (565 lines, 40+ types)
- `/types/backup-schema.ts` - Repository schema types
- `/types/user-system-config.ts` - Local system config types

### Key Utility Categories
- **System Detection:** `system-detection.ts`, `linux-detection.ts`, `detect-runtime.ts`
- **File Management:** `file-discovery.ts`, `file-backup.ts`, `path-helpers.ts`
- **GitHub/Git:** `github-auth.ts`, `github-repo.ts`, `git-operations.ts`
- **Package Detection:** `package-detection.ts`, `runtime-detection.ts`, `editor-detection.ts`
- **Configuration:** `config.ts`, `user-system-config.ts`, `schema-builder.ts`
- **UI/Prompts:** `backup-prompts.ts`, `prompt-helpers.ts`

## Testing

### Test Framework
- **Runner:** Node.js built-in `node:test` module
- **Assertions:** Node.js built-in `assert` module
- **Execution:** `tsx --test` for TypeScript support

### Test Files
- `tests/dry-run.test.ts` - Full backup/restore workflow integration tests
- `tests/secret-scanner.test.ts` - Secret detection unit tests

### Running Tests
```bash
pnpm test              # Run all tests
pnpm test:dry-run      # Integration tests
pnpm test:secret-scanner  # Secret scanner tests
```

## Available Commands

### Development
- `pnpm build` - Compile TypeScript
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Auto-fix linting issues
- `pnpm format` - Format with Prettier
- `pnpm test` - Run all tests

### Application
- `pnpm backup` - Run interactive backup wizard
- `pnpm restore` - Run interactive restore wizard
- `pnpm script <name>` - Run specific script

## Architecture Patterns

### Three-Tier Type System
1. **backup-config.ts** - Runtime configuration (in-memory structure)
2. **user-system-config.ts** - Local system state (machine-specific, not synced)
3. **backup-schema.ts** - Repository schema (committed to dotfiles repo)

### Configuration Storage
- **Local (NOT synced):** `~/.dotport/config/` - Machine-specific configs, auth tokens
- **Repository (synced):** `~/dotfiles/` - Backup files, schema.json

### Machine Identification
Format: `<os>-<distro>-<nickname>`
- Example: `linux-ubuntu-thinkpad`, `macos-darwin-macbook-m2`

## Security Guidelines

### Secret Handling
- Automatically detect and exclude secret files (`.env`, API keys, credentials)
- SSH private keys are never backed up
- GitHub tokens stored locally only (`~/.dotport/config/github-auth.json`)
- File permissions: Directories `0o700`, config files `0o600`

### Known Secret Files
Automatically excluded: `.env`, `.env.local`, `.npmrc`, AWS credentials, SSH keys, etc.

## Documentation Guidelines

### Markdown File Creation
- Save documentation to `/docs/` folder only when necessary for future development
- **Do not create user-facing docs proactively** - these will be written once features are stable
- Keep inline JSDoc comments for public APIs

### TODO Tracking
Monitor these files for planned features and tasks:
- `README.md` - General todos at bottom
- `TODO.LINUX.md` - Linux-specific features
- `TODO.MACOS.md` - macOS-specific features

## Development Workflow

### Adding New Features
1. Create type definitions first in `/types/`
2. Implement utilities in `/utils/` following naming conventions
3. Add JSDoc comments for public APIs
4. Write tests in `/tests/`
5. Run `pnpm lint:fix` before committing
6. Ensure build passes: `pnpm build`
7. Verify all tests pass: `pnpm test`

### Common Patterns
- Use singleton pattern for config management (lazy loading)
- Return error objects instead of throwing exceptions
- Use chalk for colored console output
- Use inquirer for interactive prompts
- Organize utilities by functional domain

## Key Constants

### Directories (relative to home)
- `SYSTEM_ROOT_FOLDER` - `.dotport`
- `CONFIG_FOLDER` - `.dotport/config`
- `BACKUPS_FOLDER` - `.dotport/backups`

### Defaults
- `DEFAULT_REPO_NAME` - `dotfiles`
- `DEFAULT_BRANCH` - `main`
- `DEFAULT_CLONE_LOCATION` - `~/dev`

## Dependencies

### Core Runtime
- TypeScript 5.9.3
- tsx 4.20.6 (TypeScript executor)
- Node.js (ES2022 target)

### Key Libraries
- `@octokit/rest` - GitHub API operations
- `inquirer` - Interactive CLI prompts
- `simple-git` - Git operations
- `chalk` - Terminal colors
- `cli-progress` - Progress bars
