import { create } from "zustand";
import { supabase } from "@/api/supabase";

export interface DashboardSummaryCard {
  label: string;
  value: string;
  icon?: any; // We'll map icons in the component
  trend: 'up' | 'down';
  deltaValue: string;
  deltaLabel: string;
}

export interface DashboardChartData {
  courseCompanies: Array<{
    label: string;
    value: number;
  }>;
  subCourseParticipation: Array<{
    label: string;
    value: number;
  }>;
  insuranceDistribution: Array<{
    name: string;
    value: number;
  }>;
  monthlyParticipation: Array<{
    name: string;
    value: number;
  }>;
  topCompanies: Array<{
    name: string;
    value: number;
  }>;
}

export interface RecentActivity {
  type: string;
  entity: string;
  name: string;
  details: string;
  date: string;
}

interface StatsStore {
  summary: DashboardSummaryCard[];
  charts: DashboardChartData | null;
  recentActivity: RecentActivity[];
  isLoading: boolean;
  error: string | null;
  fetchStats: () => Promise<void>;
  subscribeToStats: () => () => void;
  clearError: () => void;
}

export const useStatsStore = create<StatsStore>((set, get) => ({
  summary: [],
  charts: null,
  recentActivity: [],
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.rpc('get_dashboard_stats');
      if (error) throw error;
      
      set({ 
        summary: data?.summary || [], 
        charts: data?.charts || null,
        recentActivity: data?.recentActivity || [],
        isLoading: false 
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  subscribeToStats: () => {
    // Listen to changes in major tables to refresh dashboard stats
    const channel = supabase
      .channel('public:stats')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'companies' },
        () => get().fetchStats()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants' },
        () => get().fetchStats()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'enrollments' },
        () => get().fetchStats()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_logs' },
        () => get().fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
