import { create } from 'zustand';

type DmsState = {
  uploadModalOpen: boolean;
  activeFolderId: string | null;
  searchTerm: string;
  editingDocumentId: string | null;
  setUploadModalOpen: (open: boolean) => void;
  setActiveFolderId: (folderId: string | null) => void;
  setSearchTerm: (searchTerm: string) => void;
  setEditingDocumentId: (id: string | null) => void;
};

export const useDmsStore = create<DmsState>((set) => ({
  uploadModalOpen: false,
  activeFolderId: null,
  searchTerm: '',
  editingDocumentId: null,
  setUploadModalOpen: (uploadModalOpen) => set({ uploadModalOpen }),
  setActiveFolderId: (activeFolderId) => set({ activeFolderId }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setEditingDocumentId: (editingDocumentId) => set({ editingDocumentId }),
}));
