import { create } from 'zustand';
import type { DocumentSummary } from '@/types/dms';

type DmsState = {
  uploadModalOpen: boolean;
  activeFolderId: string | null;
  searchTerm: string;
  editingDocument: DocumentSummary | null;
  setUploadModalOpen: (open: boolean) => void;
  setActiveFolderId: (folderId: string | null) => void;
  setSearchTerm: (searchTerm: string) => void;
  setEditingDocument: (document: DocumentSummary | null) => void;
};

export const useDmsStore = create<DmsState>((set) => ({
  uploadModalOpen: false,
  activeFolderId: null,
  searchTerm: '',
  editingDocument: null,
  setUploadModalOpen: (uploadModalOpen) => set({ uploadModalOpen }),
  setActiveFolderId: (activeFolderId) => set({ activeFolderId }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setEditingDocument: (editingDocument) => set({ editingDocument }),
}));
