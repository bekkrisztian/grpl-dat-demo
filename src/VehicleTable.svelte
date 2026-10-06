<script lang="ts">
  import type { Vehicle } from "./api";
  export let vehicles: Vehicle[] = [];
</script>

{#if vehicles.length}
  <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
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
