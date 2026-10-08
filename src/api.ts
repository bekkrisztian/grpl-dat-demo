export type Vehicle = {
  fza?: number;
  hst?: number;
  ht?: number;
  ut?: number;
  dateCode?: string;
  fzab?: string;
  hstb?: string;
  htb?: string;
  utb?: string;
  otg?: string;
  otgb?: string;
  avMoB?: string;
  avKaB?: string;
  avGeB?: string;
  ccm?: string;
  kw?: string;
  antr?: string;
  ab?: string;
  globalSearch?: string;
};

export type Option = { value: string; label: string };

export type Criteria = {
  fza: string;
  hst: string;
  otg: string;
  ht: string;
  ut: string;
};

// Vehicle queries go through the Redis-backed cache layer. The SQL controllers
// that feed the dropdowns cannot: the cache layer's generated client repeats
// the where parameter on those paths, so the positional call drops sqlParams
// and every lookup comes back empty. They address layer one directly.
const cacheUrl = (process.env.SVELTE_APP_API_URL || "").replace(/\/$/, "");
const treeUrl = (process.env.SVELTE_APP_TREE_API_URL || "").replace(/\/$/, "") || cacheUrl;

const request = async <T>(path: string, query: Record<string, unknown> = {}, base = cacheUrl, signal?: AbortSignal): Promise<T> => {
  if (!base) throw new Error("SVELTE_APP_API_URL is not configured.");
  const url = new URL(`${base}${path}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, typeof value === "string" ? value : JSON.stringify(value));
    }
  });

  const response = await fetch(url, { signal });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message || `${response.status} ${response.statusText}`);
  }
  return response.json();
};

const compact = <T extends Option>(items: T[]) => items.filter(
  (item, index, all) => item.value && all.findIndex((candidate) => candidate.value === item.value) === index,
);

export const emptyCriteria = (): Criteria => ({ fza: "", hst: "", otg: "", ht: "", ut: "" });

// Used when the generated controller is unavailable: a SQL controller whose
// query carries no ${...} placeholder generates an undecorated parameter and
// fails with 500, which is why this one filters on a wildcard.
const KNOWN_VEHICLE_TYPES: Option[] = [
  { value: "1", label: "Pkw, SUV, Kleintransporter" },
  { value: "2", label: "Transporter" },
  { value: "3", label: "Kraftrad" },
  { value: "4", label: "Lastkraftwagen" },
  { value: "5", label: "Omnibus" },
];

export const loadVehicleTypes = async (): Promise<Option[]> => {
  try {
    const options = await sqlOptions("/vehicleTypes", { FZA: "%" }, "FZA", "FZAB");
    if (options.length) return options;
  } catch {
    // fall through to the known categories
  }
  return KNOWN_VEHICLE_TYPES;
};

const sqlOptions = async (
  path: string,
  sqlParams: Record<string, string>,
  valueKey: string,
  labelKey: string,
  signal?: AbortSignal,
): Promise<Option[]> => {
  const rows = await request<Record<string, unknown>[]>(path, { where: {}, sqlParams }, treeUrl, signal);
  return compact(rows.map((row) => ({
    value: String(row[valueKey] ?? ""),
    label: String(row[labelKey] ?? row[valueKey] ?? ""),
  })));
};

export const loadBrands = (fza: string) => sqlOptions("/brandsByVehicleType", { FZA: fza }, "HST", "HSTB");

const searchParams = (query: string) => ({
  nameQuery: `${query}%`,
  codeQuery: /^\d+$/.test(query) ? query : "-1",
});

export const searchBrands = (query: string, signal?: AbortSignal) =>
  sqlOptions("/brands", searchParams(query), "HST", "HSTB", signal);

export const searchModelRanges = (query: string, signal?: AbortSignal) =>
  sqlOptions("/modelRanges", { nameQuery: `${query}%`, codeQuery: `${query}%` }, "OTG", "OTGB", signal);

export const searchModelGroups = (query: string, signal?: AbortSignal) =>
  sqlOptions("/modelGroups", searchParams(query), "HT", "HTB", signal);

export const searchModels = (query: string, signal?: AbortSignal) =>
  sqlOptions("/models", searchParams(query), "UT", "UTB", signal);

export const loadModelRanges = (fza: string, hst: string) => sqlOptions(
  "/modelRangeByVehicleTypeAndManufacturer",
  { FZA: fza, HST: hst },
  "OTG",
  "OTGB",
);

export const loadModelGroups = (fza: string, hst: string, otg: string) => sqlOptions(
  "/modelGroupByVehicleTypeAndManufacturerAndModelRange",
  { FZA: fza, HST: hst, OTG: otg },
  "HT",
  "HTB",
);

export const loadModels = (fza: string, hst: string, ht: string) => sqlOptions(
  "/modelByVehicleTypeAndManufacturerAndModelGroup",
  { FZA: fza, HST: hst, HT: ht },
  "UT",
  "UTB",
);

const whereFromCriteria = (criteria: Criteria) => Object.fromEntries(
  Object.entries(criteria)
    .filter(([, value]) => value)
    .map(([key, value]) => [key, key === "otg" ? value : Number(value)]),
);

// A page the browser can render. Broad criteria match six figures of rows, so
// the table asks for one page at a time and the count tells it how many exist.
export const PAGE_SIZE = 100;

export const countVehicles = async (criteria: Criteria) => {
  const result = await request<{ count: number }>("/datecode2s/count", {
    where: whereFromCriteria(criteria),
  });
  return result.count;
};

export const findVehicles = (criteria: Criteria, offset = 0, limit = PAGE_SIZE) =>
  request<Vehicle[]>("/datecode2s", {
    filter: {
      where: whereFromCriteria(criteria),
      order: ["hstb ASC", "htb ASC", "utb ASC"],
      limit,
      offset,
    },
  });

const byLabel = (left: Vehicle, right: Vehicle) =>
  (left.hstb ?? "").localeCompare(right.hstb ?? "")
  || (left.htb ?? "").localeCompare(right.htb ?? "")
  || (left.utb ?? "").localeCompare(right.utb ?? "");

export const fuzzySearchVehicles = async (text: string, criteria: Criteria, limit = 100) => {
  type FuzzyResult = Vehicle | { item: Vehicle; score?: number };
  // Ask for a bounded page. Without a limit a broad word matches a large part
  // of the table, and the API holds every row in memory to answer: its heap is
  // capped at 2 GB and 100 rows already weigh 68 KB. The where clause has
  // narrowed the set server-side, so this many is ample for the slice below.
  const rows = await request<FuzzyResult[]>(
    `/dsearchtrees/datecode2s/fuzzy/${encodeURIComponent(text.trim())}`,
    { useGlobalSearch: true, filter: { where: whereFromCriteria(criteria), limit: limit * 5 } },
  );
  const selected = whereFromCriteria(criteria);
  return rows
    .map((row) => "item" in row ? row.item : row)
    .filter((vehicle) => Object.entries(selected).every(([key, value]) =>
      String(vehicle[key as keyof Vehicle] ?? "") === String(value),
    ))
    .sort(byLabel)
    .slice(0, limit);
};
