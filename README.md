# Grapple DAT demo

A Grapple/Svelte demo for DAT vehicle selection and fuzzy vehicle search.

## Scope

- Cascading vehicle search: `FZA → HST → OTG → HT → UT`
- Vehicle result list
- Fuzzy search using any of the available vehicle criteria
- A browse tab that embeds the generated gruim admin module for `datecode2`

The demo contains both requested screens and talks directly to the DAT layer-one
LoopBack API. Only the API endpoints used by the screens are generated.

## What you have to configure

The demo reads an **existing** DAT MySQL database. It neither provisions nor
seeds one: the `datecode2` table holds roughly 570,000 rows, which is why the
data stays outside the repository.

Three values are environment specific and must be supplied; everything else is
already in `chart/values.yaml` and needs no change.

| value | default | where you set it |
| --- | --- | --- |
| `host` | none | `.env` (Docker) / `chart/values-secret.yaml` (Grapple) |
| `username` | none | same |
| `password` | none | same |
| `port` | `3306` | `chart/values.yaml` |
| `database` | `dsearchtree` | `chart/values.yaml` |

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

The DAT API is available at <http://localhost:3333> and the demo UI at
<http://localhost:4000>. The first API startup generates the LoopBack models and
controllers and can take approximately two minutes.

The layer-two cache proxy from the original setup is not required: the measured
endpoints answer in well under half a second, and its Redis host no longer
resolves. Bring it back only for the MCP endpoint it also provided, and point it
at an in-cluster Redis rather than the retired external one.

Gruim is used for the browse tab, which loads `App/Datecode2` over module
federation. The two search screens do not need it, so the module is imported on
demand and the tab explains itself when the remote is absent, as in local Docker
runs.

## API behavior

In `grpl/loopback:0.4.25`, a SQL controller whose query carries no `${...}`
placeholder generates a method parameter that is never decorated for dependency
injection, so every request fails with 500. This affects `vehicleTypes`,
`brands`, `modelRangeByVehicleType`, `gearboxTypes` and `bodyTypes` from the
original command, while every parameterised controller works. The chart
therefore declares `vehicleTypes` with a `FZA like "${FZA}"` filter and the UI
calls it with `%`; it falls back to the five known DAT categories if the call
still fails.

Fuzzy search uses a database-side, limited `globalSearch LIKE` query; the
generated fuzzy endpoint is not used because an unfiltered request loads the
full data set into memory.

Fuzzy results are ordered in the client. A leading wildcard cannot use an index,
so ordering in the database makes MySQL sort every match before the limit
applies, which took ten to twelve seconds against the full table.

## Grapple cluster development

Create the git-ignored Helm values override before starting DevSpace. It carries
only `host`, `username` and `password`; `port` and `database` come from
`chart/values.yaml`.

```sh
cp chart/values-secret.example.yaml chart/values-secret.yaml
# Edit chart/values-secret.yaml with the DAT database host and credentials.
grpl dev ns <namespace>
devspace dev
```

`devspace.yaml` lists this file under `valuesFiles`, so DevSpace stops with
`Error stating override file ... no such file or directory` when it is missing.

The values render into the `dat-db-config` Secret, which `grapi.extraSecrets`
mounts as environment variables. The datasource in `chart/values.yaml` then
resolves them through `$(host)`, `$(username)` and `$(password)` at container
start, which is why no credential ever lives in a committed file.

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

Never commit DAT database credentials. Keep them in the git-ignored `.env` and
`chart/values-secret.yaml`, and use the platform's secret store outside local
development. This repository is public, so the database host counts as a
credential too: the instance is reachable from the internet.
