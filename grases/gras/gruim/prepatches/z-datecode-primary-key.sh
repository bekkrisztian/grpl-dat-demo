#!/bin/sh
set -eu

# Map Datecode2's dateCode primary key to the id expected by gruim admin actions.

node <<'NODE'
const fs = require("fs");

const adminFile = "src/lib/components/admin/Admin-Ui.svelte";
if (!fs.existsSync(adminFile)) {
  console.log("Admin-Ui.svelte not found, nothing to patch");
} else {
  let source = fs.readFileSync(adminFile, "utf8");

  if (!source.includes("const recordPrimaryKey")) {
    const replacements = [
      [
        `  let modelName = resourceName || location.pathname.replace("/", "");`,
        `  let modelName = resourceName || location.pathname.replace("/", "");
  const recordPrimaryKey = modelName === "Datecode2" ? "dateCode" : "id";
  const getRecordId = (record: any) => record?.[recordPrimaryKey];
  const normalizeRecords = (records: any[] = []) =>
    records.map((record: any) => ({ ...record, id: getRecordId(record) }));`,
      ],
      [
        `        where: {
          id: {
            inq: ids,
          },
        },`,
        `        where: {
          [recordPrimaryKey]: {
            inq: ids,
          },
        },`,
      ],
      [
        `    return response.obj;
  };

  const getAllRecordsWithRelations`,
        `    return normalizeRecords(response.obj);
  };

  const getAllRecordsWithRelations`,
      ],
      [
        `      const page = response.obj || [];`,
        `      const page = normalizeRecords(response.obj || []);`,
      ],
      [
        `      tableData = res.obj;`,
        `      tableData = normalizeRecords(res.obj);`,
      ],
    ];

    for (const [from, to] of replacements) {
      if (!source.includes(from)) {
        console.error("z-datecode-primary-key: Admin-Ui anchor not found");
        console.error(from.split("\n")[0]);
        process.exit(1);
      }
      source = source.replace(from, to);
    }

    source = source.replaceAll("record.detail.id", "getRecordId(record.detail)");
    fs.writeFileSync(adminFile, source);
    console.log("Mapped Datecode2 dateCode to gruim's record id");
  } else {
    console.log("Datecode2 admin primary key already mapped, skipping");
  }

  source = fs.readFileSync(adminFile, "utf8");
  if (!source.includes("const getAllRecordIds")) {
    const anchor = `  const getAllRecords = async () => fetchAllPaged();`;
    const idLoader = `  const getAllRecordIds = async (onProgress = (_loaded: number, _total: number) => {}) => {
    const ids: any[] = [];
    const pageSize = 5000;
    const countResponse = await execute(requests.count, {
      where: lastUsedFilter.where || {},
    });
    const total = countResponse.obj.count || 0;
    onProgress(0, total);

    while (true) {
      const response = await execute(requests.find.replace(".", "_"), {
        filter: {
          where: lastUsedFilter.where,
          order: lastUsedFilter.order,
          fields: { [recordPrimaryKey]: true },
          limit: pageSize,
          skip: ids.length,
        },
      });
      const page = response.obj || [];
      ids.push(...page.map(getRecordId));
      onProgress(Math.min(ids.length, total), total);
      if (page.length < pageSize) break;
    }

    return ids;
  };

${anchor}`;
    const propAnchor = `            {getRecordsWithIdList}
            {archiveTable}`;
    const propReplacement = `            {getRecordsWithIdList}
            {getAllRecordIds}
            {archiveTable}`;

    if (!source.includes(anchor) || !source.includes(propAnchor)) {
      console.error("z-datecode-primary-key: select-all Admin-Ui anchor not found");
      process.exit(1);
    }
    source = source.replace(anchor, idLoader).replace(propAnchor, propReplacement);
    fs.writeFileSync(adminFile, source);
    console.log("Added paged Datecode2 ID loading for Select All");
  } else {
    console.log("Paged Select All ID loading already added, skipping");
  }

  source = fs.readFileSync(adminFile, "utf8");
  if (!source.includes("onProgress(Math.min(ids.length, total), total)")) {
    const signature = `  const getAllRecordIds = async () => {`;
    const pageSize = `    const pageSize = 5000;`;
    const push = `      ids.push(...page.map(getRecordId));`;
    if (!source.includes(signature) || !source.includes(pageSize) || !source.includes(push)) {
      console.error("z-datecode-primary-key: Select All progress anchor not found");
      process.exit(1);
    }
    source = source
      .replace(
        signature,
        `  const getAllRecordIds = async (onProgress = (_loaded: number, _total: number) => {}) => {`,
      )
      .replace(
        pageSize,
        `${pageSize}\n    const countResponse = await execute(requests.count, {\n      where: lastUsedFilter.where || {},\n    });\n    const total = countResponse.obj.count || 0;\n    onProgress(0, total);`,
      )
      .replace(
        push,
        `${push}\n      onProgress(Math.min(ids.length, total), total);`,
      );
    fs.writeFileSync(adminFile, source);
    console.log("Added Select All progress reporting");
  } else {
    console.log("Select All progress reporting already added, skipping");
  }
}

