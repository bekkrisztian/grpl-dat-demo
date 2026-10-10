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

// Use layer one for SQL options because the cached client drops sqlParams.
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

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Could not load vehicle data.";

export const emptyCriteria = (): Criteria => ({ fza: "", hst: "", otg: "", ht: "", ut: "" });

// Fallback for grapi's parameterless SQL controller issue.
const KNOWN_VEHICLE_TYPES: Option[] = [
  { value: "1", label: "Cars, SUVs and light commercial vehicles" },
  { value: "2", label: "Vans" },
  { value: "3", label: "Motorcycles" },
  { value: "4", label: "Trucks" },
  { value: "5", label: "Buses" },
];

export const loadVehicleTypes = async (): Promise<Option[]> => {
  try {
    const options = await sqlOptions("/vehicleTypes", { FZA: "%" }, "FZA", "FZAB");
    if (options.length) return options.map((option) =>
      KNOWN_VEHICLE_TYPES.find(({ value }) => value === option.value) ?? option,
    );
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

// Keep broad vehicle results paginated.
export const PAGE_SIZE = 100;

export const countVehicles = async (criteria: Criteria) => {
  const result = await request<{ count: number }>("/datecode2s/count", {
    where: whereFromCriteria(criteria),
  });
  return result.count;
};

const fuzzyWhere = (text: string, criteria: Criteria) => {
  const selected = whereFromCriteria(criteria);
  const search = {
    or: text.trim().split(/\s+/).filter(Boolean).map((term) => ({
      globalSearch: { like: `%${term}%` },
    })),
  };

  return Object.keys(selected).length ? { and: [selected, search] } : search;
};

export const countFuzzyVehicles = async (text: string, criteria: Criteria) => {
  const result = await request<{ count: number }>("/datecode2s/count", {
    where: fuzzyWhere(text, criteria),
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

export const fuzzySearchVehicles = async (
  text: string,
  criteria: Criteria,
  offset = 0,
  limit = PAGE_SIZE,
): Promise<Vehicle[]> => {
  type FuzzyResult = Vehicle | { item: Vehicle; score?: number };
  const path = `/dsearchtrees/datecode2s/fuzzy/${encodeURIComponent(text.trim())}`;
  const where = whereFromCriteria(criteria);
  const order = ["hstb ASC", "htb ASC", "utb ASC"];
  const rows = await request<FuzzyResult[]>(path, {
    useGlobalSearch: true,
    filter: { where, order, limit, skip: offset },
  });
  const selected = where;
  const vehicles = rows
    .map((row) => "item" in row ? row.item : row)
    .filter((vehicle) => Object.entries(selected).every(([key, value]) =>
      String(vehicle[key as keyof Vehicle] ?? "") === String(value),
    ))
    .sort(byLabel);
  return vehicles;
};
