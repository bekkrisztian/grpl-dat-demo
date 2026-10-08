<script lang="ts">
  import type { Option } from "./api";

  export let id: string;
  export let label: string;
  export let value = "";
  export let loadOptions: (query: string, signal?: AbortSignal) => Promise<Option[]>;

  let query = "";
  let options: Option[] = [];
  let loading = false;
  let open = false;
  let error = "";
  let timer: ReturnType<typeof setTimeout>;
  let requestId = 0;
  let controller: AbortController | undefined;

  const text = (option: Option) =>
    option.label === option.value ? `${label} ${option.value}` : `${option.label} (${option.value})`;

  const search = () => {
    value = "";
    clearTimeout(timer);
    controller?.abort();
    const term = query.trim();
    error = "";
    if (term.length < 2) {
      options = [];
      open = false;
      return;
    }
    timer = setTimeout(async () => {
      const current = ++requestId;
      controller = new AbortController();
      loading = true;
      try {
        const result = await loadOptions(term, controller.signal);
        if (current === requestId) {
          options = result;
          open = true;
        }
      } catch (caught) {
        if (!(caught instanceof DOMException && caught.name === "AbortError")) {
          options = [];
          open = false;
          error = "Could not load suggestions.";
        }
      } finally {
        if (current === requestId) loading = false;
      }
    }, 250);
  };

  const choose = (option: Option) => {
    value = option.value;
    query = text(option);
    open = false;
  };

  const closeLater = () => setTimeout(() => open = false, 150);
</script>

<div class="relative">
  <label class="block" for={id}>
    <span class="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-app-muted">
      {label}
      <span class="font-medium normal-case tracking-normal text-app-muted/70">optional</span>
    </span>
    <input
      {id}
      bind:value={query}
      role="combobox"
      aria-expanded={open}
      aria-controls={`${id}-options`}
      aria-autocomplete="list"
      autocomplete="off"
      placeholder={`Search ${label}`}
      on:input={search}
      on:focus={() => options.length && (open = true)}
      on:blur={closeLater}
      class="w-full rounded-xl border border-app-line bg-app-surface px-3.5 py-2.5 text-sm text-app-ink shadow-sm outline-none transition placeholder:text-app-muted/60 hover:border-app-line-strong focus-visible:border-app-accent focus-visible:ring-4 focus-visible:ring-app-accent/15"
    />
  </label>
  {#if loading}<p class="mt-1 text-xs text-app-muted">Searching…</p>{/if}
  {#if error}<p role="alert" class="mt-1 text-xs text-app-danger">{error}</p>{/if}
  {#if open}
    <div id={`${id}-options`} role="listbox" class="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-app-line bg-app-surface p-1 shadow-xl">
      {#each options as option}
        <button type="button" role="option" aria-selected={value === option.value} on:mousedown|preventDefault={() => choose(option)} class="block w-full rounded-lg px-3 py-2 text-left text-sm text-app-ink hover:bg-app-sunken">
          {text(option)}
        </button>
      {:else}
        <p class="px-3 py-2 text-sm text-app-muted">No matches</p>
      {/each}
    </div>
  {/if}
</div>
