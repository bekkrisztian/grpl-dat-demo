#!/bin/sh
set -eu

# Gruim's getAllRecords and getAllRecordsWithRelations each send one request
# with no limit, so "Select All Items" and the two export buttons ask the API
# for every row at once. datecode2 holds 570518 rows: the API exceeds its
# 2048 MB heap while building the answer and dies, which reaches the browser as
# a 502 and leaves the pod Running with a dead node process inside.
#
# Walk the table in pages instead. Both bounds are read from config.global, next
# to the list-size key gruim already honours.

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

  // Bounds for the bulk fetches below; see page-bulk-fetches.sh.
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
      // A short page is the last one; without this the loop would keep asking
      // past the end until it reached the ceiling.
      if (page.length < pageSize) break;
    }

    // Stopping at the ceiling means the answer is partial. Say so, rather than
    // handing back a truncated export that looks complete.
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
    // Fail loudly: a silent miss would ship the unbounded version again.
    console.error("page-bulk-fetches: anchor not found, gruim may have moved on");
    console.error(from.split("\n")[0]);
    process.exit(1);
  }
  source = source.replace(from, to);
}

fs.writeFileSync(file, source);
console.log("Paged gruim's bulk fetches (page " + "1000, ceiling 50000 by default)");
NODE
