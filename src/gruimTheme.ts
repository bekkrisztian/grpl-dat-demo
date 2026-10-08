// The generated gruim module wraps itself in a container with a generated id and
// injects `#<id> { <this string> }`. So the declarations below land on that
// container, and the closing brace partway through is deliberate: it ends that
// block so the rules after it can reach the module's internals, which carry
// their own Tailwind classes and need !important to be overridden.
//
// Everything refers to the --dat-* variables from global.css, so the module
// follows the page into dark mode without a second set of values.
export const adminModuleCss = `
  color: rgb(var(--dat-ink));
  --background: rgb(var(--dat-surface));
  --borderFocusColor: rgb(var(--dat-accent));
  --borderHoverColor: rgb(var(--dat-line-strong));
  --disabledBackground: rgb(var(--dat-sunken));
  --disabledColor: rgb(var(--dat-muted));
  --inputColor: rgb(var(--dat-ink));
  --itemColor: rgb(var(--dat-ink));
  --itemHoverBG: rgb(var(--dat-accent-soft));
  --itemIsActiveBG: rgb(var(--dat-accent-soft));
  --listBackground: rgb(var(--dat-surface));
  --placeholderColor: rgb(var(--dat-muted));
  --selectedItemColor: rgb(var(--dat-ink));
}

#admin-list-table {
  background: rgb(var(--dat-surface)) !important;
  border-color: rgb(var(--dat-line)) !important;
}

#admin-list-table thead,
#admin-list-table thead th,
#admin-list-table thead .bg-primary {
  background: rgb(var(--dat-sunken)) !important;
  color: rgb(var(--dat-muted)) !important;
  border-color: rgb(var(--dat-line)) !important;
}

#admin-list-table tbody,
#admin-list-table tbody tr:nth-child(odd) td,
#admin-list-table tbody tr:nth-child(even) td {
  background: rgb(var(--dat-surface)) !important;
  color: rgb(var(--dat-ink)) !important;
}

#admin-list-table tbody tr:hover td {
  background: rgb(var(--dat-accent-soft)) !important;
}

#admin-list-table td,
#admin-list-table th {
  border-color: rgb(var(--dat-line)) !important;
}

#admin-list-table input,
#admin-list-table select,
#admin-list-table textarea {
  background: rgb(var(--dat-surface)) !important;
  color: rgb(var(--dat-ink)) !important;
  border-color: rgb(var(--dat-line)) !important;
}

#admin-list-table input[type="checkbox"] {
  accent-color: rgb(var(--dat-accent));
}

/* The module's own buttons are Tailwind-classed; match them to the page accent. */
#admin-list-table button[class*="bg-primary"],
button[class*="bg-primary"] {
  background: rgb(var(--dat-accent)) !important;
  color: rgb(var(--dat-accent-ink)) !important;
  border-color: transparent !important;
}

/* The pager's white band is a wrapper around the nav, not the nav itself. */
div:has(> div > div > nav[aria-label="Pagination"]),
div:has(> div > nav[aria-label="Pagination"]),
div:has(> nav[aria-label="Pagination"]) {
  background: rgb(var(--dat-surface)) !important;
  border-color: rgb(var(--dat-line)) !important;
}

nav[aria-label="Pagination"] button,
nav[aria-label="Pagination"] button svg {
  background: rgb(var(--dat-surface)) !important;
  color: rgb(var(--dat-ink)) !important;
  border-color: rgb(var(--dat-line)) !important;
}

nav[aria-label="Pagination"] button:hover {
  background: rgb(var(--dat-sunken)) !important;
}

nav[aria-label="Pagination"] button[class*="bg-indigo-50"] {
  background: rgb(var(--dat-accent-soft)) !important;
  color: rgb(var(--dat-accent)) !important;
  border-color: rgb(var(--dat-accent)) !important;
}

/* Dialogs (filter, create, confirm) mount in a fixed overlay outside the table,
   so the rules above never reach them. They are the module's own light surfaces,
   and without this the fields inherit the page's near-white text onto white.
   Only the module mounts fixed overlays on this page. */
.fixed [class*="bg-white"],
.fixed [class*="bg-slate-50"],
.fixed [class*="bg-gray-50"],
.fixed [class*="bg-zinc-100"] {
  background: rgb(var(--dat-surface)) !important;
  color: rgb(var(--dat-ink)) !important;
}

.fixed label,
.fixed [class*="text-slate-900"],
.fixed [class*="text-gray-600"],
.fixed [class*="text-gray-700"],
.fixed [class*="text-black"] {
  color: rgb(var(--dat-ink)) !important;
}

.fixed input,
.fixed select,
.fixed textarea {
  background: rgb(var(--dat-sunken)) !important;
  color: rgb(var(--dat-ink)) !important;
  border-color: rgb(var(--dat-line)) !important;
}

.fixed input::placeholder,
.fixed textarea::placeholder {
  color: rgb(var(--dat-muted)) !important;
}

/* The svelte-select dropdown renders its list in the overlay too. */
.fixed .svelte-select,
.fixed .svelte-select-list {
  background: rgb(var(--dat-surface)) !important;
  color: rgb(var(--dat-ink)) !important;
  border-color: rgb(var(--dat-line)) !important;
}

.fixed .svelte-select-list .item:hover {
  background: rgb(var(--dat-accent-soft)) !important;
}

/* The module tints its checkboxes with its own palette. */
input[type="checkbox"][class*="accent-primary"],
#admin-list-table input[type="checkbox"] {
  accent-color: rgb(var(--dat-accent)) !important;
  border-color: rgb(var(--dat-line-strong)) !important;
}
`;
