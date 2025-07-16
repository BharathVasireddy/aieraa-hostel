# Development Guide - Husky, Prettier, and Lint-Staged

## Overview

This project uses a professional development workflow with automated code formatting and linting to ensure code quality and consistency across the team.

## Tools Setup

### 🎯 Husky

- **Purpose**: Git hooks automation
- **What it does**: Runs scripts before commits, pushes, etc.
- **Status**: ✅ Installed and configured

### 🎨 Prettier

- **Purpose**: Code formatting
- **What it does**: Automatically formats code to maintain consistent style
- **Status**: ✅ Installed and configured

### 📋 Lint-Staged

- **Purpose**: Run linters on staged files only
- **What it does**: Applies formatting and linting only to files you're committing
- **Status**: ✅ Installed and configured

## Available Scripts

### Formatting Scripts

```bash
# Format all files with Prettier
npm run prettier

# Check if files need formatting (doesn't modify files)
npm run prettier:check

# Format with Prettier AND fix ESLint issues
npm run format

# Fix ESLint issues only
npm run lint:fix

# Check TypeScript without emitting files
npm run type-check
```

## How It Works

### Pre-Commit Hook

When you run `git commit`, the following happens automatically:

1. **Husky** triggers the pre-commit hook
2. **Lint-staged** runs on only the files you're committing:
   - **For JS/TS files**: Runs Prettier + ESLint --fix
   - **For JSON/MD/CSS files**: Runs Prettier only
3. If any issues are found and fixed, the commit continues
4. If there are unfixable issues, the commit is blocked

### Configuration Files

#### `.prettierrc.json`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "jsxSingleQuote": true,
  "bracketSameLine": false
}
```

#### `.prettierignore`

Excludes files like:

- `node_modules/`
- `.next/`
- `prisma/migrations/`
- `package-lock.json`
- Documentation files
- Build outputs

#### `lint-staged` (in package.json)

```json
{
  "lint-staged": {
    "**/*.{js,jsx,ts,tsx}": ["prettier --write", "eslint --fix"],
    "**/*.{json,md,css,scss,yaml,yml}": ["prettier --write"]
  }
}
```

## Development Workflow

### 1. Initial Setup (Already Done)

```bash
# Install dependencies
npm install

# Husky hooks are automatically installed via "prepare" script
```

### 2. Daily Development

```bash
# Start development
npm run dev

# Before committing (optional - hooks will do this automatically)
npm run format

# Commit your changes
git add .
git commit -m "feat: add new feature"
# ↑ This will automatically run prettier and eslint on staged files
```

### 3. Manual Formatting

```bash
# Format entire codebase (use sparingly)
npm run prettier

# Check what needs formatting
npm run prettier:check

# Fix linting issues
npm run lint:fix

# Full format + lint fix
npm run format
```

## Current Status

### ✅ What's Working

- Husky pre-commit hooks
- Prettier configuration
- Lint-staged setup
- ESLint integration
- TypeScript type checking

### ⚠️ Current State

- **115 files need formatting** (as expected in existing project)
- All files will be auto-formatted on first commit
- Pre-commit hook is ready to use

## Best Practices

### 1. Let the Tools Work

- **Don't manually format** - let Prettier do it
- **Commit frequently** - hooks will keep code clean
- **Trust the automation** - hooks prevent bad code from being committed

### 2. Team Workflow

- **Everyone gets same formatting** - no more style debates
- **Consistent code style** - easier to read and review
- **Catch issues early** - before they reach CI/CD

### 3. Handling Issues

If pre-commit hook fails:

```bash
# See what's wrong
npm run lint

# Fix automatically
npm run lint:fix

# Check formatting
npm run prettier:check

# Or fix everything at once
npm run format
```

## IDE Integration

### VS Code

Add to your `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### Other IDEs

- **WebStorm**: Enable Prettier plugin and format on save
- **Vim/Neovim**: Use prettier plugin with auto-format
- **Sublime**: Install prettier package

## Troubleshooting

### Hook Not Running

```bash
# Reinstall hooks
npm run prepare

# Check hook permissions
chmod +x .husky/pre-commit
```

### Prettier Issues

```bash
# Clear cache
npx prettier --write . --cache-clear

# Check ignored files
npx prettier --check . --debug-check
```

### ESLint Issues

```bash
# Check ESLint config
npx eslint --print-config src/app/page.tsx

# Fix specific file
npx eslint src/app/page.tsx --fix
```

## Next Steps

1. **First commit**: Will auto-format all 115 files
2. **Team onboarding**: Share this guide with team members
3. **CI/CD integration**: Add format checking to build pipeline
4. **Gradual improvement**: Tighten rules over time

## Benefits

- ✅ **Consistent code style** across the entire team
- ✅ **Automated quality checks** prevent bad code from entering repo
- ✅ **Reduced code review time** - no style discussions needed
- ✅ **Professional development workflow** following industry standards
- ✅ **Catches issues early** before they reach production

---

_This setup follows industry best practices used by companies like Netflix, Airbnb, and Google for maintaining code quality at scale._
