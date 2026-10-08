<script lang="ts">
  import { onMount } from "svelte";
  import FilterSelect from "./FilterSelect.svelte";
  import SearchableFilter from "./SearchableFilter.svelte";
  import VehicleTable from "./VehicleTable.svelte";
  import { adminModuleCss } from "./gruimTheme";
  import {
    emptyCriteria,
    countVehicles,
    findVehicles,
    fuzzySearchVehicles,
    PAGE_SIZE,
    searchBrands,
    searchModelGroups,
    searchModelRanges,
    searchModels,
    loadBrands,
    loadModelGroups,
    loadModelRanges,
    loadModels,
    loadVehicleTypes,
    type Criteria,
    type Option,
    type Vehicle,
  } from "./api";

  type View = "tree" | "fuzzy" | "browse";

  let view: View = "tree";
  let vehicleTypes: Option[] = [];
  let initialLoading = true;
  let startupError = "";

  // The generated gruim admin module for the discovered datecode2 table. It is
  // loaded on demand so the search screens work without the remote.
  let BrowseAdmin: any = null;
  let browseLoading = false;
  let browseError = "";

  const browseSchema = {
    "field-properties": {
      "field-order": [
        "dateCode", "fzab", "hstb", "otgb", "htb", "utb",
        "avMoB", "ccm", "kw", "antr", "ab",
      ],
      "hidden-fields": [
        "fza", "hst", "ht", "ut", "otg", "avMo", "avKa", "avGe",
        "aZyl", "ats", "rSt", "kSt", "kZbewert", "kZkalk", "kzGlas",
        "globalSearch",
      ],
    },
  };

  const browseTranslations = {
    dateCode: "Date code",
    fzab: "Vehicle type",
    hstb: "Manufacturer",
    otgb: "Model range",
    htb: "Model group",
    utb: "Model",
    avMoB: "Engine",
    ccm: "Displacement",
    kw: "Power (kW)",
    antr: "Drive",
    ab: "Body",
  };

  const openBrowse = async () => {
    view = "browse";
    if (BrowseAdmin || browseLoading) return;
    browseLoading = true;
    browseError = "";
    try {
      // The layer two spec repeats the where parameter on every SQL controller
      // path, so its gruim cannot generate modules. Until that is fixed the
      // admin module comes from layer one; the search API still uses the cache.
      BrowseAdmin = (await import("App/Datecode2")).default;
    } catch (error) {
      browseError = message(error);
    } finally {
      browseLoading = false;
    }
  };

  let treeCriteria = emptyCriteria();
  let treeBrands: Option[] = [];
  let treeRanges: Option[] = [];
  let treeGroups: Option[] = [];
  let treeModels: Option[] = [];
  let treeLoading = "";
  let treeResults: Vehicle[] = [];
  let treeTotal = 0;
  let treePage = 1;
  let treeSearched = false;
  let treeError = "";

  let fuzzyCriteria = emptyCriteria();
  let fuzzyText = "";
  let fuzzyLoading = "";
  let fuzzyResults: Vehicle[] = [];
  let fuzzySearched = false;
  let fuzzyError = "";

  onMount(async () => {
    try {
      vehicleTypes = await loadVehicleTypes();
    } catch (error) {
      startupError = message(error);
    } finally {
      initialLoading = false;
    }
  });

  const message = (error: unknown) => error instanceof Error ? error.message : "The DAT API request failed.";

  // Returns the object so the caller can reassign it: mutating a property does
  // not reach the bound child, which would then hold a value its options no
  // longer offer and render the select blank.
  const resetAfter = (criteria: Criteria, field: keyof Criteria) => {
    const order: (keyof Criteria)[] = ["fza", "hst", "otg", "ht", "ut"];
    order.slice(order.indexOf(field) + 1).forEach((key) => criteria[key] = "");
    return { ...criteria };
  };

  const treeFzaChanged = async () => {
    treeCriteria = resetAfter(treeCriteria, "fza");
    treeBrands = []; treeRanges = []; treeGroups = []; treeModels = []; clearTreeResults();
    if (!treeCriteria.fza) return;
    treeLoading = "hst"; treeError = "";
    try { treeBrands = await loadBrands(treeCriteria.fza); } catch (error) { treeError = message(error); }
    finally { treeLoading = ""; }
  };

  const treeHstChanged = async () => {
    treeCriteria = resetAfter(treeCriteria, "hst");
    treeRanges = []; treeGroups = []; treeModels = []; clearTreeResults();
    if (!treeCriteria.hst) return;
    treeLoading = "otg"; treeError = "";
    try { treeRanges = await loadModelRanges(treeCriteria.fza, treeCriteria.hst); } catch (error) { treeError = message(error); }
    finally { treeLoading = ""; }
  };

  const treeOtgChanged = async () => {
    treeCriteria = resetAfter(treeCriteria, "otg");
    treeGroups = []; treeModels = []; clearTreeResults();
    if (!treeCriteria.otg) return;
    treeLoading = "ht"; treeError = "";
    try { treeGroups = await loadModelGroups(treeCriteria.fza, treeCriteria.hst, treeCriteria.otg); } catch (error) { treeError = message(error); }
    finally { treeLoading = ""; }
  };

  const treeHtChanged = async () => {
    treeCriteria = resetAfter(treeCriteria, "ht");
    treeModels = []; clearTreeResults();
    if (!treeCriteria.ht) return;
    treeLoading = "ut"; treeError = "";
    try { treeModels = await loadModels(treeCriteria.fza, treeCriteria.hst, treeCriteria.ht); } catch (error) { treeError = message(error); }
    finally { treeLoading = ""; }
  };

  // The four cascade handlers each cleared the rows but left the count and the
  // page behind, so the pager kept offering pages for a search that was gone.
  const clearTreeResults = () => {
    treeResults = []; treeTotal = 0; treePage = 1; treeSearched = false;
  };

  const clearTree = () => {
    treeCriteria = emptyCriteria();
    treeBrands = []; treeRanges = []; treeGroups = []; treeModels = [];
    clearTreeResults(); treeError = "";
  };

  const runTreeSearch = async () => {
    treePage = 1;
    treeLoading = "results"; treeError = ""; treeSearched = true;
    try {
      // The count is cheap once the criteria narrow the set, and it is what
      // turns a page number into a position the reader can trust.
      [treeResults, treeTotal] = await Promise.all([
        findVehicles(treeCriteria),
        countVehicles(treeCriteria),
      ]);
    } catch (error) {
      treeError = message(error); treeResults = []; treeTotal = 0;
    } finally { treeLoading = ""; }
  };

  $: treePages = Math.max(1, Math.ceil(treeTotal / PAGE_SIZE));

  const goToTreePage = async (page: number) => {
    if (page < 1 || page > treePages || page === treePage || treeLoading) return;
    treeLoading = "results"; treeError = "";
    try {
      treeResults = await findVehicles(treeCriteria, (page - 1) * PAGE_SIZE);
      treePage = page;
    } catch (error) { treeError = message(error); }
    finally { treeLoading = ""; }
  };

  const runFuzzySearch = async () => {
    if (!fuzzyText.trim()) return;
    fuzzyLoading = "results"; fuzzyError = ""; fuzzySearched = true;
    try { fuzzyResults = await fuzzySearchVehicles(fuzzyText, fuzzyCriteria); } catch (error) { fuzzyError = message(error); fuzzyResults = []; }
    finally { fuzzyLoading = ""; }
  };

