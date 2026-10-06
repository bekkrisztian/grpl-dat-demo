FROM node:22-alpine

RUN apk add --no-cache curl jq nginx
RUN npm i -g pnpm@9

WORKDIR /app

COPY *.js ./
COPY package.json pnpm-lock.yaml ./
COPY src /app/src

RUN pnpm install --frozen-lockfile

COPY --chown=nginx nginx.conf.template /etc/nginx/conf.d/default.conf
COPY rebuild.sh rebuild.sh

CMD ["./rebuild.sh"]
