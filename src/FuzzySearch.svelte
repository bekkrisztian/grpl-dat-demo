<script lang="ts">
  import FilterSelect from "./FilterSelect.svelte";
  import SearchableFilter from "./SearchableFilter.svelte";
  import VehicleTable from "./VehicleTable.svelte";
  import {
    countFuzzyVehicles, emptyCriteria, fuzzySearchVehicles, PAGE_SIZE, errorMessage as message,
    searchBrands, searchModelGroups, searchModelRanges, searchModels,
    type Option, type Vehicle,
  } from "./api";

  export let vehicleTypes: Option[] = [];
  export let initialLoading = false;

  let fuzzyCriteria = emptyCriteria();
  let fuzzyText = "";
  let fuzzyLoading = "";
  let fuzzyResults: Vehicle[] = [];
  let fuzzyPage = 1;
  let fuzzyTotal = 0;
  let fuzzyHasNext = false;
  let fuzzySearched = false;
  let fuzzyError = "";
  let fuzzyFiltersKey = 0;
  let fuzzyRequestId = 0;

  $: canClear = Boolean(
    fuzzyText || Object.values(fuzzyCriteria).some(Boolean) || fuzzySearched || fuzzyError,
  );

  const runFuzzySearch = async () => {
    if (!fuzzyText.trim()) return;
    fuzzyPage = 1;
    await loadFuzzyPage(1, true);
  };

  const loadFuzzyPage = async (page: number, refreshTotal = false) => {
    const requestId = ++fuzzyRequestId;
    fuzzyLoading = "results"; fuzzyError = ""; fuzzySearched = true;
    try {
      const [vehicles, total] = await Promise.all([
        fuzzySearchVehicles(fuzzyText, fuzzyCriteria, (page - 1) * PAGE_SIZE),
        refreshTotal ? countFuzzyVehicles(fuzzyText, fuzzyCriteria) : Promise.resolve(fuzzyTotal),
      ]);
      if (requestId !== fuzzyRequestId) return;
      fuzzyResults = vehicles;
      fuzzyTotal = total;
      fuzzyHasNext = page * PAGE_SIZE < total;
      fuzzyPage = page;
    } catch (error) {
      if (requestId !== fuzzyRequestId) return;
      fuzzyError = message(error); fuzzyResults = []; fuzzyHasNext = false; fuzzyTotal = 0;
    }
    finally { if (requestId === fuzzyRequestId) fuzzyLoading = ""; }
  };

  const goToFuzzyPage = (page: number) => {
    if (page < 1 || page === fuzzyPage || fuzzyLoading) return;
    return loadFuzzyPage(page);
  };

  const clearFuzzySearch = () => {
    fuzzyRequestId += 1;
    fuzzyText = "";
    fuzzyCriteria = emptyCriteria();
    fuzzyResults = [];
    fuzzyPage = 1;
    fuzzyTotal = 0;
    fuzzyHasNext = false;
    fuzzySearched = false;
    fuzzyError = "";
    fuzzyLoading = "";
    fuzzyFiltersKey += 1;
  };
