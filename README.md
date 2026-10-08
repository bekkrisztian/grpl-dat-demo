# Grapple DAT demo

A Grapple/Svelte demo for DAT vehicle selection and fuzzy vehicle search.

## Scope

- Cascading vehicle search: `FZA → HST → OTG → HT → UT`
- Vehicle result list
- Fuzzy search using any of the available vehicle criteria
- A browse tab that embeds the layer-one Gruim admin module for `datecode2`

Vehicle queries go through the Redis-backed layer-two API, which caches layer
one's OpenAPI proxy and serves the MCP endpoint. The search tree's option lists
address layer one directly: layer two's generated client repeats the `where`
parameter on SQL controller paths, so a positional call drops `sqlParams` and
every lookup comes back empty.

## Project structure

```text
grpl-dat-demo/
├── chart/
│   ├── templates/          # Application, MySQL, Redis and Grapple resources
│   └── values.yaml         # Layer-one, cache and Gruim configuration
├── data/
│   └── datecode2.sql.gz    # DAT database seed
├── grases/
│   ├── gras/
│   │   ├── grapi/          # Layer-one controllers and generated-code patches
│   │   └── gruim/          # Gruim bulk-fetch protection
│   └── grascache/          # Cache-layer extensions
├── src/                    # Svelte vehicle-search application
├── tests/                  # Playwright UI tests
├── docker-compose.yaml     # Local two-layer API setup
├── devspace.yaml           # Grapple development workflow
└── Taskfile.yaml           # Patch injection and deployment helpers
```

## What you have to configure

Where the data lives depends on how you run the demo.

**In a cluster, nothing.** The chart provisions its own MySQL and Redis through
KubeBlocks and seeds `dsearchtree.datecode2` from `data/datecode2.sql.gz`, which
is 3.4 MB in the repository and 142 MB once loaded. The `init-db` container only
seeds when the table is empty, so a restart costs nothing; a first load takes
about 30 seconds. Database credentials are generated into the
`dat-demo-db-mysql-account-root` secret, so none of them belong in a file here.

**With Docker Compose, an external DAT database.** Compose starts the two APIs
and the frontend but no database, so `.env` has to point at one:

| variable | default |
| --- | --- |
| `DAT_DB_HOST`, `DAT_DB_USER`, `DAT_DB_PASSWORD` | none |
| `DAT_DB_PORT` | `3306` |
| `DAT_DB_NAME` | `dsearchtree` |
| `DAT_REDIS_HOST`, `DAT_REDIS_PASSWORD` | none |
| `DAT_REDIS_PORT`, `DAT_REDIS_USER`, `DAT_REDIS_DB` | `6379`, `default`, `0` |

`.env` is git-ignored. Never commit a DAT database or Redis password, and rotate
anything that has been shared in plain text.

