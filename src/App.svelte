<script lang="ts">
  import { onMount } from "svelte";
  import TreeSearch from "./TreeSearch.svelte";
  import FuzzySearch from "./FuzzySearch.svelte";
  import BrowseTable from "./BrowseTable.svelte";
  import { loadVehicleTypes, errorMessage, type Option } from "./api";

  type View = "tree" | "fuzzy" | "browse";

  let view: View = "tree";
  let vehicleTypes: Option[] = [];
  let initialLoading = true;
  let startupError = "";

  onMount(async () => {
    try {
      vehicleTypes = await loadVehicleTypes();
    } catch (error) {
      startupError = errorMessage(error);
    } finally {
      initialLoading = false;
    }
  });
</script>

<svelte:head><title>DAT vehicle search demo</title></svelte:head>

<main class="min-h-screen bg-app-bg text-app-ink antialiased">
  <header class="sticky top-0 z-20 border-b border-app-line bg-app-bg shadow-sm">
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
          on:click={() => view = "browse"}>Browse data</button>
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
      <TreeSearch {vehicleTypes} {initialLoading} />
    {:else if view === "fuzzy"}
      <FuzzySearch {vehicleTypes} {initialLoading} />
    {:else}
      <section aria-labelledby="browse-title">
        <div class="mb-7 max-w-2xl">
          <h2 id="browse-title" class="text-3xl font-bold tracking-tight">All DAT vehicles</h2>
          <p class="mt-2 text-app-muted">The full datecode2 table through the generated Grapple admin module, with filtering and paging.</p>
        </div>
        <BrowseTable />
      </section>
    {/if}
  </div>
</main>
