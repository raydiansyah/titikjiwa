import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, errorMessage } from "@/lib/api";

export function useJournals() {
  return useQuery({
    queryKey: ["journals"],
    queryFn: () => api.get("/journals").then((response) => response.data),
  });
}

export function useCreateJournal({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post("/journals", payload),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["journals"] });
      onSuccess?.(data);
    },
    onError: (error) => onError?.(errorMessage(error), error),
  });
}

export function useAuraHistory() {
  return useQuery({
    queryKey: ["aura-history"],
    queryFn: () => api.get("/me/aura/history").then((response) => response.data),
  });
}

export function useWeeklyInsights() {
  return useQuery({
    queryKey: ["weekly-insights"],
    queryFn: () => api.get("/ai/weekly-insights").then((response) => response.data),
  });
}

export function useGenerateWeeklyInsight({ onError } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/ai/weekly-insight"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["weekly-insights"] }),
    onError: (error) => onError?.(errorMessage(error), error),
  });
}
