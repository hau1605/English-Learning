"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiResponse } from "@/services/api";

export interface QueueJob {
  id: string;
  name: string;
  data: Record<string, any>;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
  attempts: number;
  maxAttempts: number;
  result?: Record<string, any>;
  error?: string;
  scheduledAt?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const queueApi = {
  getJob: async (jobId: string): Promise<ApiResponse<QueueJob>> => {
    const response = await api.get<ApiResponse<QueueJob>>(
      `/queues/job/${jobId}`,
    );
    return response.data;
  },
};

export function useQueueJob(jobId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ["queue", "job", jobId],
    queryFn: () => queueApi.getJob(jobId!),
    enabled: !!jobId && enabled,
    refetchInterval: 2000,
    staleTime: 0,
  });
}

export function useRefreshQueueJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      await queueApi.getJob(jobId);
      return jobId;
    },
    onSuccess: (jobId) => {
      queryClient.invalidateQueries({ queryKey: ["queue", "job", jobId] });
    },
  });
}
