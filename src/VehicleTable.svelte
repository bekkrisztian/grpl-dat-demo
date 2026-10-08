<script lang="ts">
  import type { Vehicle } from "./api";

  export let vehicles: Vehicle[] = [];
  // Rows that match but have not been fetched yet; 0 when the caller does not
  // know the total, in which case the count stands on its own.
  export let total = 0;
  // Index of the first row on this page, so the summary can say where we are.
  export let offset = 0;

  const formatted = (value: number) => value.toLocaleString("en-US");
</script>

{#if vehicles.length}
  <p class="mb-3 text-sm text-slate-600">
    {#if total > vehicles.length}
      <span class="font-semibold text-slate-900">{formatted(offset + 1)}–{formatted(offset + vehicles.length)}</span>
      of <span class="font-semibold text-slate-900">{formatted(total)}</span> vehicles
    {:else}
      <span class="font-semibold text-slate-900">{formatted(vehicles.length)}</span>
      vehicle{vehicles.length === 1 ? "" : "s"}
    {/if}
  </p>
  <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div class="max-h-[32rem] overflow-auto">
      <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead class="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 shadow-sm">
          <tr>
            <th class="px-4 py-3">DAT code</th>
            <th class="px-4 py-3">Manufacturer</th>
            <th class="px-4 py-3">Model range</th>
            <th class="px-4 py-3">Model group</th>
            <th class="px-4 py-3">Model</th>
            <th class="px-4 py-3">Engine</th>
            <th class="px-4 py-3">Power</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          {#each vehicles as vehicle}
            <tr class="hover:bg-blue-50/40">
              <td class="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">{vehicle.dateCode || "—"}</td>
              <td class="px-4 py-3 font-medium">{vehicle.hstb || vehicle.hst || "—"}</td>
              <td class="px-4 py-3">{vehicle.otgb || vehicle.otg || "—"}</td>
              <td class="px-4 py-3">{vehicle.htb || vehicle.ht || "—"}</td>
              <td class="px-4 py-3">{vehicle.utb || vehicle.ut || "—"}</td>
              <td class="min-w-[18rem] px-4 py-3 text-slate-600">{vehicle.avMoB || "—"}</td>
              <td class="whitespace-nowrap px-4 py-3">{vehicle.kw ? `${vehicle.kw} kW` : "—"}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/if}
