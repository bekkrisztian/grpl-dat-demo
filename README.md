# Grapple DAT demo

A Grapple/Svelte demo for DAT vehicle selection and fuzzy vehicle search.

## Scope

- Cascading vehicle search: `FZA → HST → OTG → HT → UT`
- Vehicle result list
- Fuzzy search using any of the available vehicle criteria

The demo contains both requested screens and talks directly to the DAT layer-one
LoopBack API. Only the API endpoints used by the screens are generated.

## Local frontend development

Requirements: Node.js 22 and pnpm 9.15.9.

```sh
cp .env.example .env
pnpm install --frozen-lockfile
pnpm dev
```

The frontend is available at <http://localhost:4000>.

## Complete Docker setup

Copy `.env.example` to `.env` and fill in the DAT database settings. Then start
the API and frontend:

```sh
docker compose up --build
```

The DAT API is available at <http://localhost:3333> and the demo UI at
<http://localhost:4000>. The first API startup generates the LoopBack models and
controllers and can take approximately two minutes.

The cache proxy and Gruim containers from the original setup are intentionally
not required: this custom UI consumes the layer-one OpenAPI directly. This also
avoids the unavailable external Redis host from the original commands.

## API behavior

The generated `/vehicleTypes` controller in `grpl/loopback:0.4.25` fails when
called without parameters. The UI therefore uses the five verified DAT FZA categories
directly. Fuzzy search uses a database-side, limited
`globalSearch LIKE` query; the generated fuzzy endpoint is not used because an
unfiltered request loads the full data set into memory.

## Validation

```sh
pnpm build
pnpm typecheck
pnpm test
```

## Secrets

Never commit DAT database or Redis credentials. Keep local values in the ignored
`.env` file and use the deployment platform's secret store outside local development.
