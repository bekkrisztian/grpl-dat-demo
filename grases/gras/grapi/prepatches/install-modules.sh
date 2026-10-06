#!/bin/bash
# Install modules from /opt/custom-modules

MODULES_DIR="/opt/custom-modules"

# Ensure typescript is available (use npx to find it in path or download)
TSC="npx tsc"

if [ -d "$MODULES_DIR" ]; then
    echo "Processing modules in $MODULES_DIR..."
    # Check if directory is empty
    if [ -z "$(ls -A $MODULES_DIR)" ]; then
       echo "No modules found in $MODULES_DIR"
    else
       for module in "$MODULES_DIR"/*; do
           if [ -d "$module" ]; then
               MODULE_NAME=$(basename "$module")
               echo "Preparing module: $MODULE_NAME..."
               
               cd "$module"
               
               # 1. Auto-generate package.json if missing
               if [ ! -f "package.json" ]; then
                   echo "  Generating package.json..."
                   npm init -y >/dev/null
               fi
               
               # 2. Auto-detect and install dependencies
               echo "  Checking dependencies..."
               IMPORTS=$(grep -hE "^import .* from ['\"].*['\"]|^const .* = require\(['\"].*['\"]" *.ts 2>/dev/null | sed -E "s/^import .* from ['\"](.*)['\"].*/\1/; s/^const .* = require\(['\"](.*)['\"].*/\1/" | sort | uniq)
               DEPS=""
               for lib in $IMPORTS; do
                  if echo "$lib" | grep -qE "^\."; then continue; fi
                  if echo "$lib" | grep -qE "^@"; then
                     PKG=$(echo "$lib" | cut -d/ -f1-2)
                  else
                     PKG=$(echo "$lib" | cut -d/ -f1)
                  fi
                  case "$PKG" in
                    fs|path|crypto|os|util|events|stream|buffer|url|http|https|net|tls|zlib|child_process|cluster|dgram|dns|querystring|readline|repl|string_decoder|tty|v8|vm|wasi|worker_threads) continue ;;
                  esac
                  DEPS="$DEPS $PKG"
               done
               
               if [ -n "$DEPS" ]; then
                   echo "  Installing detected dependencies: $DEPS"
                   npm install $DEPS
               fi
               
               # Install types
               if [ ! -d "node_modules/@types/node" ]; then
                   echo "  Installing @types/node..."
                   npm install --save-dev @types/node >/dev/null 2>&1 || true
               fi

               # 3. Compile TypeScript
               if [ -f "tsconfig.json" ]; then
                   echo "  Compiling TypeScript..."
                   # Ensure typescript is installed locally to guarantee tsc availability
                   if [ ! -f "node_modules/.bin/tsc" ]; then
                       echo "  Installing typescript..."
                       npm install --save-dev typescript >/dev/null 2>&1 || true
                   fi
                   
                   # Run tsc from the module directory with explicit working directory
                   (cd "$module" && ./node_modules/.bin/tsc)
                   
                   if [ ! -f "index.js" ]; then
                       echo "ERROR: index.js was not generated in $module"
                       ls -la
                   else
                       echo "  Compilation successful. index.js generated."
                   fi
               fi
               
               cd - >/dev/null
               
               echo "Installing module into app: $MODULE_NAME"
               npm install --save "$module"
           fi
       done
    fi
else
    echo "Modules directory $MODULES_DIR not found."
fi

