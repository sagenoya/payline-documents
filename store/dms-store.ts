import { create } from 'zustand';
import type { DocumentSummary } from '@/types/dms';

type DmsState = {
  uploadModalOpen: boolean;
  activeFolderId: string | null;
  searchTerm: string;
  editingDocument: DocumentSummary | null;
  selectedDocumentIds: string[];
  pendingDropFiles: File[];
  setUploadModalOpen: (open: boolean) => void;
  setActiveFolderId: (folderId: string | null) => void;
  setSearchTerm: (searchTerm: string) => void;
  setEditingDocument: (document: DocumentSummary | null) => void;
  toggleDocumentSelection: (id: string) => void;
  selectAllDocuments: (ids: string[]) => void;
  clearDocumentSelection: () => void;
  setPendingDropFiles: (files: File[]) => void;
};

export const useDmsStore = create<DmsState>((set) => ({
  uploadModalOpen: false,
  activeFolderId: null,
  searchTerm: '',
  editingDocument: null,
  selectedDocumentIds: [],
  pendingDropFiles: [],
  setUploadModalOpen: (uploadModalOpen) => set({ uploadModalOpen }),
  setActiveFolderId: (activeFolderId) => set({ activeFolderId }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setEditingDocument: (editingDocument) => set({ editingDocument }),
  toggleDocumentSelection: (id) =>
    set((state) => ({
      selectedDocumentIds: state.selectedDocumentIds.includes(id)
        ? state.selectedDocumentIds.filter((docId) => docId !== id)
        : [...state.selectedDocumentIds, id],
    })),
  selectAllDocuments: (ids) => set({ selectedDocumentIds: ids }),
  clearDocumentSelection: () => set({ selectedDocumentIds: [] }),
  setPendingDropFiles: (pendingDropFiles) => set({ pendingDropFiles }),
}));
