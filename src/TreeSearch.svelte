<script lang="ts">
  import FilterSelect from "./FilterSelect.svelte";
  import VehicleTable from "./VehicleTable.svelte";
  import {
    emptyCriteria, countVehicles, findVehicles, PAGE_SIZE, errorMessage as message,
    loadBrands, loadModelGroups, loadModelRanges, loadModels,
    type Criteria, type Option, type Vehicle,
  } from "./api";

  export let vehicleTypes: Option[] = [];
  export let initialLoading = false;

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

  const goToTreePage = async (page: number) => {
    if (page < 1 || page > treePages || page === treePage || treeLoading) return;
    treeLoading = "results"; treeError = "";
    try {
      treeResults = await findVehicles(treeCriteria, (page - 1) * PAGE_SIZE);
      treePage = page;
    } catch (error) { treeError = message(error); }
    finally { treeLoading = ""; }
  };

  $: treePages = Math.max(1, Math.ceil(treeTotal / PAGE_SIZE));
</script>

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
          class="btn-accent rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-app-accent/25 disabled:cursor-not-allowed disabled:border disabled:border-app-line disabled:shadow-none"
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

