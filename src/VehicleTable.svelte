<script lang="ts">
  import type { Vehicle } from "./api";

  export let vehicles: Vehicle[] = [];
  // Rows that match but are not on this page; 0 when the caller has no count.
  export let total = 0;
  // Index of the first row on this page, so the summary can say where we are.
  export let offset = 0;

  const count = (value: number) => value.toLocaleString("en-US");
</script>

{#if vehicles.length}
  <p class="mb-3 text-sm text-app-muted">
    {#if total > vehicles.length}
      <span class="font-semibold text-app-ink">{count(offset + 1)}–{count(offset + vehicles.length)}</span>
      of <span class="font-semibold text-app-ink">{count(total)}</span> vehicles
    {:else}
      <span class="font-semibold text-app-ink">{count(vehicles.length)}</span>
      vehicle{vehicles.length === 1 ? "" : "s"}
    {/if}
  </p>

  <div class="overflow-hidden rounded-2xl border border-app-line bg-app-surface shadow-sm">
    <div class="scrollarea max-h-[34rem] overflow-auto">
      <table class="min-w-full text-left text-sm">
        <thead class="sticky top-0 z-10 bg-app-sunken/95 backdrop-blur">
          <tr class="text-xs uppercase tracking-wider text-app-muted">
            <th class="px-4 py-3 font-semibold">DAT code</th>
            <th class="px-4 py-3 font-semibold">Manufacturer</th>
            <th class="px-4 py-3 font-semibold">Model range</th>
            <th class="px-4 py-3 font-semibold">Model group</th>
            <th class="px-4 py-3 font-semibold">Model</th>
            <th class="px-4 py-3 font-semibold">Engine</th>
            <th class="px-4 py-3 text-right font-semibold">Power</th>
          </tr>
        </thead>
        <tbody>
          {#each vehicles as vehicle}
            <tr class="border-t border-app-line transition-colors hover:bg-app-accent-soft/60">
              <td class="whitespace-nowrap px-4 py-3 font-mono text-xs tabular-nums text-app-muted">{vehicle.dateCode || "—"}</td>
              <td class="whitespace-nowrap px-4 py-3 font-medium text-app-ink">{vehicle.hstb || vehicle.hst || "—"}</td>
              <td class="whitespace-nowrap px-4 py-3 text-app-muted">{vehicle.otgb || vehicle.otg || "—"}</td>
              <td class="px-4 py-3 text-app-ink">{vehicle.htb || vehicle.ht || "—"}</td>
              <td class="px-4 py-3 text-app-ink">{vehicle.utb || vehicle.ut || "—"}</td>
              <td class="min-w-[16rem] px-4 py-3 text-app-muted">{vehicle.avMoB || "—"}</td>
              <td class="whitespace-nowrap px-4 py-3 text-right tabular-nums text-app-ink">
                {#if vehicle.kw}{vehicle.kw}<span class="ml-0.5 text-app-muted">kW</span>{:else}—{/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/if}