const listFile = "src/lib/components/admin/Admin-List-View.svelte";
if (!fs.existsSync(listFile)) {
  console.log("Admin-List-View.svelte not found, nothing to patch");
} else {
  let source = fs.readFileSync(listFile, "utf8");
  if (!source.includes("export let getAllRecordIds")) {
    const exportAnchor = `  export let getAllRecords = () => {};`;
    const selectionAnchor = `          let allRows = await getAllRecords();
          selectedRecordIds = allRows.map((row) => row.id);`;
    if (!source.includes(exportAnchor) || !source.includes(selectionAnchor)) {
      console.error("z-datecode-primary-key: Admin-List-View anchor not found");
      process.exit(1);
    }
    source = source
      .replace(
        exportAnchor,
        `${exportAnchor}\n  export let getAllRecordIds = async () => [];`,
      )
      .replace(
        `  export let selectedRecordIds = [];`,
        `  export let selectedRecordIds = [];\n  $: selectedRecordIdSet = new Set(selectedRecordIds);`,
      )
      .replace(
        selectionAnchor,
        `          selectedRecordIds = await getAllRecordIds();`,
      )
      .replaceAll("selectedRecordIds.includes(", "selectedRecordIdSet.has(");
    fs.writeFileSync(listFile, source);
    console.log("Made gruim Select All ID-only and Set-backed");
  } else {
    console.log("ID-only Select All already added, skipping");
  }

  source = fs.readFileSync(listFile, "utf8");
  if (!source.includes("let selectAllLoading = false")) {
    const importAnchor = `  import SpinnerComponent from "../Spinner-component.svelte";`;
    const stateAnchor = `  let isBulkActionsOpen = false;`;
    const handlerAnchor = `      on:btnClick={async () => {
        if (selectedRecordIds.length) {
          selectedRecordIds = [];
        } else {
          selectedRecordIds = await getAllRecordIds();
        }
      }}
      buttonText={selectedRecordIds.length
        ? "Unselect All Items"
        : "Select All Items"}
      buttonType="primary"`;
    const handlerReplacement = `      on:btnClick={async () => {
        if (selectedRecordIds.length) {
          selectedRecordIds = [];
        } else {
          selectAllLoading = true;
          selectAllLoaded = 0;
          try {
            selectedRecordIds = await getAllRecordIds((loaded, total) => {
              selectAllLoaded = loaded;
              selectAllTotal = total;
            });
          } finally {
            selectAllLoading = false;
          }
        }
      }}
      buttonText={selectAllLoading
        ? "Selecting Items..."
        : selectedRecordIds.length
          ? "Unselect All Items"
          : "Select All Items"}
      buttonType={selectAllLoading ? "disabled" : "primary"}`;
    const progressAnchor = `</div>
{#if data.length != 0}`;
    const progressMarkup = `</div>
{#if selectAllLoading}
  <div class="dat-select-all-progress py-3">
    <div class="mb-1 text-sm text-gray-600">
      Selecting {selectAllLoaded.toLocaleString()} of {selectAllTotal.toLocaleString()} items
    </div>
    <ProgressBar progress={selectAllTotal ? (selectAllLoaded / selectAllTotal) * 100 : 0} />
  </div>
{/if}
{#if data.length != 0}`;

    if (!source.includes(importAnchor) || !source.includes(stateAnchor) ||
        !source.includes(handlerAnchor) || !source.includes(progressAnchor)) {
      console.error("z-datecode-primary-key: Select All progress UI anchor not found");
      process.exit(1);
    }
    source = source
      .replace(importAnchor, `${importAnchor}\n  import ProgressBar from "../_shared/progress-bar/progress-bar.svelte";`)
      .replace(stateAnchor, `${stateAnchor}\n  let selectAllLoading = false;\n  let selectAllLoaded = 0;\n  let selectAllTotal = 0;`)
      .replace(handlerAnchor, handlerReplacement)
      .replace(progressAnchor, progressMarkup);
    fs.writeFileSync(listFile, source);
    console.log("Added Select All progress bar");
  } else {
    console.log("Select All progress bar already added, skipping");
  }

  source = fs.readFileSync(listFile, "utf8");
  if (source.includes(`{#if selectAllLoading}\n  <div class="py-3">`)) {
    source = source.replace(
      `{#if selectAllLoading}\n  <div class="py-3">`,
      `{#if selectAllLoading}\n  <div class="dat-select-all-progress py-3">`,
    );
    fs.writeFileSync(listFile, source);
    console.log("Added Select All progress theme hook");
  }
}

const updateFile = "src/lib/sections/Update-One-View.svelte";
if (!fs.existsSync(updateFile)) {
  console.log("Update-One-View.svelte not found, nothing to patch");
} else {
  let source = fs.readFileSync(updateFile, "utf8");
  const original = `  $: idKey =
    Object.keys(formData).find((key) => key === "id") ||
    Object.keys(formData).find(
      (key) => getRequestBodyProperties(data)[key]?.type === "number"
    );`;
  const replacement = `  $: idKey =
    controllerName === "Datecode2"
      ? "dateCode"
      : Object.keys(formData).find((key) => key === "id") ||
        Object.keys(formData).find(
          (key) => getRequestBodyProperties(data)[key]?.type === "number"
        );`;

  if (source.includes(replacement)) {
    console.log("Datecode2 update primary key already mapped, skipping");
  } else if (!source.includes(original)) {
    console.error("z-datecode-primary-key: Update-One-View anchor not found");
    process.exit(1);
  } else {
    source = source.replace(original, replacement);
    console.log("Mapped Datecode2 update requests to dateCode");
  }

  const payloadFilter = `.filter((key) => !autoGeneratedFields.includes(key))`;
  const safePayloadFilter = `.filter(
        (key) =>
          !autoGeneratedFields.includes(key) &&
          !(controllerName === "Datecode2" && key === "globalSearch"),
      )`;
  if (source.includes(safePayloadFilter)) {
    console.log("Datecode2 generated fields already excluded, skipping");
  } else if (!source.includes(payloadFilter)) {
    console.error("z-datecode-primary-key: update payload filter anchor not found");
    process.exit(1);
  } else {
    source = source.replace(payloadFilter, safePayloadFilter);
    console.log("Excluded Datecode2 globalSearch from update requests");
  }

  fs.writeFileSync(updateFile, source);
}
NODE
