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

  // Contact Actions
  addContact: (contact: Omit<Contact, "id" | "createdAt" | "totalMessages" | "lastContact">) => void
  updateContact: (id: string, updates: Partial<Contact>) => void
  deleteContact: (id: string) => void
  importContacts: (contacts: Omit<Contact, "id" | "createdAt" | "totalMessages" | "lastContact">[]) => void
  
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
      if (Array.isArray(data)) {
        set({ bots: data });
      } else {
        console.warn('API returned non-array data:', data);
        set({ bots: [] });
      }
    } catch (error) {
      console.warn('Error fetching bots:', error);
      set({ bots: [] });
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
      if (!res.ok) {
        throw new Error('Falha ao criar o bot no banco de dados (Redis ausente).');
      }
      const newBot = await res.json();
      set((state) => ({ bots: [...state.bots, newBot] }));
    } catch (error: any) {
      console.warn('Error adding bot:', error);
      throw error; // Re-throw to be caught by UI
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

  addContact: (contactData) => {
    const newContact = {
      ...contactData,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      totalMessages: 0,
      lastContact: new Date().toISOString(),
      funnelStage: 'new_lead',
    } as Contact;
    set((state) => ({ contacts: [...state.contacts, newContact] }));
  },

  updateContact: (id, updates) => {
    set((state) => ({
      contacts: state.contacts.map((contact) => 
        contact.id === id ? { ...contact, ...updates } : contact
      ),
    }));
  },

  deleteContact: (id) => {
    set((state) => ({ contacts: state.contacts.filter((c) => c.id !== id) }));
  },

  importContacts: (contactsData) => {
    const newContacts = contactsData.map(c => ({
      ...c,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      totalMessages: 0,
      lastContact: new Date().toISOString(),
    })) as Contact[];
    set((state) => ({ contacts: [...state.contacts, ...newContacts] }));
  },

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
