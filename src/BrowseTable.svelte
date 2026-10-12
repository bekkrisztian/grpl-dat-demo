<script lang="ts">
  import { onMount } from "svelte";
  import { adminModuleCss } from "./gruimTheme";

  // The generated gruim admin module for datecode2.
  let Admin: any = null;
  let error = "";

  // Model property names, not labels.
  const schema = {
    // datecode2 keys on dateCode, and holds more rows than one request can carry.
    "primary-key": "dateCode",
    "bulk-page-size": 1000,
    "field-properties": {
      "field-order": [
        "dateCode", "fzab", "hstb", "otgb", "htb", "utb",
        "avMoB", "ccm", "kw", "antr", "ab",
      ],
      // globalSearch is an index column the API maintains, so it is never sent
      // back on a save.
      "auto-generated-fields": ["globalSearch"],
      // Numeric codes repeat the label beside them; globalSearch is an index.
      "hidden-fields": [
        "fza", "hst", "ht", "ut", "otg", "avMo", "avKa", "avGe",
        "aZyl", "ats", "rSt", "kSt", "kZbewert", "kZkalk", "kzGlas",
        "globalSearch",
      ],
    },
  };

  // Column headings.
  const translations = {
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
  };

  onMount(async () => {
    try {
      Admin = (await import("App/Datecode2")).default;
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
    }
  });
</script>

{#if error}
  <p role="alert" class="rounded-2xl border border-app-danger/30 bg-app-danger-soft px-4 py-3 text-sm text-app-danger">
    The generated module could not be loaded: {error}. It is served by gruim, so
    this tab only works in a Grapple deployment.
  </p>
{:else if Admin}
  <svelte:component
    this={Admin}
    css={adminModuleCss}
    {schema}
    {translations}
    enableFilter={true}
    enableClearFilter={true}
    enableLoadMore={true}
  />
{:else}
  <p class="rounded-2xl border border-dashed border-app-line bg-app-surface/60 p-10 text-center text-app-muted">
    Loading the generated module…
  </p>
{/if}
