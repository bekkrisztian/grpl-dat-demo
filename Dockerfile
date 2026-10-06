FROM node:22-alpine

RUN apk add --no-cache curl jq nginx
# alpine's nginx serves from /var/lib/nginx; the config roots at the usual path.
RUN mkdir -p /usr/share/nginx/html
RUN npm i -g pnpm@9

WORKDIR /app

COPY *.js ./
COPY package.json pnpm-lock.yaml tsconfig.json ./
COPY src /app/src

RUN pnpm install --frozen-lockfile

# alpine includes conf.d at the top level; server blocks belong in http.d.
COPY --chown=nginx nginx.conf.template /etc/nginx/http.d/default.conf
COPY rebuild.sh rebuild.sh

CMD ["./rebuild.sh"]
