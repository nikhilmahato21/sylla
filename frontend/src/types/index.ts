export interface User {
  id: string;
  name: string;
  email: string;
  plan: "FREE" | "PRO";
  planExpiresAt?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Subject {
  id: string;
  userId: string;
  name: string;
  color: string;
  examDate?: string;
  syllabusUrl?: string;
  totalTopics: number;
  completedTopics: number;
  completion: number;
  createdAt: string;
}

export type TopicStatus = "PENDING" | "IN_PROGRESS" | "DONE" | "REVISION";
export type Priority = "LOW" | "MEDIUM" | "HIGH";

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  description?: string;
  status: TopicStatus;
  priority: Priority;
  estimatedMinutes: number;
  order: number;
  createdAt: string;
}

export interface StudySession {
  id: string;
  userId: string;
  topicId: string;
  startedAt: string;
  endedAt?: string;
  durationMin: number;
  notes?: string;
}

export interface Reminder {
  id: string;
  title: string;
  message: string;
  scheduledAt: string;
  type: "STUDY" | "REVISION" | "EXAM";
  sent: boolean;
}

export interface DashboardData {
  completion: number;
  totalTopics: number;
  doneTopics: number;
  weeklyHours: number;
  subjectProgress: Array<{
    id: string;
    name: string;
    color: string;
    completion: number;
    completedTopics: number;
    totalTopics: number;
    examDate?: string;
  }>;
  upcomingExam: { name: string; daysLeft: number; date: string } | null;
  reminders: Reminder[];
  todayTopics: Topic[];
  subjectCount: number;
}

export interface WeeklyData {
  data: Array<{ day: string; minutes: number; hours: string }>;
  totalHours: number;
}

export interface StreakData {
  streak: number;
  dates: string[];
}
