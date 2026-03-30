import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface BrainDumpResult {
  notesCreated: number;
  notesUpdated: number;
  summary: string;
  entities?: Array<{
    action: "created" | "updated";
    noteId: string;
    title: string;
    type: string;
  }>;
}

interface BrainDumpState {
  text: string;
  result: BrainDumpResult | null;
  expandedIds: string[];
  setText: (text: string) => void;
  setResult: (result: BrainDumpResult | null) => void;
  toggleExpanded: (id: string) => void;
}

export const useBrainDumpStore = create<BrainDumpState>()(
  persist(
    (set, get) => ({
      text: "",
      result: null,
      expandedIds: [],
      setText: (text) => set({ text }),
      setResult: (result) => set({ result }),
      toggleExpanded: (id) => {
        const { expandedIds } = get();
        set({
          expandedIds: expandedIds.includes(id)
            ? expandedIds.filter((i) => i !== id)
            : [...expandedIds, id],
        });
      },
    }),
    {
      name: "brain-dump-ui",
      storage: createJSONStorage(() => localStorage),
      // Only persist the draft text — results and expanded rows are session-ephemeral
      partialize: (state) => ({ text: state.text }),
    }
  )
);
