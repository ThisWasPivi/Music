import "vue-router";

declare module "vue-router" {
  /**
   * Per-route metadata.
   * @property title - Page title, or a function of the route's `id` param
   */
  interface RouteMeta {
    title?: string | ((id: string) => string | undefined);
  }
}
