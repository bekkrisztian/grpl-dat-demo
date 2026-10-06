# Custom Modules

This directory contains custom Node.js modules that are automatically built and installed into the grapi application.

## How It Works

1. **Module Structure**: Place your TypeScript module in a subdirectory (e.g., `my-module/`)
   - Required: `index.ts` (your module code)
   - Required: `tsconfig.json` (TypeScript compilation config)
   - Optional: `package.json` (auto-generated if missing)

2. **Automatic Dependency Detection**: Dependencies are auto-detected from your `import` statements
   - No need to manually create `package.json`
   - External packages are automatically installed
   - Built-in Node.js modules are filtered out

3. **Build Process**:
   - **Docker Build**: `Dockerfile.modules` packages all modules into an image
   - **Init Container**: Copies modules to `/opt/custom-modules` volume at pod startup
   - **Prepatch Script**: `install-modules.sh` compiles TypeScript and installs modules

4. **DevSpace Integration**: 
   - Source files (`.ts`) are synced for live editing
   - Build artifacts (`.js`, `node_modules`, `package.json`) are excluded from sync
   - **Auto-reload**: When you save changes to `.ts` files, DevSpace automatically:
     - Syncs the changes to the container
     - Re-runs `install-modules.sh` to recompile and reinstall modules
     - Restarts the application
   - No need to manually restart pods during development!

## Usage in Code

```typescript
import { yourFunction } from 'your-module-name';
```

The module name is the directory name.

