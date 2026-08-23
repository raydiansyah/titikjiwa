import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, errorMessage } from "@/lib/api";

export function useCommunityPosts() {
  return useQuery({
    queryKey: ["posts"],
    queryFn: () => api.get("/posts").then((response) => response.data),
  });
}

export function useCreateCommunityPost({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => api.post("/posts", payload),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
      onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      onError?.(errorMessage(error), error, variables, context);
    },
  });
}

export function usePostComments(postId, enabled = true) {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: () => api.get(`/posts/${postId}/comments`).then((response) => response.data),
    enabled: Boolean(postId) && enabled,
  });
}

export function useReactToPost(postId, { onError } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (type) => api.post(`/posts/${postId}/react`, { type }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
    onError: (error) => onError?.(errorMessage(error), error),
  });
}

export function useReportPost(postId, { onSuccess, onError } = {}) {
  return useMutation({
    mutationFn: () => api.post(`/posts/${postId}/report`),
    onSuccess,
    onError: (error) => onError?.(errorMessage(error), error),
  });
}

export function useCreateComment(postId, { onSuccess, onError } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body) => api.post(`/posts/${postId}/comments`, { body }),
    onSuccess: async (data, variables, context) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["comments", postId] }),
        queryClient.invalidateQueries({ queryKey: ["posts"] }),
      ]);
      onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      onError?.(errorMessage(error), error, variables, context);
    },
  });
}
