export type Department = 
  | 'General' 
  | 'Classroom' 
  | 'Marks' 
  | 'Flashcards' 
  | 'Quizzes' 
  | 'Plan' 
  | 'Test' 
  | 'Voice' 
  | 'Translator' 
  | 'Timer' 
  | 'Experience' 
  | 'SmartVideos' 
  | 'Projects';

export type UserRole = 'student' | 'teacher';

export interface User {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  role: UserRole;
  xp: number;
  level: number;
  rank: string;
  badges: string[];
  testsCompleted?: number;
  targetEntScore?: number; // Target UNT score (max 140)
  currentEntScore?: number; // Current estimated UNT score (max 140)
  profileSubject1?: string; // e.g. "Физика"
  profileSubject2?: string; // e.g. "Математика (Профиль)"
  subjectScores?: {
    history: number;
    mathLit: number;
    readingLit: number;
    profile1: number;
    profile2: number;
  };
  classIds?: string[]; // IDs of classes the student is enrolled in or teacher manages
  teacherSubject?: string; // e.g. "Физика & Мат. грамотность"
  school?: string;
  grade?: string;
  parentContact?: string; // Parent phone / WhatsApp / email
  parentName?: string;
}

export interface Classroom {
  id: string;
  teacherId: string;
  teacherName: string;
  name: string; // e.g. "10 А - ФизМат", "11 Б - Группа ЕНТ"
  subject: string; // e.g. "Физика", "Математика", "История Казахстана"
  code: string; // e.g. "ENT-7489"
  createdAt: number;
  studentIds: string[];
  studentsCount?: number;
}

export interface ClassAssignment {
  id: string;
  classId: string;
  teacherId: string;
  teacherName: string;
  title: string;
  type: 'test' | 'quiz' | 'flashcards' | 'task' | 'plan';
  subject: string;
  description: string;
  deadline?: string;
  questionsCount?: number;
  createdAt: number;
  contentData?: any; // Questions, flashcards, test data, or weekly plan
  submissions?: Record<string, {
    studentId: string;
    studentName: string;
    score: number;
    maxScore?: number;
    completedAt: number;
    status: 'completed' | 'in_progress';
    feedback?: string;
  }>;
}

export interface TeacherMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'teacher' | 'student';
  receiverId: string;
  classId?: string;
  content: string;
  timestamp: number;
  type?: 'message' | 'parent_alert' | 'motivation' | 'voice_note' | 'video_invite';
  audioUrl?: string;
}

export interface EntQuest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  category: 'tests' | 'study' | 'streak' | 'assignments';
  progress: number;
  maxProgress: number;
  completed: boolean;
  claimed?: boolean;
  badgeReward?: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  attachments?: string[]; // base64 images
  image?: string; // single base64 image
  flashcards?: Flashcard[];
  quiz?: QuizQuestion[];
  groundingChunks?: any[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  isArchived: boolean;
  createdAt: number;
  lastUpdated?: number;
  type: 'chat' | 'conspect' | 'flashcards' | 'quiz';
  department: Department;
}

export interface AppState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isSidebarOpen: boolean;
}
