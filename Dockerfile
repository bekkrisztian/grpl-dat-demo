# The frontend is rebuilt at container startup after the gruim remote is available.
FROM node:22-alpine

# The startup script uses curl and jq to read dashboard.json; nginx serves the bundle.
RUN apk add --no-cache curl jq nginx
RUN mkdir -p /usr/share/nginx/html
# Keep the package manager identical to the packageManager field in package.json.
RUN npm install -g pnpm@9.15.9

WORKDIR /app

COPY *.js ./
COPY *.json ./
COPY pnpm-lock.yaml ./
COPY src /app/src

# Use the lockfile so development and container dependencies stay identical.
RUN pnpm install --frozen-lockfile

# Alpine nginx loads server blocks from http.d.
COPY --chown=nginx nginx.conf.template /etc/nginx/http.d/default.conf
COPY rebuild.sh rebuild.sh

# rebuild.sh waits for gruim, builds the frontend and starts nginx (or pnpm dev in DEV mode).
CMD ["./rebuild.sh"]
