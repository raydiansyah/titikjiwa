import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, errorMessage } from "@/lib/api";

export function useCommunityPosts() {
  return useQuery({ queryKey: ["posts"], queryFn: () => api.get("/posts").then((r) => r.data) });
}

export function useCreateCommunityPost({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post("/posts", payload),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
      onSuccess?.(data);
    },
    onError: (error) => onError?.(errorMessage(error), error),
  });
}

export function usePostComments(postId, enabled) {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: () => api.get(`/posts/${postId}/comments`).then((r) => r.data),
    enabled,
  });
}

export function usePostReaction(postId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (type) => api.post(`/posts/${postId}/react`, { type }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });
}

export function useReportPost(postId, { onSuccess } = {}) {
  return useMutation({
    mutationFn: () => api.post(`/posts/${postId}/report`),
    onSuccess,
  });
}

export function useCreateComment(postId, { onSuccess } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post(`/posts/${postId}/comments`, { body }),
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["comments", postId] }),
        queryClient.invalidateQueries({ queryKey: ["posts"] }),
      ]);
      onSuccess?.(data);
    },
  });
}
