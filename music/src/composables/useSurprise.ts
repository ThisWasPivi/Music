import { useRouter } from "vue-router";

import { useCatalog } from "./useCatalog.ts";

/**
 * Opens a random playlist, never the one already on screen.
 * @returns The function that does it
 */
export function useSurprise(): () => Promise<void> {
  const router = useRouter();
  const { playlists } = useCatalog();
  return async () => {
    const current = router.currentRoute.value.params.id;
    const pool = playlists.filter((playlist) => playlist.id !== current);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick) await router.push({ name: "playlist", params: { id: pick.id } });
  };
}
