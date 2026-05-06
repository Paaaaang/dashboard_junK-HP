import { create } from "zustand";
import apiClient from "../api/client";

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
  clearError: () => void;
}

export const useStatsStore = create<StatsStore>((set) => ({
  summary: [],
  charts: null,
  recentActivity: [],
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('v1/stats');
      set({ 
        summary: response.data.summary, 
        charts: response.data.charts,
        recentActivity: response.data.recentActivity || [],
        isLoading: false 
      });
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
    }
  },
}));
