/// <reference types="svelte" />

declare module "App/*" {
  import type { ComponentType } from "svelte";
  const component: ComponentType;
  export default component;
}
