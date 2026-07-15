import { create } from "zustand";

type SupportStore = {
  selectedTicketId: string | null;
  selectedChannelId: string | null;
  replyDraft: string;
  setSelectedTicketId: (id: string | null) => void;
  setSelectedChannelId: (id: string | null) => void;
  setReplyDraft: (draft: string) => void;
};

export const useSupportStore = create<SupportStore>((set) => ({
  selectedTicketId: null,
  selectedChannelId: null,
  replyDraft: "",
  setSelectedTicketId: (selectedTicketId) => set({ selectedTicketId }),
  setSelectedChannelId: (selectedChannelId) => set({ selectedChannelId }),
  setReplyDraft: (replyDraft) => set({ replyDraft }),
}));
