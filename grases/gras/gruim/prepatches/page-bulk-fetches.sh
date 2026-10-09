#!/bin/sh
set -eu

# Page Gruim bulk actions to prevent Grapi heap exhaustion.

node <<'NODE'
const fs = require("fs");

const file = "src/lib/components/admin/Admin-Ui.svelte";
if (!fs.existsSync(file)) {
  console.log("Admin-Ui.svelte not found, nothing to patch");
  process.exit(0);
}

let source = fs.readFileSync(file, "utf8");

if (source.includes("fetchAllPaged")) {
  console.log("bulk fetches already paged, skipping");
  process.exit(0);
}

const limitDeclaration =
  `  let limit = staticFilter?.limit || config?.global?.["list-size"] || 10;`;

const limitDeclarationWithBounds = `${limitDeclaration}

  // Bulk-fetch bounds.
  const fetchPageSize = config?.global?.["fetch-page-size"] || 1000;
  const maxRecords = config?.global?.["max-records"] || 50000;`;

const getAllRecords = `  const getAllRecords = async () => {
    let response = await execute(requests.find.replace(".", "_"), {
      filter: {
        where: lastUsedFilter.where,
        order: lastUsedFilter.order,
      },
    });

    return response.obj;
  };`;

const getAllRecordsPaged = `  const fetchAllPaged = async (extraFilter: any = {}) => {
    const rows: any[] = [];

    while (rows.length < maxRecords) {
      const pageSize = Math.min(fetchPageSize, maxRecords - rows.length);
      const response = await execute(requests.find.replace(".", "_"), {
        filter: {
          where: lastUsedFilter.where,
          order: lastUsedFilter.order,
          ...extraFilter,
          limit: pageSize,
          skip: rows.length,
        },
      });

      const page = response.obj || [];
      rows.push(...page);
      // A short page marks the end.
      if (page.length < pageSize) break;
    }

    // Warn when the result is truncated.
    if (rows.length >= maxRecords) {
      toast(
        \`Stopped at \${maxRecords.toLocaleString()} records, which is as many as this page can hold. Narrow the filter to cover the rest.\`,
        "error"
      );
    }

    return rows;
  };

  const getAllRecords = async () => fetchAllPaged();`;

const getAllRecordsWithRelations = `  const getAllRecordsWithRelations = async () => {
    let include = data.relations;
    let response = await execute(requests.find.replace(".", "_"), {
      filter: {
        where: lastUsedFilter.where,
        order: lastUsedFilter.order,
        include,
      },
    });

    return response.obj.map((item: any) => {
      return flattenObj(item);
    });
  };`;

const getAllRecordsWithRelationsPaged = `  const getAllRecordsWithRelations = async () => {
    const rows = await fetchAllPaged({ include: data.relations });
    return rows.map((item: any) => flattenObj(item));
  };`;

const replacements = [
  [limitDeclaration, limitDeclarationWithBounds],
  [getAllRecords, getAllRecordsPaged],
  [getAllRecordsWithRelations, getAllRecordsWithRelationsPaged],
];

for (const [from, to] of replacements) {
  if (!source.includes(from)) {
    // Do not allow the unbounded implementation to ship silently.
    console.error("page-bulk-fetches: anchor not found, gruim may have moved on");
    console.error(from.split("\n")[0]);
    process.exit(1);
  }
  source = source.replace(from, to);
}

fs.writeFileSync(file, source);
console.log("Paged gruim's bulk fetches (page " + "1000, ceiling 50000 by default)");
NODE
