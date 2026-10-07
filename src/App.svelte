<script lang="ts">
  import { onMount } from "svelte";
  import FilterSelect from "./FilterSelect.svelte";
  import VehicleTable from "./VehicleTable.svelte";
  import {
    emptyCriteria,
    findVehicles,
    fuzzySearchVehicles,
    loadAllBrands,
    loadAllModelGroups,
    loadAllModelRanges,
    loadAllModels,
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
  let treeSearched = false;
  let treeError = "";

  let fuzzyCriteria = emptyCriteria();
  let fuzzyBrands: Option[] = [];
  let fuzzyRanges: Option[] = [];
  let fuzzyGroups: Option[] = [];
  let fuzzyModels: Option[] = [];
  let fuzzyText = "";
  let fuzzyLoading = "";
  let fuzzyResults: Vehicle[] = [];
  let fuzzySearched = false;
  let fuzzyError = "";

  onMount(async () => {
    try {
      [vehicleTypes, fuzzyBrands, fuzzyRanges, fuzzyGroups, fuzzyModels] = await Promise.all([
        loadVehicleTypes(),
        loadAllBrands(),
        loadAllModelRanges(),
        loadAllModelGroups(),
        loadAllModels(),
      ]);
    } catch (error) {
      startupError = message(error);
    } finally {
      initialLoading = false;
    }
  });

  const message = (error: unknown) => error instanceof Error ? error.message : "The DAT API request failed.";

  const resetAfter = (criteria: Criteria, field: keyof Criteria) => {
    const order: (keyof Criteria)[] = ["fza", "hst", "otg", "ht", "ut"];
    order.slice(order.indexOf(field) + 1).forEach((key) => criteria[key] = "");
  };

  const treeFzaChanged = async () => {
    resetAfter(treeCriteria, "fza");
    treeBrands = []; treeRanges = []; treeGroups = []; treeModels = []; treeResults = []; treeSearched = false;
    if (!treeCriteria.fza) return;
    treeLoading = "hst"; treeError = "";
    try { treeBrands = await loadBrands(treeCriteria.fza); } catch (error) { treeError = message(error); }
    finally { treeLoading = ""; }
  };

  const treeHstChanged = async () => {
    resetAfter(treeCriteria, "hst");
    treeRanges = []; treeGroups = []; treeModels = []; treeResults = []; treeSearched = false;
    if (!treeCriteria.hst) return;
    treeLoading = "otg"; treeError = "";
    try { treeRanges = await loadModelRanges(treeCriteria.fza, treeCriteria.hst); } catch (error) { treeError = message(error); }
    finally { treeLoading = ""; }
  };

  const treeOtgChanged = async () => {
    resetAfter(treeCriteria, "otg");
    treeGroups = []; treeModels = []; treeResults = []; treeSearched = false;
    if (!treeCriteria.otg) return;
    treeLoading = "ht"; treeError = "";
    try { treeGroups = await loadModelGroups(treeCriteria.fza, treeCriteria.hst, treeCriteria.otg); } catch (error) { treeError = message(error); }
    finally { treeLoading = ""; }
  };

  const treeHtChanged = async () => {
    resetAfter(treeCriteria, "ht");
    treeModels = []; treeResults = []; treeSearched = false;
    if (!treeCriteria.ht) return;
    treeLoading = "ut"; treeError = "";
    try { treeModels = await loadModels(treeCriteria.fza, treeCriteria.hst, treeCriteria.ht); } catch (error) { treeError = message(error); }
    finally { treeLoading = ""; }
  };

  const runTreeSearch = async () => {
    treeLoading = "results"; treeError = ""; treeSearched = true;
    try { treeResults = await findVehicles(treeCriteria); } catch (error) { treeError = message(error); treeResults = []; }
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

<main class="min-h-screen bg-slate-50 text-slate-900">
  <header class="border-b border-slate-200 bg-white">
    <div class="mx-auto max-w-7xl px-6 py-7">
      <p class="text-sm font-semibold uppercase tracking-widest text-blue-700">DAT demo</p>
      <h1 class="mt-1 text-3xl font-bold">Vehicle search</h1>
      <p class="mt-2 text-slate-600">Find DAT vehicles through the structured search tree or a fuzzy description.</p>
    </div>
  </header>

  <div class="mx-auto max-w-7xl px-6 py-8">
    <nav class="mb-8 flex gap-2" aria-label="Search modes">
      <button class="rounded-lg px-4 py-2 text-sm font-semibold {view === 'tree' ? 'bg-blue-700 text-white' : 'bg-white text-slate-700 shadow-sm'}" on:click={() => view = "tree"}>Search tree</button>
      <button class="rounded-lg px-4 py-2 text-sm font-semibold {view === 'fuzzy' ? 'bg-blue-700 text-white' : 'bg-white text-slate-700 shadow-sm'}" on:click={() => view = "fuzzy"}>Fuzzy search</button>
      <button class="rounded-lg px-4 py-2 text-sm font-semibold {view === 'browse' ? 'bg-blue-700 text-white' : 'bg-white text-slate-700 shadow-sm'}" on:click={openBrowse}>Browse data</button>
    </nav>

    {#if startupError}
      <div role="alert" class="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">DAT API unavailable: {startupError}</div>
    {/if}

    {#if view === "tree"}
      <section aria-labelledby="tree-title">
        <div class="mb-6">
          <h2 id="tree-title" class="text-2xl font-bold">Structured vehicle selection</h2>
          <p class="mt-1 text-slate-600">Choose each criterion from left to right, then list the matching vehicles.</p>
        </div>
        <div class="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
          <div on:change={treeFzaChanged}><FilterSelect id="tree-fza" label="FZA" bind:value={treeCriteria.fza} options={vehicleTypes} loading={initialLoading} /></div>
          <div on:change={treeHstChanged}><FilterSelect id="tree-hst" label="HST" bind:value={treeCriteria.hst} options={treeBrands} disabled={!treeCriteria.fza} loading={treeLoading === "hst"} /></div>
          <div on:change={treeOtgChanged}><FilterSelect id="tree-otg" label="OTG" bind:value={treeCriteria.otg} options={treeRanges} disabled={!treeCriteria.hst} loading={treeLoading === "otg"} /></div>
          <div on:change={treeHtChanged}><FilterSelect id="tree-ht" label="HT" bind:value={treeCriteria.ht} options={treeGroups} disabled={!treeCriteria.otg} loading={treeLoading === "ht"} /></div>
          <FilterSelect id="tree-ut" label="UT" bind:value={treeCriteria.ut} options={treeModels} disabled={!treeCriteria.ht} loading={treeLoading === "ut"} />
          <div class="sm:col-span-2 lg:col-span-5">
            <button class="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!treeCriteria.ut || treeLoading === "results"} on:click={runTreeSearch}>
              {treeLoading === "results" ? "Loading vehicles…" : "Show vehicles"}
            </button>
          </div>
        </div>
        {#if treeError}<p role="alert" class="mt-4 text-sm text-red-700">{treeError}</p>{/if}
        <div class="mt-8">
          {#if treeSearched && !treeLoading && !treeResults.length && !treeError}<p class="rounded-lg bg-white p-6 text-center text-slate-500">No matching vehicles.</p>{/if}
          {#if treeResults.length}<p class="mb-3 text-sm font-medium text-slate-600">{treeResults.length} vehicle{treeResults.length === 1 ? "" : "s"} shown</p>{/if}
          <VehicleTable vehicles={treeResults} />
        </div>
      </section>
    {:else if view === "fuzzy"}
      <section aria-labelledby="fuzzy-title">
        <div class="mb-6">
          <h2 id="fuzzy-title" class="text-2xl font-bold">Fuzzy vehicle search</h2>
          <p class="mt-1 text-slate-600">Enter any vehicle text and optionally narrow it with DAT criteria.</p>
        </div>
        <form class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" on:submit|preventDefault={runFuzzySearch}>
          <label class="block" for="fuzzy-text">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Fuzzy text</span>
            <input id="fuzzy-text" bind:value={fuzzyText} placeholder="e.g. BMW diesel automatic" class="w-full rounded-lg border border-slate-300 px-4 py-3 shadow-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
          </label>
          <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <FilterSelect id="fuzzy-fza" label="FZA" bind:value={fuzzyCriteria.fza} options={vehicleTypes} loading={initialLoading} optional />
            <FilterSelect id="fuzzy-hst" label="HST" bind:value={fuzzyCriteria.hst} options={fuzzyBrands} loading={initialLoading} optional />
            <FilterSelect id="fuzzy-otg" label="OTG" bind:value={fuzzyCriteria.otg} options={fuzzyRanges} loading={initialLoading} optional />
            <FilterSelect id="fuzzy-ht" label="HT" bind:value={fuzzyCriteria.ht} options={fuzzyGroups} loading={initialLoading} optional />
            <FilterSelect id="fuzzy-ut" label="UT" bind:value={fuzzyCriteria.ut} options={fuzzyModels} loading={initialLoading} optional />
          </div>
          <button type="submit" class="mt-5 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!fuzzyText.trim() || fuzzyLoading === "results"}>
            {fuzzyLoading === "results" ? "Searching…" : "Find vehicles"}
          </button>
        </form>
        {#if fuzzyError}<p role="alert" class="mt-4 text-sm text-red-700">{fuzzyError}</p>{/if}
        <div class="mt-8">
          {#if fuzzySearched && !fuzzyLoading && !fuzzyResults.length && !fuzzyError}<p class="rounded-lg bg-white p-6 text-center text-slate-500">No matching vehicles.</p>{/if}
          {#if fuzzyResults.length}<p class="mb-3 text-sm font-medium text-slate-600">{fuzzyResults.length} vehicle{fuzzyResults.length === 1 ? "" : "s"} shown</p>{/if}
          <VehicleTable vehicles={fuzzyResults} />
        </div>
      </section>
    {:else}
      <section aria-labelledby="browse-title">
        <div class="mb-6">
          <h2 id="browse-title" class="text-2xl font-bold">All DAT vehicles</h2>
          <p class="mt-1 text-slate-600">The full datecode2 table through the generated Grapple admin module, with filtering and paging.</p>
        </div>
        {#if browseLoading}
          <p class="rounded-lg bg-white p-6 text-center text-slate-500">Loading the generated module…</p>
        {:else if browseError}
          <p role="alert" class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            The generated module could not be loaded: {browseError}. It is served by gruim, so this tab only works in a Grapple deployment.
          </p>
        {:else if BrowseAdmin}
          <svelte:component this={BrowseAdmin} schema={browseSchema} translations={browseTranslations} enableFilter={true} enableClearFilter={true} enableLoadMore={true} />
        {/if}
      </section>
    {/if}
  </div>
</main>
