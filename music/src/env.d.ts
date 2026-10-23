/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<object, object, unknown>;
  export default component;
}

/** Workspace version, injected by Vite at build time. */
declare const __APP_VERSION__: string;

/** Commit SHA the bundle was built from, or an empty string. */
declare const __APP_COMMIT__: string;
