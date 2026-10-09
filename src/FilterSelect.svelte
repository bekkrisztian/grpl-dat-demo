<script lang="ts">
  import type { Option } from "./api";

  export let id: string;
  export let label: string;
  export let value = "";
  export let options: Option[] = [];
  export let disabled = false;
  export let loading = false;
  export let optional = false;

  // An option whose label repeats its value reads better with the field name in
  // front of it: the model range column in this data has no separate label.
  const text = (option: Option) =>
    option.label === option.value ? `${label} ${option.value}` : `${option.label} (${option.value})`;

  // The DAT tree does not reach the same depth everywhere: some branches return
  // a row whose code and name are both null, which leaves nothing to choose.
  // Say so, rather than leaving an enabled control that answers to nothing.
  $: exhausted = !disabled && !loading && options.length === 0;

  const placeholder = (l: boolean, e: boolean) =>
    l ? "Loading…" : e ? `No ${label} at this level` : optional ? `Any ${label}` : `Select ${label}`;
</script>

<label class="block" for={id}>
  <span class="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-app-muted">
    {label}
    {#if optional}<span class="font-medium normal-case tracking-normal text-app-muted/70">optional</span>{/if}
  </span>
  <select
    {id}
    bind:value
    disabled={disabled || exhausted}
    class="w-full rounded-xl border border-app-line bg-app-surface px-3.5 py-2.5 text-sm text-app-ink shadow-sm outline-none transition
           hover:border-app-line-strong
           focus-visible:border-app-accent focus-visible:ring-4 focus-visible:ring-app-accent/15
           disabled:cursor-not-allowed disabled:border-app-line disabled:bg-app-sunken disabled:text-app-muted/60 disabled:shadow-none"
  >
    <option value="">{placeholder(loading, exhausted)}</option>
    {#each options as option}
      <option value={option.value}>{text(option)}</option>
    {/each}
  </select>
</label>
