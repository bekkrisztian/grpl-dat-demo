<script lang="ts">
  import type { Option } from "./api";

  export let id: string;
  export let label: string;
  export let value = "";
  export let options: Option[] = [];
  export let disabled = false;
  export let loading = false;
  export let optional = false;
</script>

<label class="block" for={id}>
  <span class="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
  <select
    {id}
    bind:value
    {disabled}
    class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
  >
    <option value="">{loading ? "Loading…" : optional ? `Any ${label}` : `Select ${label}`}</option>
    {#each options as option}
      <option value={option.value}>{option.label} ({option.value})</option>
    {/each}
  </select>
</label>
