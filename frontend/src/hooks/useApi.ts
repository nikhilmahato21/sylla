import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

// Generic fetch hook
export function useFetch<T>(url: string, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: result } = await api.get(url);
      setData(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [url, ...deps]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

// Subject-specific hooks
export function useSubjects() {
  return useFetch<any[]>("/subjects");
}

export function useSubject(id: string) {
  return useFetch<any>(`/subjects/${id}`, [id]);
}

export function useTopics(subjectId?: string) {
  const url = subjectId ? `/topics?subjectId=${subjectId}` : "/topics";
  return useFetch<any[]>(url, [subjectId]);
}

export function useDashboard() {
  return useFetch<any>("/dashboard");
}

export function useWeeklyStats() {
  return useFetch<any>("/sessions/weekly");
}

export function useStreak() {
  return useFetch<any>("/sessions/streak");
}

export function useReminders() {
  return useFetch<any[]>("/reminders");
}

export function usePlans() {
  return useFetch<any[]>("/plans");
}
