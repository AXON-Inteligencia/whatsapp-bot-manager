import { create } from "zustand"
import { Bot, Conversation, Contact, Automation, BotStatus } from "./types"

interface AppStore {
  // Data
  bots: Bot[]
  conversations: Conversation[]
  contacts: Contact[]
  automations: Automation[]
  isLoading: boolean
  
  // Search & Filters
  searchTerm: string
  statusFilter: BotStatus | "all"
  
  // Actions
  fetchBots: () => Promise<void>
  addBot: (bot: Omit<Bot, "id" | "createdAt" | "messages" | "uptime">) => Promise<void>
  updateBot: (id: string, updates: Partial<Bot>) => Promise<void>
  deleteBot: (id: string) => Promise<void>
  
  // Search & Filter Actions
  setSearchTerm: (term: string) => void
  setStatusFilter: (status: BotStatus | "all") => void
  
  // Computed
  getStats: () => {
    totalBots: number
    activeBots: number
    todayConversations: number
    totalContacts: number
    responseRate: number
  }
  getFilteredBots: () => Bot[]
}

export const useAppStore = create<AppStore>((set, get) => ({
  bots: [],
  conversations: [],
  contacts: [],
  automations: [],
  isLoading: false,
  searchTerm: "",
  statusFilter: "all",

  fetchBots: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/bots');
      const data = await res.json();
      set({ bots: data });
    } catch (error) {
      console.error('Error fetching bots:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addBot: async (botData) => {
    try {
      const res = await fetch('/api/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(botData),
      });
      const newBot = await res.json();
      set((state) => ({ bots: [...state.bots, newBot] }));
    } catch (error) {
      console.error('Error adding bot:', error);
    }
  },

  updateBot: async (id, updates) => {
    try {
      await fetch('/api/bots', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      set((state) => ({
        bots: state.bots.map((bot) => (bot.id === id ? { ...bot, ...updates } : bot)),
      }));
    } catch (error) {
      console.error('Error updating bot:', error);
    }
  },

  deleteBot: async (id) => {
    try {
      await fetch(`/api/bots?id=${id}`, { method: 'DELETE' });
      set((state) => ({ bots: state.bots.filter((bot) => bot.id !== id) }));
    } catch (error) {
      console.error('Error deleting bot:', error);
    }
  },

  setSearchTerm: (term) => set({ searchTerm: term }),
  setStatusFilter: (status) => set({ statusFilter: status }),

  getStats: () => {
    const { bots, contacts } = get();
    return {
      totalBots: bots.length,
      activeBots: bots.filter((b) => b.status === "online").length,
      todayConversations: 0,
      totalContacts: contacts.length,
      responseRate: 0,
    };
  },

  getFilteredBots: () => {
    const { bots, searchTerm, statusFilter } = get();
    return bots.filter((bot) => {
      const matchesSearch = bot.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           bot.phone.includes(searchTerm);
      const matchesStatus = statusFilter === "all" || bot.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  },
}));
