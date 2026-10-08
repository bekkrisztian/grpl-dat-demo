#!/bin/sh
set -eu

# The generated global fuzzy implementation builds raw SQL and ignores the
# supplied LoopBack filter. Use the repository instead so datasource mappings,
# criteria and the result limit are all applied safely.
node <<'NODE'
const fs = require('fs');

const file = 'src/controllers/fuzzy-datecode2.controller.ts';
if (!fs.existsSync(file)) {
  console.error('bound-fuzzy-search: generated fuzzy controller not found');
  process.exit(1);
}

let source = fs.readFileSync(file, 'utf8');
if (source.includes('const boundedLimit = Math.min')) {
  console.log('bounded fuzzy search already in place, skipping');
  process.exit(0);
}

const start = source.indexOf('    if (!filter) filter = {};');
const endMarker = '    return this.datecode2Repository.find(filter);';
const end = source.indexOf(endMarker, start);
if (start === -1 || end === -1) {
  console.error('bound-fuzzy-search: generated controller has an unexpected shape');
  process.exit(1);
}

const replacement = `    if (!filter) filter = {};
    const boundedLimit = Math.min(Math.max(filter.limit ?? 100, 1), 500);
    filter.limit = boundedLimit;

    if (useGlobalSearch) {
      const searchTerms = searchTerm.trim().split(/\\s+/).filter(Boolean);
      const searchWhere = {
        or: searchTerms.map(term => ({globalSearch: {like: \`%\${term}%\`}})),
      };
      filter.where = filter.where
        ? ({and: [filter.where, searchWhere]} as any)
        : (searchWhere as any);
    }

    return this.datecode2Repository.find(filter);`;

source = source.slice(0, start) + replacement + source.slice(end + endMarker.length);
fs.writeFileSync(file, source);
console.log('Applied bounded repository-backed fuzzy search');
NODE
