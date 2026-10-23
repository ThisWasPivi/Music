import { defineStore } from "pinia";
import { computed, ref } from "vue";

import type { SortDirection } from "@/strategies/core.ts";
import { PLAYLIST_SORTS, type PlaylistSortId } from "@/strategies/playlists.ts";

/**
 * UI state of the playlist showcase: chosen sort and filters. Kept in a
 * store so it survives navigating to a playlist and back.
 */
export const useBrowserStore = defineStore("browser", () => {
  const sortId = ref<PlaylistSortId>("number");
  const direction = ref<SortDirection>("desc");
  const query = ref("");
  const artistId = ref<string | null>(null);
  const decade = ref<number | null>(null);
  const tag = ref<string | null>(null);

  const activeFilterCount = computed(
    () =>
      [
        query.value.trim() !== "",
        artistId.value,
        decade.value,
        tag.value,
      ].filter(Boolean).length,
  );

  /**
   * Picks a sort; picking the active one flips its direction.
   * @param id - The sort to apply
   * @returns Nothing
   */
  function setSort(id: PlaylistSortId): void {
    if (id === sortId.value) {
      direction.value = direction.value === "asc" ? "desc" : "asc";
      return;
    }
    sortId.value = id;
    direction.value =
      PLAYLIST_SORTS.find((sort) => sort.strategy.id === id)
        ?.defaultDirection ?? "asc";
  }

  /**
   * Clears every filter, keeping the sort.
   * @returns Nothing
   */
  function resetFilters(): void {
    query.value = "";
    artistId.value = null;
    decade.value = null;
    tag.value = null;
  }

  return {
    sortId,
    direction,
    query,
    artistId,
    decade,
    tag,
    activeFilterCount,
    setSort,
    resetFilters,
  };
});
