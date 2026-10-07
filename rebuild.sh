#!/bin/sh
set -eu

if [ -z "${SVELTE_APP_REMOTE_URL:-}" ] && [ -n "${REMOTE_ENTRY_URL:-}" ]; then
    export SVELTE_APP_REMOTE_URL=$(echo ${REMOTE_ENTRY_URL} | sed "s,/remoteEntry.js,,g")
fi
export SVELTE_APP_REMOTE_URL=$(echo "${SVELTE_APP_REMOTE_URL:-}" | sed "s,/remoteEntry.js,,g")
export SVELTE_APP_CACHE_REMOTE_URL=$(echo "${SVELTE_APP_CACHE_REMOTE_URL:-}" | sed "s,/remoteEntry.js,,g")

if [ -n "${SVELTE_APP_REMOTE_URL}" ]; then
    if [ -z "${CONTAINER_NAME:-}" ]; then
        export CONTAINER_NAME=$(curl -s -k "${SVELTE_APP_REMOTE_URL}/dashboard.json" | jq -r '.name')
        echo "CONTAINER_NAME: ${CONTAINER_NAME}"
    fi

    echo "SVELTE_APP_REMOTE_URL = ${SVELTE_APP_REMOTE_URL}"
    until curl -k -Is "${SVELTE_APP_REMOTE_URL}/dashboard.json" 2>/dev/null | head -1 | grep -q 200; do
        sleep 1
        printf '.'
    done
fi

if [ -n "${SVELTE_APP_CACHE_REMOTE_URL}" ]; then
    if [ -z "${CACHE_CONTAINER_NAME:-}" ]; then
        export CACHE_CONTAINER_NAME=$(curl -s -k "${SVELTE_APP_CACHE_REMOTE_URL}/dashboard.json" | jq -r '.name')
        echo "CACHE_CONTAINER_NAME: ${CACHE_CONTAINER_NAME}"
    fi

    echo "SVELTE_APP_CACHE_REMOTE_URL = ${SVELTE_APP_CACHE_REMOTE_URL}"
    until curl -k -Is "${SVELTE_APP_CACHE_REMOTE_URL}/dashboard.json" 2>/dev/null | head -1 | grep -q 200; do
        sleep 1
        printf '.'
    done
fi
    
if [ -z "${DEV:-}" ]; then
    pnpm build
    cp /app/dist/* /usr/share/nginx/html/.
    nginx -g 'daemon off;'
else
    sleep 1
    pnpm dev
fi
