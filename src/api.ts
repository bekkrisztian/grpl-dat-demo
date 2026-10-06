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

const remoteUrl = (process.env.SVELTE_APP_REMOTE_URL || "").replace(/\/remoteEntry\.js$/, "").replace(/\/$/, "");
const apiUrl = (
  process.env.SVELTE_APP_API_URL
  || remoteUrl.replace(/-gruim(?=\.)/, "-grapi")
  || "http://localhost:3333"
).replace(/\/$/, "");

const request = async <T>(path: string, query: Record<string, unknown> = {}): Promise<T> => {
  const url = new URL(`${apiUrl}${path}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, typeof value === "string" ? value : JSON.stringify(value));
    }
  });

  const response = await fetch(url);
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
): Promise<Option[]> => {
  const rows = await request<Record<string, unknown>[]>(path, { where: {}, sqlParams });
  return compact(rows.map((row) => ({
    value: String(row[valueKey] ?? ""),
    label: String(row[labelKey] ?? row[valueKey] ?? ""),
  })));
};

export const loadBrands = (fza: string) => sqlOptions("/brandsByVehicleType", { FZA: fza }, "HST", "HSTB");

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

export const findVehicles = (criteria: Criteria, limit = 100) => request<Vehicle[]>("/datecode2s", {
  filter: {
    where: whereFromCriteria(criteria),
    order: ["hstb ASC", "htb ASC", "utb ASC"],
    limit,
  },
});

const byLabel = (left: Vehicle, right: Vehicle) =>
  (left.hstb ?? "").localeCompare(right.hstb ?? "")
  || (left.htb ?? "").localeCompare(right.htb ?? "")
  || (left.utb ?? "").localeCompare(right.utb ?? "");

export const fuzzySearchVehicles = async (text: string, criteria: Criteria, limit = 100) => {
  const conditions: Record<string, unknown>[] = [
    { globalSearch: { like: `%${text.trim()}%` } },
    ...Object.entries(whereFromCriteria(criteria)).map(([key, value]) => ({ [key]: value })),
  ];
  // A leading wildcard cannot use an index, so ordering in the database makes
  // it sort every match before the limit applies. Order the page here instead.
  const rows = await request<Vehicle[]>("/datecode2s", {
    filter: {
      where: conditions.length === 1 ? conditions[0] : { and: conditions },
      limit,
    },
  });
  return rows.sort(byLabel);
};