Everything that is not environment specific lives in `chart/values.yaml`: the
datasource shape, discovery and REST CRUD configuration, the fuzzy search
configuration, the nine SQL controllers, and the bulk-fetch bounds described
under [Staying inside the memory budget](#staying-inside-the-memory-budget).

## Local frontend development

Requirements: Node.js 22 and pnpm 9.15.9.

```sh
cp .env.example .env
# When the APIs run locally, also set:
# SVELTE_APP_TREE_API_URL=http://localhost:3333
pnpm install --frozen-lockfile
pnpm dev
```

The frontend is available at <http://localhost:4000>.
`SVELTE_APP_API_URL` must point to the cached API including its `/dsearchtree`
prefix; `SVELTE_APP_TREE_API_URL` points to layer one without a path prefix.

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

The browse tab loads `App/Datecode2` from the layer-one Gruim over module
federation, and the module is imported on demand so the tab can explain itself
when the remote is absent, as in local Docker runs. Vehicle queries go to the
cached Grapi through the `/dsearchtree` prefix; the search tree's option lists
go straight to layer one on `SVELTE_APP_TREE_API_URL`, for the reason given
under [Scope](#scope).

## API behavior

In `grpl/loopback:0.4.25`, a SQL controller whose query carries no `${...}`
placeholder generates a method parameter that is never decorated for dependency
injection, so every request fails with 500. This affects `vehicleTypes`,
`brands`, `modelRangeByVehicleType`, `gearboxTypes` and `bodyTypes` from the
original command, while every parameterised controller works. The chart
therefore declares `vehicleTypes` with a `FZA like "${FZA}"` filter and the UI
calls it with `%`; it falls back to the five known DAT categories if the call
still fails.

The option lists behind HST, OTG, HT and UT are search driven. They query from
the second character, debounced by 250 ms, and the previous request is aborted
when the next keystroke arrives. Each query splits its name and code branches
into a `UNION` so both can use an index: an `OR` across two columns makes MySQL
abandon the range scan and read the whole index, which measured 1.324 s against
0.021 s for the same search. The matching indexes are created beside the seed,
only when absent.

Fuzzy search uses `/dsearchtrees/datecode2s/fuzzy/{searchTerm}` on layer one and
`/dsearchtree/dsearchtrees/datecode2s/fuzzy/{searchTerm}` through the cache
prefix. Its configuration must include `databaseName: dsearchtree`; otherwise
the generated controller produces the invalid table name `.datecode2`. The
`bound-fuzzy-search` postpatch routes the query through the repository so the
criteria and the limit are applied instead of running an unbounded raw query.

## Staying inside the memory budget

`datecode2` holds 570,518 rows and the API's heap is capped at 2048 MB. It
materialises every row it is asked for -- 5,000 rows cost 73 MB, so roughly
140,000 rows exhaust it -- and when it dies, nodemon survives it: the pod stays
`Running` with nothing listening, and the browser sees a 502. Reviving it costs
one `touch` of a watched file rather than a pod delete:

```sh
kubectl -n <namespace> exec deploy/<release>-gras-grapi-devspace -c grapi \
  -- touch dist/index.js
```

Two changes keep requests away from that ceiling.

The UI asks for one page at a time. A single vehicle type matches 152,070 rows,
so the result table pages at 100 and shows the true total beside the range.

Gruim's "Select all" and its two export buttons each sent one request with no
limit. `grases/gras/gruim/prepatches/page-bulk-fetches.sh` rewrites them to walk
the table in pages, and warns rather than returning a truncated export when it
stops at the ceiling:

| key in `config.global` | default |
| --- | --- |
| `fetch-page-size` | 1000 |
| `max-records` | 50000 |

`task patch-values-file` base64-encodes the Gruim prepatch into the Helm values
before deployment. The reset task clears that generated content afterwards, so
the committed values file stays readable. A patch that cannot find the expected
Gruim source exits non-zero instead of silently leaving the unsafe bulk request
in place.

## Grapple cluster development

```sh
grpl dev ns <namespace>
devspace dev
```

There is no secret file to prepare: the chart brings its own MySQL and Redis,
and the generated credentials never leave the cluster.

DevSpace forwards the demo UI to port `4000`, layer-one Grapi to `3000`, the
cached Grapi to `3001`, and Gruim to `8080`.

Layer one serves MySQL. The `grascache` layer consumes layer one's internal
OpenAPI endpoint, caches it in Redis and enables MCP. Its datasource is named
`redis` rather than `redisDS` because a Crossplane `ManagedDataSource` name has
to be an RFC 1123 subdomain, and an uppercase letter makes the release fail.

The cache layer carries no Gruim of its own. Its OpenAPI spec duplicates the
`where` parameter on every SQL controller path, which fails Gruim's Swagger
validation outright and, through the generated client, silently empties the
option lists. Both are generator bugs; until they are fixed the browse tab loads
`App/Datecode2` from layer one.

After a `helm upgrade`, the short `gras-grapi` service can end up selecting on a
`helm.sh/revision` the running pods no longer carry, leaving it with no
endpoints. Gruim's init container waits on exactly that service, so it sits in
`Init:0/1` for its full 30 minute timeout. Dropping the label from the selector
restores it without touching a pod:

```sh
kubectl -n <namespace> patch svc gras-grapi --type=json \
  -p '[{"op":"remove","path":"/spec/selector/helm.sh~1revision"}]'
```

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

The three Playwright tests stub every API response, so they cover the screens but
not the DAT integration. Verify that against a running API. They start their own
dev server on port 4010, away from the one `pnpm dev` uses, because a server
left running on the shared port is reused without the test environment and every
mocked call then misses.

## Secrets

In a cluster the demo generates its own credentials and none belong in the
repository. For Docker Compose, keep the DAT database and Redis settings in the
git-ignored `.env`, use the platform's secret store outside local development,
and rotate anything that has been shared in plain text.
