<script lang="ts">
  import FilterSelect from "./FilterSelect.svelte";
  import SearchableFilter from "./SearchableFilter.svelte";
  import VehicleTable from "./VehicleTable.svelte";
  import {
    emptyCriteria, fuzzySearchVehicles, errorMessage as message,
    searchBrands, searchModelGroups, searchModelRanges, searchModels,
    type Option, type Vehicle,
  } from "./api";

  export let vehicleTypes: Option[] = [];
  export let initialLoading = false;

  let fuzzyCriteria = emptyCriteria();
  let fuzzyText = "";
  let fuzzyLoading = "";
  let fuzzyResults: Vehicle[] = [];
  let fuzzySearched = false;
  let fuzzyError = "";

  const runFuzzySearch = async () => {
    if (!fuzzyText.trim()) return;
    fuzzyLoading = "results"; fuzzyError = ""; fuzzySearched = true;
    try { fuzzyResults = await fuzzySearchVehicles(fuzzyText, fuzzyCriteria); } catch (error) { fuzzyError = message(error); fuzzyResults = []; }
    finally { fuzzyLoading = ""; }
  };
</script>

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
          class="btn-accent rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-app-accent/25 disabled:cursor-not-allowed disabled:border disabled:border-app-line disabled:shadow-none"
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

