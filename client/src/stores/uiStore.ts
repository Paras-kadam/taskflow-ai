import { create } from 'zustand';

interface UiState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  taskDetailId: string | null;
  searchOpen: boolean;
  shortcutsOpen: boolean;
  
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openTaskDetail: (id: string) => void;
  closeTaskDetail: () => void;
  toggleSearch: () => void;
  toggleShortcuts: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  sidebarCollapsed: false,
  taskDetailId: null,
  searchOpen: false,
  shortcutsOpen: false,
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  openTaskDetail: (id) => set({ taskDetailId: id }),
  closeTaskDetail: () => set({ taskDetailId: null }),
  toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),
  toggleShortcuts: () => set((state) => ({ shortcutsOpen: !state.shortcutsOpen })),
}));
