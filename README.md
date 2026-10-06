# Grapple DAT demo

A Grapple/Svelte demo for DAT vehicle selection and fuzzy vehicle search.

## Scope

- Cascading vehicle search: `FZA → HST → OTG → HT → UT`
- Vehicle result list
- Fuzzy search using any of the available vehicle criteria

The repository currently contains the modernized application scaffold. DAT backend
services and the two search screens will be added next.

## Local frontend development

Requirements: Node.js 22 and pnpm 9.15.9.

```sh
cp .env.example .env
pnpm install --frozen-lockfile
pnpm dev
```

The frontend is available at <http://localhost:4000>.

## Validation

```sh
pnpm build
pnpm typecheck
pnpm test
```

## Secrets

Never commit DAT database or Redis credentials. Keep local values in the ignored
`.env` file and use the deployment platform's secret store outside local development.
