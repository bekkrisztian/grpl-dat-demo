# Example: Logger Module

This is a working example of a custom module and how to use it in a controller.

## Module Structure

```
grases/gras/grapi/modules/logger/
├── index.ts         # Module implementation
└── tsconfig.json    # TypeScript configuration
```

## Module Implementation

The logger module (`modules/logger/index.ts`) exports four functions:
- `logInfo(message, data?)` - Log informational messages
- `logDebug(message, data?)` - Log debug messages
- `logWarn(message, data?)` - Log warning messages
- `logError(message, error?)` - Log error messages

## Using the Module in a Controller

The demo controller (`injections/demo-logger.controller.ts`) shows how to import and use the logger module:

```typescript
// Import the logger functions using @ts-ignore to bypass TypeScript checks
// @ts-ignore
import { logInfo, logDebug, logWarn, logError } from "logger";

// Use anywhere in your controller
logInfo("Health check endpoint called");
logDebug("Health check response", response);
```

## API Endpoints Created

The demo controller provides the following endpoints:

1. **GET /demo-logger/health**
   - Health check endpoint with info logging
   - Returns: `{ status: "healthy", timestamp: "..." }`

2. **POST /demo-logger/echo**
   - Echo endpoint that logs the message
   - Body: `{ message: "your message" }`
   - Returns: `{ message: "your message", receivedAt: "..." }`

3. **GET /demo-logger/user/{id}**
   - Get user info by ID with logging
   - Returns: `{ id: 1, name: "User 1", email: "user1@example.com" }`

4. **GET /demo-logger/test-error**
   - Test error logging endpoint
   - Intentionally throws an error to demonstrate error logging

5. **GET /demo-logger/stats**
   - Get logger module statistics
   - Returns module information and available functions

## How It Works

1. **Build Time**: The `Dockerfile.modules` packages all modules into a Docker image
2. **Pod Startup**: The `init-modules` init container copies modules to `/opt/custom-modules`
3. **Runtime**: The `install-modules.sh` prepatch script:
   - Auto-detects dependencies from imports
   - Compiles TypeScript to JavaScript
   - Installs the module into the grapi app
4. **Usage**: Controllers import the module by its directory name (`logger`)

## Development Workflow

1. **Edit Module**: Modify `modules/logger/index.ts`
2. **Auto-Sync**: DevSpace syncs the changes to the container
3. **Auto-Compile**: The module is automatically recompiled
4. **Auto-Restart**: The app restarts to pick up changes

No manual intervention needed during development!

## Testing the Endpoints

Once deployed, you can test the endpoints:

```bash
# Health check
curl http://your-app-url/demo-logger/health

# Echo endpoint
curl -X POST http://your-app-url/demo-logger/echo \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from logger!"}'

# Get user
curl http://your-app-url/demo-logger/user/123

# Get stats
curl http://your-app-url/demo-logger/stats
```

Check the container logs to see the structured logging output!

