<script lang="ts">
  const filters = ["FZA", "HST", "OTG", "HT", "UT"];
</script>

<svelte:head>
  <title>DAT vehicle search demo</title>
</svelte:head>

<main class="min-h-screen bg-slate-50 text-slate-900">
  <header class="border-b border-slate-200 bg-white">
    <div class="mx-auto max-w-6xl px-6 py-8">
      <p class="text-sm font-semibold uppercase tracking-widest text-blue-700">DAT demo</p>
      <h1 class="mt-2 text-3xl font-bold">Vehicle search</h1>
      <p class="mt-2 max-w-2xl text-slate-600">
        Search-tree and fuzzy-search screens will be built on the DAT API.
      </p>
    </div>
  </header>

  <section class="mx-auto max-w-6xl px-6 py-10">
    <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 class="text-lg font-semibold">Search tree</h2>
      <p class="mt-2 text-sm text-slate-600">Planned filter order:</p>
      <div class="mt-4 flex flex-wrap gap-2">
        {#each filters as filter, index}
          <span class="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800">
            {index + 1}. {filter}
          </span>
        {/each}
      </div>
    </div>
  </section>
</main>
