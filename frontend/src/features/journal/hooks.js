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
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: ["journals"] });
      onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      onError?.(errorMessage(error), error, variables, context);
    },
  });
}
