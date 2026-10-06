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

const apiUrl = (process.env.SVELTE_APP_API_URL || "http://localhost:3333").replace(/\/$/, "");

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

export const loadVehicleTypes = async (): Promise<Option[]> => [
  { value: "1", label: "Pkw, SUV, Kleintransporter" },
  { value: "2", label: "Transporter" },
  { value: "3", label: "Kraftrad" },
  { value: "4", label: "Lastkraftwagen" },
  { value: "5", label: "Omnibus" },
];

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

export const fuzzySearchVehicles = (text: string, criteria: Criteria, limit = 100) => {
  const conditions: Record<string, unknown>[] = [
    { globalSearch: { like: `%${text.trim()}%` } },
    ...Object.entries(whereFromCriteria(criteria)).map(([key, value]) => ({ [key]: value })),
  ];
  return request<Vehicle[]>("/datecode2s", {
    filter: {
      where: conditions.length === 1 ? conditions[0] : { and: conditions },
      order: ["hstb ASC", "htb ASC", "utb ASC"],
      limit,
    },
  });
};
