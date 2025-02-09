import { createContext, useContext, useState } from 'react';
import { type ExtractState, createStore, useStore } from 'zustand';
import { combine } from 'zustand/middleware';

type ListStoreProps = {
  listId: string;
};

const createListStore = ({ listId }: ListStoreProps) =>
  createStore(
    combine(
      {
        listId,
        selectedItems: [] as string[],
        randomizedItem: null as string | null,

        searchQuery: '',
      },
      (set) => ({
        selectItems: (itemIds: string[]) => set({ selectedItems: itemIds }),
        toggleItemSelection: (itemId: string) =>
          set((state) => ({
            selectedItems: state.selectedItems.includes(itemId)
              ? state.selectedItems.filter((id) => id !== itemId)
              : [...state.selectedItems, itemId],
          })),
        clearSelectedItems: () => set({ selectedItems: [] }),

        selectRandomFromSelectedItems: () =>
          set((state) => ({
            randomizedItem: state.selectedItems[Math.floor(Math.random() * state.selectedItems.length)],
          })),
        clearRandomizedItem: () => set({ randomizedItem: null }),

        setSearchQuery: (query: string) => set({ searchQuery: query }),
      }),
    ),
  );

type ListStore = ReturnType<typeof createListStore>;

// biome-ignore lint/style/noNonNullAssertion: <explanation>
const ListStoreContext = createContext<ListStore>(null!);

export function ListStoreProvider({ children, listId }: { children: React.ReactNode } & ListStoreProps) {
  const [listStore] = useState(() => createListStore({ listId }));
  return <ListStoreContext.Provider value={listStore}>{children}</ListStoreContext.Provider>;
}

export function useListStore<U>(selector: (state: ExtractState<ListStore>) => U): U {
  const listStore = useContext(ListStoreContext);
  if (!listStore) {
    throw new Error('useListStore must be used within a ListStoreProvider');
  }
  return useStore(listStore, selector);
}
