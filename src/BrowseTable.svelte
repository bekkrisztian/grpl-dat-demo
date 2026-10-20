<script lang="ts">
  import { onMount } from "svelte";
  import { adminModuleCss } from "./gruimTheme";

  let table: HTMLDivElement;
  let loading = true;
  let error = "";

  const mountDatecode2 = async (): Promise<void> => {
    try {
      const { default: Datecode2 } = await import("App/Datecode2");

      if (table) {
        table.innerHTML = "";
        new Datecode2({
          target: table,
          props: {
            css: adminModuleCss,
            translation: {
              dateCode: "Date code",
              fzab: "Vehicle type",
              hstb: "Manufacturer",
              otgb: "Model range",
              htb: "Model group",
              utb: "Model",
              avMoB: "Engine",
              ccm: "Displacement",
              kw: "Power (kW)",
              antr: "Drive",
              ab: "Body",
            },
            schema: {
              "primary-key": "dateCode",
              "bulk-page-size": 1000,
              "field-properties": {
                "field-order": [
                  "dateCode", "fzab", "hstb", "otgb", "htb", "utb",
                  "avMoB", "ccm", "kw", "antr", "ab",
                ],
                "auto-generated-fields": ["globalSearch"],
                "hidden-fields": [
                  "fza", "hst", "ht", "ut", "otg", "avMo", "avKa", "avGe",
                  "aZyl", "ats", "rSt", "kSt", "kZbewert", "kZkalk", "kzGlas",
                  "globalSearch",
                ],
              },
            },
            enableFilter: true,
            enableClearFilter: true,
            enableLoadMore: true,
          },
        });
      }
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
    } finally {
      loading = false;
    }
  };

  onMount(async () => {
    await mountDatecode2();
  });
</script>

{#if error}
  <p role="alert" class="rounded-2xl border border-app-danger/30 bg-app-danger-soft px-4 py-3 text-sm text-app-danger">
    The generated module could not be loaded: {error}. It is served by gruim, so
    this tab only works in a Grapple deployment.
  </p>
{:else}
  <div bind:this={table}>
    {#if loading}
      <p class="rounded-2xl border border-dashed border-app-line bg-app-surface/60 p-10 text-center text-app-muted">
        Loading the generated module…
      </p>
    {/if}
  </div>
{/if}
