import "vue-router";

declare module "vue-router" {
  /**
   * Per-route metadata.
   * @property title - Page title from the route's `id` param, in the current language
   */
  interface RouteMeta {
    title?: (id: string) => string | undefined;
  }
}