</script>

<svelte:head><title>DAT vehicle search demo</title></svelte:head>

<main class="min-h-screen bg-app-bg text-app-ink antialiased">
  <header class="sticky top-0 z-20 border-b border-app-line bg-app-bg/85 backdrop-blur">
    <div class="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-4 px-6 py-4">
      <div class="flex items-center gap-3">
        <span class="grid h-9 w-9 place-items-center rounded-xl bg-app-accent text-sm font-bold text-app-accent-ink">DAT</span>
        <div class="leading-tight">
          <h1 class="text-base font-semibold">Vehicle search</h1>
          <p class="text-xs text-app-muted">Structured tree, fuzzy text and the raw table</p>
        </div>
      </div>

      <nav class="ml-auto inline-flex rounded-xl border border-app-line bg-app-surface p-1 shadow-sm" aria-label="Search modes">
        <button
          class="rounded-lg px-3.5 py-1.5 text-sm font-medium transition {view === 'tree' ? 'bg-app-accent text-app-accent-ink shadow-sm' : 'text-app-muted hover:text-app-ink'}"
          on:click={() => view = "tree"}>Search tree</button>
        <button
          class="rounded-lg px-3.5 py-1.5 text-sm font-medium transition {view === 'fuzzy' ? 'bg-app-accent text-app-accent-ink shadow-sm' : 'text-app-muted hover:text-app-ink'}"
          on:click={() => view = "fuzzy"}>Fuzzy search</button>
        <button
          class="rounded-lg px-3.5 py-1.5 text-sm font-medium transition {view === 'browse' ? 'bg-app-accent text-app-accent-ink shadow-sm' : 'text-app-muted hover:text-app-ink'}"
          on:click={openBrowse}>Browse data</button>
      </nav>
    </div>
  </header>

  <div class="mx-auto max-w-7xl px-6 py-10">
    {#if startupError}
      <div role="alert" class="mb-8 flex items-start gap-3 rounded-xl border border-app-danger/30 bg-app-danger-soft px-4 py-3 text-sm text-app-danger">
        <span class="mt-0.5 font-semibold">DAT API unavailable</span>
        <span class="text-app-danger/80">{startupError}</span>
      </div>
    {/if}

    {#if view === "tree"}
      <section aria-labelledby="tree-title">
        <div class="mb-7 max-w-2xl">
          <h2 id="tree-title" class="text-3xl font-bold tracking-tight">Structured vehicle selection</h2>
          <p class="mt-2 text-app-muted">Narrow from left to right. You can list the vehicles at any depth, from the vehicle type down to a single model.</p>
        </div>

        <div class="rounded-2xl border border-app-line bg-app-surface p-6 shadow-sm">
          <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
            <div class="lg:col-span-2" on:change={treeFzaChanged}><FilterSelect id="tree-fza" label="FZA" bind:value={treeCriteria.fza} options={vehicleTypes} loading={initialLoading} /></div>
            <div on:change={treeHstChanged}><FilterSelect id="tree-hst" label="HST" bind:value={treeCriteria.hst} options={treeBrands} disabled={!treeCriteria.fza} loading={treeLoading === "hst"} /></div>
            <div on:change={treeOtgChanged}><FilterSelect id="tree-otg" label="OTG" bind:value={treeCriteria.otg} options={treeRanges} disabled={!treeCriteria.hst} loading={treeLoading === "otg"} /></div>
            <div on:change={treeHtChanged}><FilterSelect id="tree-ht" label="HT" bind:value={treeCriteria.ht} options={treeGroups} disabled={!treeCriteria.otg} loading={treeLoading === "ht"} /></div>
            <FilterSelect id="tree-ut" label="UT" bind:value={treeCriteria.ut} options={treeModels} disabled={!treeCriteria.ht} loading={treeLoading === "ut"} />
          </div>

          <div class="mt-6 flex flex-wrap items-center gap-3 border-t border-app-line pt-5">
            <button
              class="rounded-xl bg-app-accent px-5 py-2.5 text-sm font-semibold text-app-accent-ink shadow-sm transition hover:bg-app-accent-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-app-accent/25 disabled:cursor-not-allowed disabled:border disabled:border-app-line disabled:bg-app-sunken disabled:text-app-muted disabled:shadow-none"
              disabled={!treeCriteria.fza || treeLoading === "results"} on:click={runTreeSearch}>
              {treeLoading === "results" ? "Loading vehicles…" : "Show vehicles"}
            </button>
            {#if treeCriteria.fza}
              <button class="rounded-xl px-3 py-2 text-sm font-medium text-app-muted transition hover:text-app-ink" on:click={clearTree}>Clear</button>
            {/if}
          </div>
        </div>

        {#if treeError}<p role="alert" class="mt-4 text-sm text-app-danger">{treeError}</p>{/if}

        <div class="mt-8">
          {#if treeSearched && !treeLoading && !treeResults.length && !treeError}
            <p class="rounded-2xl border border-dashed border-app-line bg-app-surface/60 p-10 text-center text-app-muted">No vehicles match these criteria.</p>
          {/if}
          <VehicleTable vehicles={treeResults} total={treeTotal} offset={(treePage - 1) * PAGE_SIZE} />
          {#if treeResults.length && treePages > 1}
            <nav class="mt-4 flex items-center justify-between gap-4" aria-label="Result pages">
              <button class="rounded-xl border border-app-line bg-app-surface px-4 py-2 text-sm font-semibold text-app-ink shadow-sm transition hover:border-app-line-strong disabled:cursor-not-allowed disabled:text-app-muted/50 disabled:shadow-none" disabled={treePage === 1 || !!treeLoading} on:click={() => goToTreePage(treePage - 1)}>Previous</button>
              <span class="text-sm text-app-muted">Page <span class="font-semibold text-app-ink">{treePage.toLocaleString("en-US")}</span> of {treePages.toLocaleString("en-US")}</span>
              <button class="rounded-xl border border-app-line bg-app-surface px-4 py-2 text-sm font-semibold text-app-ink shadow-sm transition hover:border-app-line-strong disabled:cursor-not-allowed disabled:text-app-muted/50 disabled:shadow-none" disabled={treePage === treePages || !!treeLoading} on:click={() => goToTreePage(treePage + 1)}>Next</button>
            </nav>
          {/if}
        </div>
      </section>

    {:else if view === "fuzzy"}
      <section aria-labelledby="fuzzy-title">
        <div class="mb-7 max-w-2xl">
          <h2 id="fuzzy-title" class="text-3xl font-bold tracking-tight">Fuzzy vehicle search</h2>
          <p class="mt-2 text-app-muted">Describe the vehicle in your own words. Narrow it with any of the DAT criteria, in any combination.</p>
        </div>

        <form class="rounded-2xl border border-app-line bg-app-surface p-6 shadow-sm" on:submit|preventDefault={runFuzzySearch}>
          <label class="block" for="fuzzy-text">
            <span class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-app-muted">Fuzzy text</span>
            <input id="fuzzy-text" bind:value={fuzzyText} placeholder="e.g. BMW diesel automatic"
              class="w-full rounded-xl border border-app-line bg-app-surface px-4 py-3 text-base text-app-ink shadow-sm outline-none transition placeholder:text-app-muted/60 hover:border-app-line-strong focus-visible:border-app-accent focus-visible:ring-4 focus-visible:ring-app-accent/15" />
          </label>

          <div class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
            <div class="lg:col-span-2"><FilterSelect id="fuzzy-fza" label="FZA" bind:value={fuzzyCriteria.fza} options={vehicleTypes} loading={initialLoading} optional /></div>
            <SearchableFilter id="fuzzy-hst" label="HST" bind:value={fuzzyCriteria.hst} loadOptions={searchBrands} />
            <SearchableFilter id="fuzzy-otg" label="OTG" bind:value={fuzzyCriteria.otg} loadOptions={searchModelRanges} />
            <SearchableFilter id="fuzzy-ht" label="HT" bind:value={fuzzyCriteria.ht} loadOptions={searchModelGroups} />
            <SearchableFilter id="fuzzy-ut" label="UT" bind:value={fuzzyCriteria.ut} loadOptions={searchModels} />
          </div>

          <div class="mt-6 border-t border-app-line pt-5">
            <button type="submit"
              class="rounded-xl bg-app-accent px-5 py-2.5 text-sm font-semibold text-app-accent-ink shadow-sm transition hover:bg-app-accent-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-app-accent/25 disabled:cursor-not-allowed disabled:border disabled:border-app-line disabled:bg-app-sunken disabled:text-app-muted disabled:shadow-none"
              disabled={!fuzzyText.trim() || fuzzyLoading === "results"}>
              {fuzzyLoading === "results" ? "Searching…" : "Find vehicles"}
            </button>
          </div>
        </form>

        {#if fuzzyError}<p role="alert" class="mt-4 text-sm text-app-danger">{fuzzyError}</p>{/if}

        <div class="mt-8">
          {#if fuzzySearched && !fuzzyLoading && !fuzzyResults.length && !fuzzyError}
            <p class="rounded-2xl border border-dashed border-app-line bg-app-surface/60 p-10 text-center text-app-muted">No vehicles match that description.</p>
          {/if}
          <VehicleTable vehicles={fuzzyResults} />
        </div>
      </section>

    {:else}
      <section aria-labelledby="browse-title">
        <div class="mb-7 max-w-2xl">
          <h2 id="browse-title" class="text-3xl font-bold tracking-tight">All DAT vehicles</h2>
          <p class="mt-2 text-app-muted">The full datecode2 table through the generated Grapple admin module, with filtering and paging.</p>
        </div>
        {#if browseLoading}
          <p class="rounded-2xl border border-dashed border-app-line bg-app-surface/60 p-10 text-center text-app-muted">Loading the generated module…</p>
        {:else if browseError}
          <p role="alert" class="rounded-2xl border border-app-danger/30 bg-app-danger-soft px-4 py-3 text-sm text-app-danger">
            The generated module could not be loaded: {browseError}. It is served by gruim, so this tab only works in a Grapple deployment.
          </p>
        {:else if BrowseAdmin}
          <svelte:component this={BrowseAdmin} css={adminModuleCss} schema={browseSchema} translations={browseTranslations} enableFilter={true} enableClearFilter={true} enableLoadMore={true} />
        {/if}
      </section>
    {/if}
  </div>
</main>
