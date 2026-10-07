# Grapple DAT demo

A Grapple/Svelte demo for DAT vehicle selection and fuzzy vehicle search.

## Scope

- Cascading vehicle search: `FZA → HST → OTG → HT → UT`
- Vehicle result list
- Fuzzy search using any of the available vehicle criteria
- A browse tab that embeds the cached Gruim admin module for `datecode2`

The demo contains both requested screens and talks directly to the DAT layer-one
LoopBack API. A Redis-backed layer-two API exposes the cached OpenAPI proxy and
MCP endpoint from the original setup.

## What you have to configure

The demo reads an **existing** DAT MySQL database. It neither provisions nor
seeds one: the `datecode2` table holds roughly 570,000 rows, which is why the
data stays outside the repository.

The DAT database and Redis connection values are environment specific and must
be supplied; everything else is already in `chart/values.yaml`.

| value | default | where you set it |
| --- | --- | --- |
| `host` | none | `.env` (Docker) / `chart/values-secret.yaml` (Grapple) |
| `username` | none | same |
| `password` | none | same |
| `port` | `3306` | `chart/values.yaml` |
| `database` | `dsearchtree` | `chart/values.yaml` |

Redis uses the corresponding `DAT_REDIS_*` variables in `.env` and
`secrets.datRedis` in `chart/values-secret.yaml`. Never commit either password.

`chart/values.yaml` also holds the parts that are not environment specific: the
datasource shape, the discovery and REST CRUD configuration, and the four SQL
controllers behind the search tree. Both secret files are git-ignored.

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

The layer-one DAT API is available at <http://localhost:3333>, the Redis-backed
layer-two proxy at <http://localhost:3334>, and the demo UI at
<http://localhost:4000>. The first API startup generates the LoopBack models and
controllers and can take approximately two minutes. Layer two uses layer one's
internal OpenAPI URL, caches responses for 6,000,000 ms, and enables MCP.

Gruim is used for the browse tab, which loads
`AppCache/dsearchtreeDatecode2` from the layer-two Gruim over module federation. The
search screens call the same cached Grapi through the `/dsearchtree` prefix.
The module is imported on demand and the tab explains itself when the remote is
absent, as in local Docker runs.

## API behavior

In `grpl/loopback:0.4.25`, a SQL controller whose query carries no `${...}`
placeholder generates a method parameter that is never decorated for dependency
injection, so every request fails with 500. This affects `vehicleTypes`,
`brands`, `modelRangeByVehicleType`, `gearboxTypes` and `bodyTypes` from the
original command, while every parameterised controller works. The chart
therefore declares `vehicleTypes` with a `FZA like "${FZA}"` filter and the UI
calls it with `%`; it falls back to the five known DAT categories if the call
still fails.

Fuzzy search uses the generated DAT endpoint at
`/dsearchtree/datecode2s/fuzzy/{searchTerm}`. The optional FZA, HST, OTG, HT and
UT criteria are independent; the API receives them as a filter and the UI also
applies them to the returned fuzzy results for compatibility with Grapi 0.4.25.

## Grapple cluster development

Create the git-ignored Helm values override before starting DevSpace. It carries
the DAT database and Redis connection details; their non-secret defaults come
from `chart/values.yaml`.

```sh
cp chart/values-secret.example.yaml chart/values-secret.yaml
# Edit chart/values-secret.yaml with the DAT database and Redis credentials.
grpl dev ns <namespace>
devspace dev
```

`devspace.yaml` lists this file under `valuesFiles`, so DevSpace stops with
`Error stating override file ... no such file or directory` when it is missing.

The values render into separate `dat-db-config` and `dat-layer2-config` Secrets.
Layer one uses MySQL; the `grascache` layer uses Redis, consumes layer one's
internal OpenAPI endpoint, caches it, and enables MCP. No credential lives in a
committed file.

Helm's own commands need the cluster lookups disabled to run offline, in this
chart and in the other Grapple demos alike:

```sh
helm lint ./chart --set lookup.enabled=false --set ingress.enabled=false
```

## Validation

```sh
pnpm build
pnpm typecheck
pnpm exec playwright install --with-deps   # first run only
pnpm test
```

The Playwright tests stub every API response, so they cover the screens but not
the DAT integration. Verify that against a running API.

## Secrets

Never commit DAT database or Redis credentials. Keep them in the git-ignored
`.env` and `chart/values-secret.yaml`, and use the platform's secret store
outside local development. Any credential shared in plain text should be
rotated before deployment.