</script>

  <section aria-labelledby="fuzzy-title">
    <div class="mb-7 max-w-2xl">
      <h2 id="fuzzy-title" class="text-3xl font-bold tracking-tight">Search by vehicle description</h2>
      <p class="mt-2 text-app-muted">Enter a make, model or feature. Use the optional filters to narrow the results.</p>
    </div>

    <form class="rounded-2xl border border-app-line bg-app-surface p-6 shadow-sm" on:submit|preventDefault={runFuzzySearch}>
      <label class="block" for="fuzzy-text">
        <span class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-app-muted">Vehicle description</span>
        <input id="fuzzy-text" bind:value={fuzzyText} placeholder="e.g. BMW diesel automatic"
          class="w-full rounded-xl border border-app-line bg-app-surface px-4 py-3 text-base text-app-ink shadow-sm outline-none transition placeholder:text-app-muted/60 hover:border-app-line-strong focus-visible:border-app-accent focus-visible:ring-4 focus-visible:ring-app-accent/15" />
      </label>

      <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div><FilterSelect id="fuzzy-fza" label="Vehicle type" code="FZA" bind:value={fuzzyCriteria.fza} options={vehicleTypes} loading={initialLoading} optional /></div>
        {#key fuzzyFiltersKey}
          <SearchableFilter id="fuzzy-hst" label="Manufacturer" code="HST" bind:value={fuzzyCriteria.hst} bind:selectedLabel={fuzzyCriteria.hstb} loadOptions={searchBrands} />
          <SearchableFilter id="fuzzy-otg" label="Model range" code="OTG" bind:value={fuzzyCriteria.otg} bind:selectedLabel={fuzzyCriteria.otgb} loadOptions={searchModelRanges} />
          <SearchableFilter id="fuzzy-ht" label="Model group" code="HT" bind:value={fuzzyCriteria.ht} bind:selectedLabel={fuzzyCriteria.htb} loadOptions={searchModelGroups} />
          <SearchableFilter id="fuzzy-ut" label="Model" code="UT" bind:value={fuzzyCriteria.ut} bind:selectedLabel={fuzzyCriteria.utb} loadOptions={searchModels} />
        {/key}
      </div>

      <div class="mt-6 flex items-center gap-4 border-t border-app-line pt-5">
        <button type="submit"
          class="btn-accent rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-app-accent/25 disabled:cursor-not-allowed disabled:border disabled:border-app-line disabled:shadow-none"
          disabled={!fuzzyText.trim() || fuzzyLoading === "results"}>
          {fuzzyLoading === "results" ? "Searching…" : "Find vehicles"}
        </button>
        <button type="button" class="px-1 py-2.5 text-sm font-medium text-app-muted transition hover:text-app-ink disabled:cursor-not-allowed disabled:opacity-40" disabled={!canClear} on:click={clearFuzzySearch}>Clear all</button>
      </div>
    </form>

    {#if fuzzyError}<p role="alert" class="mt-4 text-sm text-app-danger">{fuzzyError}</p>{/if}

    <div class="mt-8">
      {#if fuzzySearched && !fuzzyLoading && !fuzzyResults.length && !fuzzyError}
        <p class="rounded-2xl border border-dashed border-app-line bg-app-surface/60 p-10 text-center text-app-muted">No vehicles match that description.</p>
      {/if}
      <VehicleTable
        vehicles={fuzzyResults}
        total={fuzzyTotal}
        offset={(fuzzyPage - 1) * PAGE_SIZE}
      />
      {#if fuzzyResults.length && (fuzzyPage > 1 || fuzzyHasNext)}
        <nav class="mt-4 flex items-center justify-between gap-4" aria-label="Fuzzy result pages">
          <button class="rounded-xl border border-app-line bg-app-surface px-4 py-2 text-sm font-semibold text-app-ink shadow-sm transition hover:border-app-line-strong disabled:cursor-not-allowed disabled:text-app-muted/50 disabled:shadow-none" disabled={fuzzyPage === 1 || !!fuzzyLoading} on:click={() => goToFuzzyPage(fuzzyPage - 1)}>Previous</button>
          <span class="text-sm text-app-muted">Page <span class="font-semibold text-app-ink">{fuzzyPage.toLocaleString("en-US")}</span> of <span class="font-semibold text-app-ink">{Math.ceil(fuzzyTotal / PAGE_SIZE).toLocaleString("en-US")}</span></span>
          <button class="rounded-xl border border-app-line bg-app-surface px-4 py-2 text-sm font-semibold text-app-ink shadow-sm transition hover:border-app-line-strong disabled:cursor-not-allowed disabled:text-app-muted/50 disabled:shadow-none" disabled={!fuzzyHasNext || !!fuzzyLoading} on:click={() => goToFuzzyPage(fuzzyPage + 1)}>Next</button>
        </nav>
      {/if}
    </div>
  </section>
