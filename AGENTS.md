# AGENTS.md

This project follows specific guidelines for AI coding agents to ensure consistent development practices.

## Setup Commands

- Install dependencies: `pnpm install`
- Start development server: `pnpm dev`
- Run tests: `pnpm test`

## Development Server Policy

**MANDATORY**: Never automatically start development servers for web applications. Always let the user start them manually.

### Prohibited Actions

- Do not run `npm start`, `bun dev`, `pnpm dev`, or similar commands automatically
- Do not execute `yarn start`, `npm run dev`, or framework-specific dev commands
- Do not start servers for React, Vue, Angular, Next.js, Vite, or other web frameworks
- Do not automatically run `serve`, `http-server`, or local server commands

### Permitted Actions

- Suggest the appropriate command to start the server
- Provide instructions on how to start the development server
- Offer to create or update start scripts in package.json
- Help configure server settings and environment variables

## Shell Execution Standards

**MANDATORY**: Use fish shell syntax for ALL terminal commands. Never use bash syntax.

### Core Syntax Rules

- **Variables**: `set VAR_NAME value` (not `export VAR=value`)
- **Environment**: `set -x VAR value` (exported variables)
- **Conditionals**: `if test condition; command; end`
- **Logic**: Use `; and` and `; or` (not `&&` and `||`)

### Common Bash to Fish Conversions

| Bash | Fish |
|------|------|
| `export VAR=value` | `set -x VAR value` |
| `cmd1 && cmd2` | `cmd1; and cmd2` |
| `cmd1 \|\| cmd2` | `cmd1; or cmd2` |
| `if [ condition ]` | `if test condition` |

## Node.js Package Manager Standards

**MANDATORY**: Use `pnpm` as the primary package manager, with `yarn` as fallback only if pnpm doesn't exist or encounters errors. Never use `npm` or `bun`.

### Preferred Order
1. **pnpm** - Efficient disk usage, strict dependency resolution, fast performance
2. **yarn** - Fallback option when pnpm is unavailable or fails

### Installation Commands

```bash
# Using pnpm (preferred)
pnpm install
pnpm add <package>
pnpm remove <package>
pnpm run <script>

# Using yarn (fallback only)
yarn install
yarn add <package>
yarn remove <package>
yarn run <script>
```

### Script Execution

Always use the detected package manager for running scripts:
- `pnpm dev` (preferred)
- `yarn dev` (fallback only)

## UI Color Palette Preference

**MANDATORY**: Prefer non-purple as the primary UI color. Use purple only as a secondary/accent.

### Palette Priorities

- Primary (preferred): blue, teal, cyan, green, neutral/gray
- Secondary: orange, amber, slate
- Accent only (low priority): purple/violet/fuchsia

### Good Examples

```css
:root {
  /* Good: primary not purple */
  --color-primary: #0ea5e9;   /* blue-500 */
  --color-secondary: #a855f7; /* violet-500 (accent) */
}
```

```tsx
// Good (React/Tailwind example)
<button className="bg-sky-600 hover:bg-sky-700 text-white">Action</button>
```

### Bad Examples

```css
:root {
  /* Bad: purple as primary */
  --color-primary: #8b5cf6; /* violet-500 */
}
```

```tsx
// Bad
<button className="bg-purple-600 hover:bg-purple-700 text-white">Action</button>
```


## Auto Commit and Push Workflow

**MANDATORY**: When performing automatic Git operations, follow this standardized workflow for staging changes, generating conventional commit messages with emojis, and pushing to remote.

### Workflow Steps

1. **Status Check**: Run `git status` to see what files have been modified
2. **Stage Changes**: Use `git add .` to include all modified files
3. **Analyze Changes**: Use `git status --porcelain` to get a clean list of modified files, then read the content of modified files to understand what has been changed
4. **Generate Commit Message**: Create a conventional commit message with appropriate emoji
5. **Commit**: Execute `git commit -m "your message here"`
6. **Push**: Execute `git push` to remote repository
7. **Report**: Provide a summary of operations performed

### Commit Message Format

```
<emoji> <type>(<scope>): <description>
[optional body]
[optional footer(s)]
```

### Types and Emojis

- ✨ feat: A new feature
- 🔧 fix: A bug fix
- 📚 docs: Documentation only changes
- 💎 style: Changes that do not affect the meaning of the code
- ♻️ refactor: A code change that neither fixes a bug nor adds a feature
- ⚡ perf: A code change that improves performance
- ✅ test: Adding missing tests or correcting existing tests
- 📦 build: Changes that affect the build system or external dependencies
- ⚙️ ci: Changes to CI configuration files and scripts
- 🔨 chore: Other changes that don't modify src or test files
- ⏪ revert: Reverts a previous commit

### Commit Message Rules

1. Use lowercase for type and description
2. Keep the description under 50 characters when possible
3. Use imperative mood ("add" not "added" or "adds")
4. Include scope when relevant (component, module, or area affected)
5. Always start with the appropriate emoji
6. No period at the end of the description
7. Use body for additional context if needed (separate with blank line)

### Breaking Changes

For breaking changes, add `!` after the type/scope and include `BREAKING CHANGE:` in the footer.

### Example Usage

```fish
git status
git add .
git status --porcelain
git commit -m "✨ feat(auth): add user authentication system"
git push
```

This ensures consistent, descriptive commit messages that follow conventional commit standards while maintaining clear project history.
