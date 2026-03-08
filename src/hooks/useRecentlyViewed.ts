import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RecentlyViewedStore {
  ids: string[];
  add: (id: string) => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set) => ({
      ids: [],
      add: (id) =>
        set((state) => ({
          ids: [id, ...state.ids.filter((x) => x !== id)].slice(0, 10),
        })),
    }),
    { name: 'recently-viewed' }
  )
);
