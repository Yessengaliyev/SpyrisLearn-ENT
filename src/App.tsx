import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Archive, 
  Plus, 
  Image as ImageIcon, 
  Send, 
  Search, 
  Settings, 
  History, 
  Menu, 
  X,
  Paperclip,
  FileText,
  Trash2,
  Aperture,
  Loader2,
  LogOut,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Mic,
  Languages,
  Phone,
  PhoneOff,
  Volume2,
  Timer as TimerIcon,
  Trophy,
  Award,
  Check,
  Edit2,
  Globe,
  Clock,
  Coffee,
  Play,
  Square,
  Pause,
  RotateCcw,
  ChevronsLeft,
  ChevronsRight,
  Sun,
  Moon,
  Palette,
  Link,
  Layers,
  HelpCircle,
  Calendar,
  Copy,
  Camera,
  ArrowRight,
  FileUp,
  Brain,
  Zap,
  Video,
  Sparkles,
  Type as TypeIcon,
  MicOff,
  Download,
  Info,
  Telescope,
  BookOpen,
  LineChart,
  FolderOpen,
  LayoutDashboard,
  GraduationCap,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { cn, formatTime, stableLocalUid, compressImageFile } from './utils';
import { ChatSession, Message, Department, User } from './types';
import { ClassroomPortal } from './components/ClassroomPortal';
import { EntExamSimulator } from './components/EntExamSimulator';
import { 
  chatWithSpyrisStream, 
  generateFlashcards, 
  generateQuiz,
  generateVideo,
  generateImage,
  editImage,
  analyzeVideo,
  transcribeAudio,
  ai,
  spyrisModel,
  Type,
  ThinkingLevel
} from './services/geminiService';
import { 
  auth, 
  loginWithGoogle, 
  logout, 
  getUserProfile,
  createUserProfile, 
  updateUserProfile,
  db,
  updateXP,
  createProject,
  updateProjectStatus,
  deleteProject,
  updateMark,
  handleFirestoreError,
  OperationType
} from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc, deleteDoc, updateDoc, getDocs, writeBatch } from 'firebase/firestore';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

import { FlashcardViewer } from './components/FlashcardViewer';
import { QuizViewer } from './components/QuizViewer';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surge-bg flex items-center justify-center p-8 text-center">
          <div className="max-w-md bg-surge-card p-10 rounded-[2.5rem] border-2 border-red-500/20 shadow-2xl">
            <AlertCircle size={64} className="text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-display font-bold text-surge-ink mb-4">Something went wrong</h2>
            <p className="text-surge-ink/40 text-sm mb-8 leading-relaxed">
              The neural engine encountered an unexpected error. Don't worry, your data is safe.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-surge-purple text-white font-bold py-4 rounded-2xl shadow-lg shadow-surge-purple/20 transition-all active:scale-95"
            >
              Reload Application
            </button>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-8 p-4 bg-black/10 rounded-xl text-[10px] text-red-500 text-left overflow-auto max-h-40 font-mono">
                {this.state.error?.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

import { AppLanguage, TRANSLATIONS } from './translations';

const DEPARTMENTS: { id: Department; name: string; color: string; icon: React.ReactNode }[] = [
  { id: 'General', name: 'Brain Engine', color: 'bg-surge-purple', icon: <Brain size={18} /> },
  { id: 'Classroom', name: 'Отдел класса', color: 'bg-teal-500', icon: <GraduationCap size={18} /> },
  { id: 'Marks', name: 'Баллы ЕНТ (140)', color: 'bg-amber-500', icon: <LineChart size={18} /> },
  { id: 'Flashcards', name: 'Flash Memory', color: 'bg-blue-500', icon: <Layers size={18} /> },
  { id: 'Quizzes', name: 'Knowledge Quiz', color: 'bg-pink-500', icon: <HelpCircle size={18} /> },
  { id: 'Plan', name: 'Study Architect', color: 'bg-emerald-500', icon: <Calendar size={18} /> },
  { id: 'Test', name: 'Exam Generator', color: 'bg-rose-500', icon: <FileText size={18} /> },
  { id: 'Voice', name: 'Voice Studio', color: 'bg-indigo-500', icon: <Mic size={18} /> },
  { id: 'Translator', name: 'Global Language', color: 'bg-cyan-500', icon: <Languages size={18} /> },
  { id: 'Timer', name: 'Focus Timer', color: 'bg-orange-500', icon: <TimerIcon size={18} /> },
  { id: 'SmartVideos', name: 'Smart Videos', color: 'bg-red-500', icon: <Video size={18} /> },
  { id: 'Projects', name: 'Projects Hub', color: 'bg-violet-600', icon: <FolderOpen size={18} /> },
  { id: 'Experience', name: 'Level & XP', color: 'bg-yellow-400', icon: <Trophy size={18} /> },
];

const getDeptThemeClasses = (deptId: Department) => {
  switch (deptId) {
    case 'General': return { bg: 'bg-surge-purple/20', border: 'border-surge-purple', text: 'text-surge-purple', solid: 'bg-surge-purple' };
    case 'Classroom': return { bg: 'bg-teal-500/20', border: 'border-teal-500', text: 'text-teal-400', solid: 'bg-teal-500' };
    case 'Marks': return { bg: 'bg-amber-500/20', border: 'border-amber-500', text: 'text-amber-500', solid: 'bg-amber-500' };
    case 'Flashcards': return { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-500', solid: 'bg-blue-500' };
    case 'Quizzes': return { bg: 'bg-pink-500/20', border: 'border-pink-500', text: 'text-pink-500', solid: 'bg-pink-500' };
    case 'Plan': return { bg: 'bg-emerald-500/20', border: 'border-emerald-500', text: 'text-emerald-500', solid: 'bg-emerald-500' };
    case 'Test': return { bg: 'bg-rose-500/20', border: 'border-rose-500', text: 'text-rose-500', solid: 'bg-rose-500' };
    case 'Voice': return { bg: 'bg-indigo-500/20', border: 'border-indigo-500', text: 'text-indigo-500', solid: 'bg-indigo-500' };
    case 'Translator': return { bg: 'bg-cyan-500/20', border: 'border-cyan-500', text: 'text-cyan-500', solid: 'bg-cyan-500' };
    case 'Timer': return { bg: 'bg-orange-500/20', border: 'border-orange-500', text: 'text-orange-500', solid: 'bg-orange-500' };
    case 'SmartVideos': return { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-500', solid: 'bg-red-500' };
    case 'Projects': return { bg: 'bg-indigo-600/20', border: 'border-indigo-600', text: 'text-indigo-600', solid: 'bg-indigo-600' };
    case 'Experience': return { bg: 'bg-yellow-400/20', border: 'border-yellow-400', text: 'text-yellow-400', solid: 'bg-yellow-400' };
    default: return { bg: 'bg-surge-purple/20', border: 'border-surge-purple', text: 'text-surge-purple', solid: 'bg-surge-purple' };
  }
};

const PRESET_AVATARS = [
  // Humans & Students (Original 8)
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Lily',
  
  // Superheroes
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Spiderman',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Hulk',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Thor',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Ironman',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=CaptainAmerica',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=BlackWidow',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Batman',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Superman',
  
  // Villains
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Venom',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Loki',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Thanos',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Joker',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Ultron',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Magneto',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=GreenGoblin',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=HarleyQuinn',
  
  // Animals
  'https://api.dicebear.com/7.x/big-ears/svg?seed=Dog',
  'https://api.dicebear.com/7.x/big-ears/svg?seed=Cat',
  'https://api.dicebear.com/7.x/big-ears/svg?seed=Panda',
  'https://api.dicebear.com/7.x/big-ears/svg?seed=Fox',
  'https://api.dicebear.com/7.x/big-ears/svg?seed=Owl',
  'https://api.dicebear.com/7.x/big-ears/svg?seed=Bunny',
  'https://api.dicebear.com/7.x/big-ears/svg?seed=Lion',
  'https://api.dicebear.com/7.x/big-ears/svg?seed=Tiger',
  'https://api.dicebear.com/7.x/big-ears/svg?seed=Bear',
  'https://api.dicebear.com/7.x/big-ears/svg?seed=Wolf',
  'https://api.dicebear.com/7.x/big-ears/svg?seed=Elephant',
  'https://api.dicebear.com/7.x/big-ears/svg?seed=Giraffe',
  'https://api.dicebear.com/7.x/big-ears/svg?seed=Monkey',
  'https://api.dicebear.com/7.x/big-ears/svg?seed=Koala',
  'https://api.dicebear.com/7.x/big-ears/svg?seed=Deer',
  'https://api.dicebear.com/7.x/big-ears/svg?seed=Raccoon',
];

const GeminiThinking = () => (
  <div className="flex items-center gap-3 p-4 bg-surge-purple/5 rounded-2xl border border-surge-purple/10 w-fit animate-pulse">
    <div className="relative">
      <div className="w-8 h-8 rounded-full border-2 border-surge-purple/30 border-t-surge-purple animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Aperture size={14} className="text-surge-purple" />
      </div>
    </div>
    <span className="text-xs font-bold text-surge-purple uppercase tracking-widest">Spyris is thinking...</span>
  </div>
);

const CameraModal = ({ isOpen, onClose, onCapture }: { isOpen: boolean, onClose: () => void, onCapture: (data: string, name: string) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Не удалось получить доступ к камере. Пожалуйста, проверьте разрешения.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const base64 = dataUrl.split(',')[1];
        onCapture(base64, `camera_capture_${Date.now()}.jpg`);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      <div className="relative w-full h-full max-w-2xl mx-auto flex flex-col">
        <div className="flex justify-between items-center p-4 text-white">
          <h3 className="font-bold">Камера</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 relative bg-surge-bg overflow-hidden flex items-center justify-center">
          {error ? (
            <div className="text-red-500 p-8 text-center">{error}</div>
          ) : (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="p-8 flex justify-center bg-black">
          <button 
            onClick={capture}
            disabled={!!error}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50"
          >
            <div className="w-16 h-16 rounded-full bg-white" />
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [isCameraForAvatar, setIsCameraForAvatar] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [isDeepResearch, setIsDeepResearch] = useState(false);
  const [isWebSearch, setIsWebSearch] = useState(false);
  const [isStudyMode, setIsStudyMode] = useState(false);

  // Live API States
  const [liveSession, setLiveSession] = useState<any>(null);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState("");
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackTimeRef = useRef<number>(0);
  const liveWsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const [voiceLangMode, setVoiceLangMode] = useState<'auto' | 'ru' | 'kk'>('auto');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  // STT States
  const [isVoiceTyping, setIsVoiceTyping] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [signupStep, setSignupStep] = useState<'contact' | 'verify' | 'create'>('contact');
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' });
  const [verificationCode, setVerificationCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [demoCode, setDemoCode] = useState('');

  // Role-specific Registration & Login States
  const [selectedEntryRole, setSelectedEntryRole] = useState<'student' | 'teacher' | null>(null);
  const [entryMode, setEntryMode] = useState<'signup' | 'login'>('signup');
  const [teacherRegForm, setTeacherRegForm] = useState({
    name: '',
    subject: 'Химия',
    schoolAddress: '',
    email: '',
    password: ''
  });
  const [studentRegForm, setStudentRegForm] = useState({
    name: '',
    profileSubjects: 'Химия + Биология',
    targetScore: 125,
    schoolGrade: '10 класс',
    parentContact: '',
    email: '',
    password: ''
  });
  
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('spyris_saved_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (sessions.length > 0) {
      try {
        localStorage.setItem('spyris_saved_sessions', JSON.stringify(sessions));
      } catch (e) {
        console.warn("Could not save sessions to localStorage", e);
      }
    }
  }, [sessions]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const signupInProgressRef = useRef(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light' | 'night' | 'glass' | 'neon' | 'gold' | 'silver' | 'ocean' | 'diamond'>('dark');
  const [appLanguage, setAppLanguage] = useState<AppLanguage>('ru');

  const [isLiteMode, setIsLiteMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  const [toast, setToast] = useState<{message: string, type: 'success'|'error'|'info'} | null>(null);

  const showToast = (message: string, type: 'success'|'error'|'info' = 'info') => {
    setToast({message, type});
    setTimeout(() => setToast(null), 3000);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied to clipboard!", 'success');
    } catch (err) {
      console.error('Failed to copy: ', err);
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        showToast("Copied to clipboard!", 'success');
      } catch (err2) {
        showToast("Failed to copy to clipboard.", 'error');
      }
      document.body.removeChild(textArea);
    }
  };

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          if (firebaseUser.isAnonymous) {
            const guestProfile: User = {
              uid: firebaseUser.uid,
              name: 'Guest',
              email: '',
              role: 'student',
              xp: 0,
              level: 1,
              rank: 'Guest',
              badges: [],
              testsCompleted: 0
            };
            setUser(guestProfile);
            setXp(0);
            setLevel(1);
            setAchievements([]);
          } else {
            // If signup form is in progress, skip listener logic — the registration form writes the profile and sets user
            if (signupInProgressRef.current) {
              return;
            }
            let profile = await getUserProfile(firebaseUser.uid);
            if (!profile) {
              profile = await createUserProfile(firebaseUser);
            }
            if (profile) {
              setUser(profile as User);
              setXp(profile?.xp || 0);
              setLevel(profile?.level || 1);
              setAchievements(profile?.badges || []);
            }
          }
        } else {
          const savedLocal = localStorage.getItem('spyris_local_user');
          if (savedLocal) {
            try {
              setUser(JSON.parse(savedLocal));
            } catch (e) {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Auth listener error:", error);
        setAuthError("Failed to load user profile. Please try again.");
      } finally {
        setIsAuthLoading(false);
        setIsAuthReady(true);
      }
    });
    return () => unsubscribe();
  }, []);

  // User Profile Listener
  useEffect(() => {
    if (!user?.uid || user.uid.startsWith('guest_') || user.uid.startsWith('user_') || !auth.currentUser) return;
    if (auth.currentUser.uid !== user.uid) return;
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const profile = snapshot.data() as User;
        setUser(profile);
        setXp(profile.xp || 0);
        setLevel(profile.level || 1);
        setAchievements(profile.badges || []);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });
    return () => unsubscribe();
  }, [user?.uid, user?.name]);

  // Load full messages for current session from subcollection
  useEffect(() => {
    if (!user || user.uid.startsWith('guest_') || !auth.currentUser || !currentSessionId) return;
    
    const loadMessages = async () => {
      try {
        const messagesCollection = collection(db, 'sessions', currentSessionId, 'messages');
        const q = query(messagesCollection, orderBy('timestamp', 'asc'));
        const snapshot = await getDocs(q);
        const fullMessages = snapshot.docs.map(doc => doc.data() as Message);
        
        if (fullMessages.length > 0) {
          setSessions(prev => prev.map(s => {
            if (s.id === currentSessionId) {
              // Only update if we fetched more messages, or if it's the initial load
              if (fullMessages.length >= s.messages.length) {
                return { ...s, messages: fullMessages };
              }
            }
            return s;
          }));
        }
      } catch (error) {
        console.error("Error loading full messages:", error);
      }
    };
    
    loadMessages();
  }, [currentSessionId, user]);

  // Firestore Sessions Listener
  useEffect(() => {
    if (!user || user.uid.startsWith('guest_') || user.uid.startsWith('user_') || !auth.currentUser || auth.currentUser.uid !== user.uid) return;
    const q = query(
      collection(db, 'sessions'),
      where('uid', '==', user.uid),
      orderBy('lastUpdated', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ChatSession));
      
      setSessions(prev => {
        // Merge logic to prevent local state being overwritten by stale server data
        const merged = [...sessionList];
        prev.forEach(local => {
          const remoteIdx = merged.findIndex(r => r.id === local.id);
          if (remoteIdx !== -1) {
            const remote = merged[remoteIdx];
            // If local has more messages, or the same number but local is newer/longer content
            const localMsgCount = local.messages.length;
            const remoteMsgCount = remote.messages.length;
            
            if (localMsgCount > remoteMsgCount) {
              merged[remoteIdx] = local;
            } else if (localMsgCount === remoteMsgCount && localMsgCount > 0) {
              const localLastMsg = local.messages[localMsgCount - 1];
              const remoteLastMsg = remote.messages[remoteMsgCount - 1];
              
              // If local content is longer and it's a model message (streaming)
              if (localLastMsg.role === 'model' && localLastMsg.content.length > remoteLastMsg.content.length) {
                merged[remoteIdx] = local;
              } else if ((local.lastUpdated || 0) > (remote.lastUpdated || 0)) {
                merged[remoteIdx] = local;
              }
            }
          } else {
            // New local session not yet in Firestore
            merged.push(local);
          }
        });
        return merged.sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'sessions');
    });
    return () => unsubscribe();
  }, [user]);



  useEffect(() => {
    document.body.className = '';
    if (theme !== 'dark') {
      document.body.classList.add(theme);
    }
  }, [theme]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<Department>('General');
  
  // Specialized Department States
  const [profileSubject1, setProfileSubject1] = useState('Физика');
  const [profileSubject2, setProfileSubject2] = useState('Математика (Профиль)');
  const [marksData, setMarksData] = useState<Record<string, string>>({
    'История Казахстана (макс. 20)': '',
    'Математическая грамотность (макс. 10)': '',
    'Грамотность чтения (макс. 10)': '',
    'Профильный предмет 1 (Физика) (макс. 50)': '',
    'Профильный предмет 2 (Математика) (макс. 50)': ''
  });
  const [completedQuests, setCompletedQuests] = useState<string[]>([]);
  const [flashcardsData, setFlashcardsData] = useState({ grade: 'ЕНТ', topic: '', count: 10 });
  const [quizzesData, setQuizzesData] = useState({ grade: 'ЕНТ', topic: '', count: 10 });
  const [planGoal, setPlanGoal] = useState('');
  const [planResult, setPlanResult] = useState<string | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [testData, setTestData] = useState({ subject: 'История Казахстана (макс. 20)', topic: '', difficulty: 'Medium' });
  const [marksAnalysisResult, setMarksAnalysisResult] = useState<string | null>(null);
  const [marksDescription, setMarksDescription] = useState('');
  const [isAnalyzingMarks, setIsAnalyzingMarks] = useState(false);
  const [translatorData, setTranslatorData] = useState({ text: '', sourceLang: 'Russian', targetLang: 'English' });
  const [translatorMode, setTranslatorMode] = useState<'translate' | 'psychologist'>('translate');
  const [translatorResult, setTranslatorResult] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [psychologistData, setPsychologistData] = useState({ problem: '', mood: 'Stressed', approach: 'Supportive' });
  const [smartVideosData, setSmartVideosData] = useState({ classLevel: 'Математика (Профиль)', topic: '', description: '' });
  const [suggestedVideos, setSuggestedVideos] = useState<{id: string, title: string, desc: string}[] | null>(null);
  const [isFetchingVideos, setIsFetchingVideos] = useState(false);
  const [projects, setProjects] = useState<{id: string, name: string, status: 'In Progress' | 'Completed', deadline: string}[]>([]);
  const [newProject, setNewProject] = useState({ name: '', deadline: '' });
  const [disabledSubjects, setDisabledSubjects] = useState<string[]>([]);
  
  // URL context for content generation
  const [contentUrl, setContentUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, data: string, type: string}[]>([]);
  const [previewFile, setPreviewFile] = useState<{name: string, data: string, type: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  // Timer States
  const [timerMode, setTimerMode] = useState<'study' | 'break'>('study');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSettings, setTimerSettings] = useState({
    study: 25 * 60, // 25 minutes
    break: 5 * 60   // 5 minutes
  });
  const [timerTimeLeft, setTimerTimeLeft] = useState(25 * 60);
  const [isFloatingTimerVisible, setIsFloatingTimerVisible] = useState(true);

  // Firestore Projects Listener
  useEffect(() => {
    if (!user || user.uid.startsWith('guest_') || user.uid.startsWith('user_') || !auth.currentUser || auth.currentUser.uid !== user.uid) {
      if (!user) setProjects([]);
      return;
    }
    const q = query(
      collection(db, 'projects'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectList = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().title, 
        status: doc.data().status, 
        deadline: doc.data().deadline || 'No deadline' 
      } as any));
      setProjects(projectList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
    });
    return () => unsubscribe();
  }, [user]);

  // Firestore Marks Listener
  useEffect(() => {
    if (!user || user.uid.startsWith('guest_') || user.uid.startsWith('user_') || !auth.currentUser || auth.currentUser.uid !== user.uid) return;
    const q = query(
      collection(db, 'marks'),
      where('uid', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const marks: Record<string, string> = { ...marksData };
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        marks[data.subject] = data.value.toString();
      });
      setMarksData(marks);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'marks');
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (isTimerRunning) {
      setIsFloatingTimerVisible(true);
    }
  }, [isTimerRunning]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const isImageFile = (f: File) => {
      if (f.type && f.type.startsWith('image/')) return true;
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'heic', 'heif'].includes(ext);
    };

    const imageFiles = files.filter(isImageFile);
    const docFiles = files.filter(f => !isImageFile(f));

    if (imageFiles.length > 0) {
      // Create a synthetic event to reuse handleImageUpload
      const syntheticEvent = { target: { files: imageFiles } } as unknown as React.ChangeEvent<HTMLInputElement>;
      await handleImageUpload(syntheticEvent);
    }

    if (docFiles.length > 0) {
      const newDocs: {name: string, data: string, type: string}[] = [];
      
      for (const file of docFiles) {
        if (file.size > 100 * 1024 * 1024) {
          showToast(`File ${file.name} is too large. Max size is 100MB.`, 'error');
          continue;
        }
        const promise = new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64Data = event.target?.result as string;
            
            let mimeType = file.type;
            if (!mimeType || mimeType === 'application/octet-stream') {
              const extension = file.name.split('.').pop()?.toLowerCase();
              const mimeMap: Record<string, string> = {
                'pdf': 'application/pdf',
                'txt': 'text/plain',
                'md': 'text/markdown',
                'markdown': 'text/markdown',
                'js': 'text/javascript',
                'py': 'text/x-python',
                'html': 'text/html',
                'css': 'text/css',
                'json': 'application/json',
                'csv': 'text/csv',
                'xml': 'application/xml',
                'rtf': 'text/rtf'
              };
              mimeType = mimeMap[extension || ''] || 'text/plain'; // Default to text/plain instead of octet-stream
            }

            newDocs.push({
              name: file.name,
              data: base64Data.split(',')[1],
              type: mimeType
            });
            resolve();
          };
          reader.readAsDataURL(file);
        });
        await promise;
      }
      
      setUploadedFiles(prev => [...prev, ...newDocs]);
      showToast(`${docFiles.length} file(s) uploaded successfully!`, 'success');
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const checkAndAwardAchievement = (achievementId: string) => {
    if (!achievements.includes(achievementId)) {
      const newAchievements = [...achievements, achievementId];
      setAchievements(newAchievements);
      syncAchievements(newAchievements);
      showToast(`Achievement Unlocked: ${ALL_ACHIEVEMENTS[achievementId].name}!`, 'success');
    }
  };

  const syncAchievements = async (newAchievements: string[]) => {
    if (!user || user.name === 'Guest' || !user.uid) return;
    try {
      await setDoc(doc(db, 'users', user.uid), { badges: newAchievements }, { merge: true });
    } catch (e) {
      console.warn("Notice: sync achievements saved locally", e);
    }
  };

  const addXp = async (amount: number) => {
    const newXp = xp + amount;
    const newLevel = Math.floor(newXp / 1000) + 1;
    setXp(newXp);
    if (newLevel > level) {
      setLevel(newLevel);
      if (newLevel === 5) checkAndAwardAchievement('LEVEL_5');
      if (newLevel === 10) checkAndAwardAchievement('LEVEL_10');
    }
    if (user && user.name !== 'Guest') {
      try {
        await updateXP(user.uid, amount);
      } catch (e) {
        console.error("Failed to sync experience", e);
      }
    }
  };

  // Timer Effect
  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timerTimeLeft > 0) {
      interval = setInterval(() => {
        setTimerTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timerTimeLeft === 0) {
      setIsTimerRunning(false);
      const nextMode = timerMode === 'study' ? 'break' : 'study';
      setTimerMode(nextMode);
      setTimerTimeLeft(timerSettings[nextMode]);
      
      if (timerMode === 'study') {
        addXp(50); // Reward for finishing a study session
        showToast("Study session complete! Time for a break.", 'success');
      } else {
        showToast("Break over! Time to get back to work.", 'info');
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerTimeLeft, timerMode, timerSettings]);

  const formatTimerTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkInput, setLinkInput] = useState('');

  // Subscription States
  const [showSubscription, setShowSubscription] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'plan' | 'checkout'>('plan');
  const [selectedPlan, setSelectedPlan] = useState<'Pro' | 'Plus'>('Pro');
  const [paymentForm, setPaymentForm] = useState({ cardNumber: '', cardName: '', cvv: '' });
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auth Check
  useEffect(() => {
    // Relying on onAuthStateChanged for Firebase Auth
  }, []);

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const syncSessions = async (updatedSessions: ChatSession[], sessionIdToSync: string) => {
    if (!user || user.name === 'Guest' || user.uid.startsWith('guest_') || !auth.currentUser) return;

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        const sessionToSync = updatedSessions.find(s => s.id === sessionIdToSync);
        if (!sessionToSync) return;

        let messagesToSync = sessionToSync.messages.map(m => ({ ...m }));
        const MAX_DOC_SIZE = 950000;
        
        const estimateSize = (msgs: any[]) => JSON.stringify(msgs).length;
        
        if (estimateSize(messagesToSync) > MAX_DOC_SIZE) {
          console.warn("Session too large, stripping attachments from old messages");
          for (let i = 0; i < messagesToSync.length - 3; i++) {
            if (messagesToSync[i].attachments) delete messagesToSync[i].attachments;
            if (messagesToSync[i].image) delete messagesToSync[i].image;
          }
          if (estimateSize(messagesToSync) > MAX_DOC_SIZE) {
            while (messagesToSync.length > 1 && estimateSize(messagesToSync) > MAX_DOC_SIZE) {
              messagesToSync.shift();
            }
          }
          if (messagesToSync.length > 0 && estimateSize(messagesToSync) > MAX_DOC_SIZE) {
            const lastMsg = messagesToSync[messagesToSync.length - 1];
            if (lastMsg.attachments) delete lastMsg.attachments;
            if (lastMsg.image) delete lastMsg.image;
            if (estimateSize(messagesToSync) > MAX_DOC_SIZE) {
              const overhead = estimateSize([{ ...lastMsg, content: "" }]);
              const availableSpace = MAX_DOC_SIZE - overhead;
              if (availableSpace > 0) {
                lastMsg.content = lastMsg.content.slice(0, availableSpace);
              } else {
                messagesToSync = [];
              }
            }
          }
        }

        const batch = writeBatch(db);
        const sessionDocRef = doc(db, 'sessions', sessionToSync.id);
        
        batch.set(sessionDocRef, {
          id: sessionToSync.id,
          uid: user.uid,
          title: sessionToSync.title || 'New Session',
          department: sessionToSync.department || 'General',
          lastUpdated: Date.now(),
          createdAt: sessionToSync.createdAt || Date.now(),
          isArchived: sessionToSync.isArchived ?? false,
          type: sessionToSync.type || 'chat',
          messages: messagesToSync
        }, { merge: true });

        const messagesCollection = collection(db, 'sessions', sessionToSync.id, 'messages');
        const messagesToSave = sessionToSync.messages.slice(-5);
        
        for (const msg of messagesToSave) {
          const msgWithSessionId = { ...msg, sessionId: sessionToSync.id };
          batch.set(doc(messagesCollection, msg.id), msgWithSessionId, { merge: true });
        }
        
        await batch.commit();
      } catch (error) {
        console.error("Error syncing session:", error);
      }
    }, 1000); // 1-second debounce
  };

  // Experience States
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [achievements, setAchievements] = useState<string[]>([]);

  const ALL_ACHIEVEMENTS: Record<string, { name: string; description: string; icon: React.ReactNode }> = {
    LEVEL_5: { name: "Novice Scholar", description: "Reach level 5.", icon: <Award size={24} /> },
    LEVEL_10: { name: "Adept Learner", description: "Reach level 10.", icon: <Trophy size={24} /> },
    FIRST_PROJECT: { name: "Project Initiator", description: "Create your first project.", icon: <FileText size={24} /> },
  };

  const getAuthErrorMessage = (err: any): string => {
    const code = err?.code || '';
    if (code === 'auth/email-already-in-use') {
      return 'Этот email уже зарегистрирован. Переключитесь на вкладку «Войти в аккаунт».';
    }
    if (code === 'auth/invalid-email') {
      return 'Неверный формат email адреса.';
    }
    if (code === 'auth/weak-password') {
      return 'Пароль слишком слабый. Используйте минимум 6 символов.';
    }
    if (code === 'auth/too-many-requests') {
      return 'Слишком много попыток. Пожалуйста, подождите некоторое время и попробуйте снова.';
    }
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      return 'Неверный email или пароль. Если вы регистрировались раньше, когда облачный вход не работал, зарегистрируйтесь заново.';
    }
    if (code === 'auth/user-not-found') {
      return 'Пользователь с таким email не найден. Пройдите регистрацию.';
    }
    if (code === 'auth/network-request-failed') {
      return 'Ошибка сети. Проверьте подключение к интернету.';
    }
    if (code === 'auth/operation-not-allowed') {
      return "Вход по Email/Паролю не включен в Firebase! Чтобы это исправить, перейдите в Firebase Console -> Authentication -> вкладка Sign-in method -> и включите провайдер 'Email/Password'.";
    }
    return err?.message || 'Ошибка авторизации. Пожалуйста, проверьте данные.';
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    try {
      if (authMode === 'signup') {
        if (!authForm.email || !authForm.password) {
          setAuthError('Please enter an email and password');
          return;
        }
        
        // Simple email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(authForm.email)) {
          setAuthError('Please enter a valid email address');
          return;
        }

        if (authForm.password.length < 6) {
          setAuthError('Password must be at least 6 characters long');
          return;
        }

        signupInProgressRef.current = true;
        // Firebase Auth signup
        const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
        const userCredential = await createUserWithEmailAndPassword(auth, authForm.email, authForm.password);
        const displayName = authForm.name || authForm.email.split('@')[0];
        await updateProfile(userCredential.user, { displayName });
        const profile: User = {
          uid: userCredential.user.uid,
          name: displayName,
          email: authForm.email,
          role: 'student',
          level: 1,
          xp: 0,
          rank: 'Кандидат на Грант',
          badges: ['ENT_PIONEER'],
          testsCompleted: 0,
          targetEntScore: 125,
          currentEntScore: 85
        };
        await updateUserProfile(userCredential.user.uid, profile);
        setUser(profile);
      } else {
        if (!authForm.email || !authForm.password) {
          setAuthError('Please enter your email and password');
          return;
        }
        // Firebase Auth login
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        const userCred = await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
        const profile = await getUserProfile(userCred.user.uid);
        if (profile) {
          setUser(profile as User);
          setXp(profile.xp || 0);
          setLevel(profile.level || 1);
        }
      }
    } catch (e: any) {
      console.error("Auth error:", e);
      setAuthError(getAuthErrorMessage(e));
    } finally {
      signupInProgressRef.current = false;
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setAuthError('');
      await loginWithGoogle();
    } catch (e: any) {
      console.error("Google login error:", e);
      let message = e.message || "Google login failed";
      if (e.code === 'auth/operation-not-allowed') {
        message = "Вход через Google не включен! Перейдите в Firebase Console -> Authentication -> Sign-in method и включите провайдер 'Google'.";
      } else if (e.message && e.message.includes('всплывающее окно')) {
        message = e.message;
      }
      setAuthError(message);
    }
  };

  const handleTeacherAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const teacherName = teacherRegForm.name.trim();
    const teacherSubject = teacherRegForm.subject.trim() || 'Химия';
    const schoolAddr = teacherRegForm.schoolAddress.trim() || 'Школа ЕНТ';
    const email = teacherRegForm.email.trim();
    const password = teacherRegForm.password.trim();

    if (entryMode === 'signup') {
      if (!teacherName) {
        setAuthError('Пожалуйста, введите ваше ФИО');
        return;
      }
      if (!email || !password) {
        setAuthError('Введите email и пароль для входа');
        return;
      }
      if (password.length < 6) {
        setAuthError('Пароль должен содержать минимум 6 символов');
        return;
      }

      try {
        signupInProgressRef.current = true;
        const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, { displayName: teacherName });
        const profile: User = {
          uid: userCred.user.uid,
          name: teacherName,
          email,
          role: 'teacher',
          teacherSubject,
          school: schoolAddr,
          xp: 5000,
          level: 10,
          rank: `Преподаватель ЕНТ: ${teacherSubject}`,
          badges: ['TEACHER_PRO', 'MENTOR'],
          targetEntScore: 140,
          currentEntScore: 140
        };
        await updateUserProfile(userCred.user.uid, profile);
        setUser(profile);
        setSelectedDept('Classroom');
        setSelectedEntryRole(null);
        showToast(`Добро пожаловать, ${teacherName}! Кабинет учителя открыт.`, 'success');
      } catch (err: any) {
        if (err.code !== 'auth/operation-not-allowed' && err.code !== 'auth/network-request-failed') {
          setAuthError(getAuthErrorMessage(err));
          return;
        }
        console.warn("Using local teacher profile fallback:", err);
        const uid = stableLocalUid('teacher', email);
        const localProfile: User = {
          uid,
          name: teacherName,
          email,
          role: 'teacher',
          teacherSubject,
          school: schoolAddr,
          xp: 5000,
          level: 10,
          rank: `Преподаватель ЕНТ: ${teacherSubject}`,
          badges: ['TEACHER_PRO', 'MENTOR'],
          targetEntScore: 140,
          currentEntScore: 140
        };
        try {
          localStorage.setItem(`spyris_local_profile_${uid}`, JSON.stringify(localProfile));
          localStorage.setItem('spyris_local_user', JSON.stringify(localProfile));
        } catch {}
        setUser(localProfile);
        setSelectedDept('Classroom');
        setSelectedEntryRole(null);
        showToast(`Добро пожаловать, ${teacherName}! Кабинет учителя открыт.`, 'success');
      } finally {
        signupInProgressRef.current = false;
      }
    } else {
      // login mode
      if (!email || !password) {
        setAuthError('Введите email и пароль');
        return;
      }
      try {
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        const profile = await getUserProfile(userCred.user.uid);
        if (profile) {
          setUser(profile as User);
          setXp(profile.xp || 0);
          setLevel(profile.level || 1);
        }
        setSelectedDept('Classroom');
        setSelectedEntryRole(null);
        showToast('Вход в кабинет учителя выполнен!', 'success');
        return;
      } catch (err: any) {
        if (err.code !== 'auth/operation-not-allowed' && err.code !== 'auth/network-request-failed') {
          setAuthError(getAuthErrorMessage(err));
          return;
        }
        console.warn("Using local teacher profile fallback:", err);
        const uid = stableLocalUid('teacher', email);
        let localProfile: User | null = null;
        try {
          const saved = localStorage.getItem(`spyris_local_profile_${uid}`);
          if (saved) localProfile = JSON.parse(saved);
        } catch {}
        if (!localProfile) {
          localProfile = {
            uid,
            name: teacherName || email.split('@')[0] || 'Преподаватель ЕНТ',
            email,
            role: 'teacher',
            teacherSubject,
            school: schoolAddr,
            xp: 5000,
            level: 10,
            rank: `Преподаватель ЕНТ: ${teacherSubject}`,
            badges: ['TEACHER_PRO'],
            targetEntScore: 140,
            currentEntScore: 140
          };
        }
        setUser(localProfile);
        try {
          localStorage.setItem(`spyris_local_profile_${uid}`, JSON.stringify(localProfile));
          localStorage.setItem('spyris_local_user', JSON.stringify(localProfile));
        } catch {}
        setSelectedDept('Classroom');
        setSelectedEntryRole(null);
        showToast('Вход в кабинет учителя выполнен!', 'success');
      }
    }
  };

  const handleStudentAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const studentName = studentRegForm.name.trim();
    const profileSubs = studentRegForm.profileSubjects.trim() || 'Химия + Биология';
    const targetScore = Number(studentRegForm.targetScore) || 125;
    const schoolGrade = studentRegForm.schoolGrade.trim() || '10 класс';
    const parentContact = studentRegForm.parentContact.trim();
    const email = studentRegForm.email.trim();
    const password = studentRegForm.password.trim();

    if (entryMode === 'signup') {
      if (!studentName) {
        setAuthError('Пожалуйста, укажите ваше имя и фамилию (ФИО)');
        return;
      }
      if (!email || !password) {
        setAuthError('Введите email и пароль');
        return;
      }
      if (password.length < 6) {
        setAuthError('Пароль должен быть не менее 6 символов');
        return;
      }

      try {
        signupInProgressRef.current = true;
        const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, { displayName: studentName });
        const profile: User = {
          uid: userCred.user.uid,
          name: studentName,
          email,
          role: 'student',
          school: schoolGrade,
          parentContact,
          targetEntScore: targetScore,
          currentEntScore: 85,
          xp: 1200,
          level: 2,
          rank: 'Кандидат на Грант',
          badges: ['ENT_PIONEER']
        };
        await updateUserProfile(userCred.user.uid, profile);
        setUser(profile);
        setSelectedDept('Classroom');
        setSelectedEntryRole(null);
        showToast(`Добро пожаловать, ${studentName}! Удачной подготовки к ЕНТ.`, 'success');
      } catch (err: any) {
        if (err.code !== 'auth/operation-not-allowed' && err.code !== 'auth/network-request-failed') {
          setAuthError(getAuthErrorMessage(err));
          return;
        }
        console.warn("Using local student profile fallback:", err);
        const uid = stableLocalUid('student', email);
        const localProfile: User = {
          uid,
          name: studentName,
          email,
          role: 'student',
          school: schoolGrade,
          parentContact,
          targetEntScore: targetScore,
          currentEntScore: 85,
          xp: 1200,
          level: 2,
          rank: 'Кандидат на Грант',
          badges: ['ENT_PIONEER']
        };
        try {
          localStorage.setItem(`spyris_local_profile_${uid}`, JSON.stringify(localProfile));
          localStorage.setItem('spyris_local_user', JSON.stringify(localProfile));
        } catch {}
        setUser(localProfile);
        setSelectedDept('Classroom');
        setSelectedEntryRole(null);
        showToast(`Добро пожаловать, ${studentName}! Удачной подготовки к ЕНТ.`, 'success');
      } finally {
        signupInProgressRef.current = false;
      }
    } else {
      // login mode
      if (!email || !password) {
        setAuthError('Введите email и пароль');
        return;
      }
      try {
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        const profile = await getUserProfile(userCred.user.uid);
        if (profile) {
          setUser(profile as User);
          setXp(profile.xp || 0);
          setLevel(profile.level || 1);
        }
        setSelectedDept('Classroom');
        setSelectedEntryRole(null);
        showToast('Вход в аккаунт ученика выполнен!', 'success');
        return;
      } catch (err: any) {
        if (err.code !== 'auth/operation-not-allowed' && err.code !== 'auth/network-request-failed') {
          setAuthError(getAuthErrorMessage(err));
          return;
        }
        console.warn("Using local student profile fallback:", err);
        const uid = stableLocalUid('student', email);
        let localProfile: User | null = null;
        try {
          const saved = localStorage.getItem(`spyris_local_profile_${uid}`);
          if (saved) localProfile = JSON.parse(saved);
        } catch {}
        if (!localProfile) {
          localProfile = {
            uid,
            name: studentName || email.split('@')[0] || 'Ученик ЕНТ',
            email,
            role: 'student',
            school: schoolGrade,
            targetEntScore: 125,
            currentEntScore: 85,
            xp: 1200,
            level: 2,
            rank: 'Кандидат на Грант',
            badges: ['ENT_PIONEER']
          };
        }
        setUser(localProfile);
        try {
          localStorage.setItem(`spyris_local_profile_${uid}`, JSON.stringify(localProfile));
          localStorage.setItem('spyris_local_user', JSON.stringify(localProfile));
        } catch {}
        setSelectedDept('Classroom');
        setSelectedEntryRole(null);
        showToast('Вход в аккаунт ученика выполнен!', 'success');
      }
    }
  };

  const handleQuickRoleLogin = async (role: 'student' | 'teacher', customSubject?: string) => {
    setAuthError('');
    const isTeacher = role === 'teacher';
    const teacherSubj = customSubject || 'Химия';
    const guestProfile: User = {
      uid: 'guest_' + (isTeacher ? 'teacher_' : 'student_') + Date.now(),
      name: isTeacher ? `Касымов Арман (${teacherSubj})` : 'Алихан Сейткали (Ученик)',
      email: isTeacher ? `teacher.${teacherSubj.toLowerCase()}@ent.kz` : 'student.alihan@ent.kz',
      role,
      xp: isTeacher ? 5000 : 2450,
      level: isTeacher ? 10 : 3,
      rank: isTeacher ? `Преподаватель ЕНТ: ${teacherSubj}` : 'Кандидат на Грант',
      badges: isTeacher ? ['TEACHER_PRO', 'MENTOR'] : ['ENT_PIONEER', 'TEST_PRO'],
      testsCompleted: isTeacher ? 0 : 4,
      targetEntScore: 130,
      currentEntScore: 108,
      teacherSubject: isTeacher ? teacherSubj : undefined,
      parentContact: isTeacher ? undefined : '+7 (777) 345-67-89',
      parentName: isTeacher ? undefined : 'Айгуль Сериковна (Мама)'
    };
    setUser(guestProfile);
    setXp(guestProfile.xp);
    setLevel(guestProfile.level);
    setAchievements(guestProfile.badges);
    setIsAuthReady(true);
    setSelectedEntryRole(null);
    if (isTeacher) {
      setSelectedDept('Classroom');
    }
    showToast(isTeacher ? `Вход в режиме Учителя: ${teacherSubj}` : 'Вход в режиме Ученика ЕНТ', 'success');
  };

  const handleGuestLogin = async () => {
    await handleQuickRoleLogin('student');
  };

  const handleToggleUserRole = () => {
    if (!user) return;
    const newRole = user.role === 'teacher' ? 'student' : 'teacher';
    const updated: User = {
      ...user,
      role: newRole,
      rank: newRole === 'teacher' ? 'Преподаватель-эксперт ЕНТ' : 'Кандидат на Грант',
      teacherSubject: newRole === 'teacher' ? (user.teacherSubject || 'Физика и Математика') : user.teacherSubject
    };
    setUser(updated);
    if (newRole === 'teacher') {
      setSelectedDept('Classroom');
    }
    showToast(`Переключено в режим: ${newRole === 'teacher' ? '👨‍🏫 Учитель-куратор' : '🎓 Ученик ЕНТ'}`, 'info');
  };

  const handleUpdateUser = (updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  const handleAddXp = (amount: number) => {
    setXp(prev => {
      const next = prev + amount;
      if (user?.uid && !user.uid.startsWith('guest_')) {
        updateXP(user.uid, amount);
      }
      return next;
    });
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('spyris_local_user');
    } catch {}
    await logout();
    setUser(null);
    setSessions([]);
    setCurrentSessionId(null);
  };

  const playMessage = (text: string) => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const cleanText = text.replace(/[*_#`\[\]()]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        if (/[әіңғүұқөһӘІҢҒҮҰҚӨҺ]/.test(cleanText)) {
          utterance.lang = 'kk-KZ';
        } else if (/[а-яА-ЯёЁ]/.test(cleanText)) {
          utterance.lang = 'ru-RU';
        } else {
          utterance.lang = 'en-US';
        }

        const voices = window.speechSynthesis.getVoices();
        const targetVoice = voices.find(v => v.lang.startsWith(utterance.lang.slice(0, 2)));
        if (targetVoice) {
          utterance.voice = targetVoice;
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.error("Speech error", e);
    }
  };

  const startLiveSession = async () => {
    try {
      // First clean up any existing session
      stopLiveSession();

      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      setAudioContext(ctx);

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
      });
      mediaStreamRef.current = stream;

      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      const wsUrl = window.location.protocol === 'https:' ? `wss://${window.location.host}/api/gemini/live` : `ws://${window.location.host}/api/gemini/live`;
      const ws = new WebSocket(wsUrl);
      liveWsRef.current = ws;
      
      const session = {
        sendRealtimeInput: (input: any) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'audio', ...input.audio }));
          }
        }
      };
      
      // Strict language instruction based on user language
      let strictLang = "";
      if (voiceLangMode === 'ru') {
        strictLang = "ТЫ ОБЯЗАН РАЗГОВАРИВАТЬ И ОТВЕЧАТЬ ИСКЛЮЧИТЕЛЬНО НА РУССКОМ ЯЗЫКЕ. Ни в коем случае не используй английский язык или другие языки. Все реплики строго на чистом русском.";
      } else if (voiceLangMode === 'kk') {
        strictLang = "СЕН БАРЛЫҚ ЖАУАПТЫ ТЕК ҚАНА ҚАЗАҚ ТІЛІНДЕ БЕРУГЕ ТИІССІҢ. Ешбір жағдайда ағылшын тіліне ауыспа. Барлық дауыстық сөздерің тек қазақша болуы керек.";
      } else {
        const preferred = appLanguage === 'kk' ? 'Kazakh (қазақша)' : appLanguage === 'ru' ? 'Russian (русский)' : 'English';
        strictLang = `СВЕРХВАЖНОЕ ПРАВИЛО ЯЗЫКА (ВЫСШИЙ ПРИОРИТЕТ):
Ты ОБЯЗАН отвечать СТРОГО на том же языке, на котором к тебе обратился ученик.
- Если ученик говорит по-русски — отвечай ТОЛЬКО по-русски. Ни в коем случае не переключайся на английский!
- Если ученик говорит по-казахски — отвечай ТОЛЬКО по-казахски (қазақ тілінде). Ни в коем случае не переключайся на английский!
- Если ученик говорит по-английски — отвечай по-английски.
- Если ученик только подключился или сказал короткое приветствие, основной язык: ${preferred}. Отвечай на ${preferred}.`;
      }

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'connect',
          model: "gemini-3.8-live",
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
            },
            systemInstruction: `Ты Spyris — доброжелательный, спокойный образовательный голосовой собеседник и репетитор для подготовки к ЕНТ (ҰБТ). Отвечай естественно, кратко и поддерживай студента (1-3 емких предложения).
${strictLang}`,
          }
        }));
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'ready') {
          setIsLiveActive(true);
          setLiveTranscription("");
          
          processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmData = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
            }
            
            // Silence the output buffer to prevent echo
            const outputData = e.outputBuffer.getChannelData(0);
            for (let i = 0; i < outputData.length; i++) {
              outputData[i] = 0;
            }

            const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
            session.sendRealtimeInput({
              audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
            });
          };
          source.connect(processor);
          processor.connect(ctx.destination);
        } else if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
          const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
          const binaryString = atob(base64Audio);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const pcmData = new Int16Array(bytes.buffer);
          const floatData = new Float32Array(pcmData.length);
          for (let i = 0; i < pcmData.length; i++) {
            floatData[i] = pcmData[i] / 0x7FFF;
          }
          const buffer = ctx.createBuffer(1, floatData.length, 24000);
          buffer.getChannelData(0).set(floatData);
          const playSource = ctx.createBufferSource();
          playSource.buffer = buffer;
          playSource.connect(ctx.destination);
          
          activeSourcesRef.current.push(playSource);
          setIsAiSpeaking(true);

          playSource.onended = () => {
            activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== playSource);
            if (activeSourcesRef.current.length === 0) {
              setIsAiSpeaking(false);
            }
          };

          // Schedule playback to prevent overlapping audio
          const startTime = Math.max(playbackTimeRef.current, ctx.currentTime);
          playSource.start(startTime);
          playbackTimeRef.current = startTime + buffer.duration;
        }

        if (message.serverContent?.interrupted) {
          // Model was interrupted by user voice: stop all queued/playing audio immediately
          activeSourcesRef.current.forEach(source => {
            try { source.stop(0); source.disconnect(); } catch {}
          });
          activeSourcesRef.current = [];
          playbackTimeRef.current = ctx.currentTime;
          setIsAiSpeaking(false);
        }

        if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
          setLiveTranscription(prev => prev + " " + message.serverContent.modelTurn.parts[0].text);
        }
      };

      ws.onclose = () => {
        setIsLiveActive(false);
        setLiveSession(null);
        setIsAiSpeaking(false);
        processorRef.current?.disconnect();
      };

      ws.onerror = (e) => {
        console.error("Live error:", e);
        setIsLiveActive(false);
        setLiveSession(null);
        setIsAiSpeaking(false);
        processorRef.current?.disconnect();
        showToast("Ошибка подключения к голосовому серверу.", "error");
      };

      setLiveSession(session);
    } catch (e: any) {
      console.error("Failed to start live session:", e);
      if (e.name === 'NotAllowedError' || e.message?.includes('Permission denied')) {
        showToast("Пожалуйста, разрешите доступ к микрофону в настройках браузера.", "error");
      } else {
        showToast("Произошла ошибка при запуске голосового помощника.", "error");
      }
    }
  };

  const stopLiveSession = () => {
    // 1. Immediately silence all active and scheduled audio output
    try {
      activeSourcesRef.current.forEach(source => {
        try {
          source.stop(0);
          source.disconnect();
        } catch {}
      });
      activeSourcesRef.current = [];
    } catch {}
    playbackTimeRef.current = 0;
    setIsAiSpeaking(false);

    // 2. Also stop window.speechSynthesis if it was active
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch {}

    // 3. Immediately stop microphone stream tracks (removes browser recording dot)
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach(track => {
          try { track.stop(); } catch {}
        });
      } catch {}
      mediaStreamRef.current = null;
    }

    // 4. Disconnect audio processor
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {}
      processorRef.current = null;
    }

    // 5. Close audio context
    if (audioContext) {
      try {
        if (audioContext.state !== 'closed') {
          audioContext.close().catch(() => {});
        }
      } catch {}
      setAudioContext(null);
    }

    // 6. Close WebSocket cleanly
    if (liveWsRef.current) {
      try {
        if (liveWsRef.current.readyState === WebSocket.OPEN || liveWsRef.current.readyState === WebSocket.CONNECTING) {
          liveWsRef.current.close();
        }
      } catch {}
      liveWsRef.current = null;
    }

    // 7. Reset state
    setIsLiveActive(false);
    setLiveSession(null);
  };

  const toggleVoiceTyping = () => {
    if (isVoiceTyping) {
      recognitionRef.current?.stop();
      setIsVoiceTyping(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Ваш браузер не поддерживает голосовой ввод.", "error");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = appLanguage === 'kk' ? 'kk-KZ' : appLanguage === 'ru' ? 'ru-RU' : 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');
      setInput(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      if (event.error === 'not-allowed') {
        showToast("Пожалуйста, разрешите доступ к микрофону в настройках браузера.", "error");
      }
      setIsVoiceTyping(false);
    };

    recognition.onend = () => {
      setIsVoiceTyping(false);
    };

    recognition.start();
    setIsVoiceTyping(true);
    recognitionRef.current = recognition;
  };

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current && selectedDept === 'General' && currentSessionId) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessions, currentSessionId, isLoading, selectedDept]);



  const currentSession = sessions.find(s => s.id === currentSessionId);

  const createNewSession = async (type: 'chat' | 'conspect' | 'flashcards' | 'quiz' = 'chat', dept: Department = 'General', initialMessage?: string) => {
    const newSessionId = crypto.randomUUID();
    const newSession: ChatSession = {
      id: newSessionId,
      title: type === 'chat' ? `New ${dept} Chat` : type === 'conspect' ? `New ${dept} Conspect` : type === 'flashcards' ? `New ${dept} Flashcards` : `New ${dept} Quiz`,
      messages: [],
      isArchived: false,
      createdAt: Date.now(),
      type,
      department: dept
    };
    
    if (sessions.length === 0) {
      checkAndAwardAchievement('FIRST_PROJECT');
    }
    const updated = [newSession, ...sessions];
    setSessions(updated);
    setCurrentSessionId(newSessionId);
    setSelectedDept(dept);
    syncSessions(updated, newSessionId);
    
    if (window.innerWidth < 768) setIsSidebarOpen(false);

    if (initialMessage) {
      handleSendMessage(undefined, initialMessage, newSessionId, type, contentUrl, updated);
      setContentUrl('');
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, customMessage?: string, overrideSessionId?: string, overrideSessionType?: 'chat' | 'conspect' | 'flashcards' | 'quiz', sourceUrl?: string, overrideSessions?: ChatSession[]) => {
    e?.preventDefault();
    const messageText = customMessage || input;
    const targetSessionId = overrideSessionId || currentSessionId;
    const currentSessions = overrideSessions || sessions;
    const currentAttachedImages = [...attachedImages];
    const currentAttachedLinks = [...attachedLinks];
    const currentUploadedFiles = [...uploadedFiles];
    
    if ((!messageText.trim() && currentAttachedImages.length === 0 && currentAttachedLinks.length === 0 && !sourceUrl && currentUploadedFiles.length === 0) || !targetSessionId || isLoading) return;

    let finalContent = messageText;
    let effectiveSourceUrl = sourceUrl;
    
    // If no sourceUrl is provided but we have attached links, use the first one as sourceUrl
    if (!effectiveSourceUrl && currentAttachedLinks.length > 0) {
      effectiveSourceUrl = currentAttachedLinks[0];
    }

    if (currentAttachedLinks.length > 0) {
      finalContent += `\n\n[Attached Links: ${currentAttachedLinks.join(', ')}]`;
    }
    if (effectiveSourceUrl && effectiveSourceUrl !== currentAttachedLinks[0]) {
      finalContent += `\n\n[Source URL: ${effectiveSourceUrl}]`;
    }
    if (currentUploadedFiles.length > 0) {
      const fileNames = currentUploadedFiles.map(f => f.name).join(', ');
      finalContent += `\n\n[Attached Files: ${fileNames}]`;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: finalContent || (currentAttachedImages.length > 0 ? `[Фото: ${currentAttachedImages.map(img => img.name || 'изображение').join(', ')}]` : `[Файлы: ${currentUploadedFiles.map(f => f.name).join(', ')}]`),
      timestamp: Date.now(),
      attachments: currentAttachedImages.map(img => img.data)
    };

    setIsLoading(true);
    setInput('');
    setAttachedImages([]);
    setAttachedLinks([]);
    setUploadedFiles([]);
    addXp(10);

    // 1. Update state with user message
    const currentSessionToUpdate = currentSessions.find(s => s.id === targetSessionId);
    
    if (!currentSessionToUpdate) {
      setIsLoading(false);
      return;
    }
    
    const sessionType = overrideSessionType || currentSessionToUpdate.type || 'chat';
    const department = currentSessionToUpdate.department || 'General';

    const updatedSessionForAI = {
      ...currentSessionToUpdate,
      messages: [...currentSessionToUpdate.messages, userMessage],
      title: currentSessionToUpdate.messages.length === 0 ? (messageText ? messageText.slice(0, 30) + (messageText.length > 30 ? '...' : '') : 'New Chat') : currentSessionToUpdate.title,
      lastUpdated: Date.now()
    };

    setSessions(prev => prev.map(s => s.id === targetSessionId ? updatedSessionForAI : s));

    // Create the exact reference we need to sync immediately
    const newSessionsRef = currentSessions.map(s => s.id === targetSessionId ? updatedSessionForAI : s);

    // Sync to Firestore immediately
    syncSessions(newSessionsRef, targetSessionId);

    // 2. Call AI
    try {
      const history = (updatedSessionForAI.messages || []).slice(0, -1).map(m => {
        const parts: any[] = [];
        if (m.image) {
          parts.push({
            inlineData: {
              data: m.image,
              mimeType: 'image/jpeg'
            }
          });
        }
        if (m.attachments && m.attachments.length > 0) {
          m.attachments.forEach(att => {
            parts.push({
              inlineData: {
                data: att,
                mimeType: 'image/jpeg'
              }
            });
          });
        }
        // Exclude empty text from parts if there's no content
        if (m.content) {
          parts.push({ text: m.content });
        } else if (parts.length === 0) {
          // Gemini requires at least one part
          parts.push({ text: "." });
        }
        return {
          role: m.role,
          parts
        };
      }) || [];

      let promptText = (userMessage.content || '').trim();
      const hasOnlyAttachments = !messageText.trim() || promptText.startsWith('[Attached:') || promptText.startsWith('[Фото:') || promptText.startsWith('[Файлы:');
      
      if (hasOnlyAttachments) {
        if (sessionType === 'conspect') {
          promptText = appLanguage === 'kk'
            ? "Қоса берілген оқу материалдарын/суреттерді толық талдап, ҰБТ және сабаққа арналған құрылымды толық конспект жасаңыз. Негізгі анықтамаларды, формулаларды және ережелерді көрсетіңіз."
            : "Внимательно проанализируй прикрепленные материалы и фото, составь подробный структурированный конспект для подготовки к ЕНТ и учебе. Выдели основные формулы, определения, правила и ключевые тезисы.";
        } else {
          promptText = appLanguage === 'kk'
            ? "Қоса берілген суреттер мен файлдарды мұқият оқып шығыңыз. Тақырыпты түсіндіріп, ондағы барлық тапсырмалар мен сұрақтарды қадам-қадаммен егжей-тегжейлі шешіп беріңіз."
            : "Внимательно изучи прикрепленные фото, изображения и документы. Объясни тему и подробно реши все приведенные там задания и вопросы с пошаговыми пояснениями.";
        }
      }

      const languageInstruction = appLanguage === 'ru' ? ' (Отвечай строго на русском языке)' : appLanguage === 'kk' ? ' (Тек қазақ тілінде жауап беріңіз)' : '';
      const promptWithLang = promptText + languageInstruction;

      if (sessionType === 'flashcards') {
        const flashcards = await generateFlashcards(promptWithLang, history, effectiveSourceUrl, currentUploadedFiles);
        setSessions(prev => {
          const finalSessions = prev.map(s => {
            if (s.id === targetSessionId) {
              const surgeMessage: Message = {
                id: crypto.randomUUID(),
                role: 'model',
                content: `Here are your flashcards:`,
                timestamp: Date.now(),
                flashcards
              };
              return { ...s, messages: [...s.messages, surgeMessage], lastUpdated: Date.now() };
            }
            return s;
          });
          syncSessions(finalSessions, targetSessionId);
          return finalSessions;
        });
      } else if (sessionType === 'quiz') {
        const quiz = await generateQuiz(promptWithLang, history, effectiveSourceUrl, currentUploadedFiles);
        setSessions(prev => {
          const finalSessions = prev.map(s => {
            if (s.id === targetSessionId) {
              const surgeMessage: Message = {
                id: crypto.randomUUID(),
                role: 'model',
                content: `Here is your quiz:`,
                timestamp: Date.now(),
                quiz
              };
              return { ...s, messages: [...s.messages, surgeMessage], lastUpdated: Date.now() };
            }
            return s;
          });
          syncSessions(finalSessions, targetSessionId);
          return finalSessions;
        });
      } else {
        const responseStream = await chatWithSpyrisStream(
          promptWithLang, 
          history, 
          department, 
          currentAttachedImages.length > 0 ? currentAttachedImages.map(img => ({ data: img.data, mimeType: img.mimeType || 'image/jpeg' })) : undefined, 
          effectiveSourceUrl,
          currentUploadedFiles.length > 0 ? currentUploadedFiles : undefined,
          isThinkingMode,
          false, // isLite
          isDeepResearch,
          isWebSearch,
          isStudyMode
        );
        
        const surgeMessageId = crypto.randomUUID();
        let currentContent = "";
        let currentGroundingChunks: any[] = [];

        // Add empty message first
        setSessions(prev => {
          return prev.map(s => {
            if (s.id === targetSessionId) {
              const surgeMessage: Message = {
                id: surgeMessageId,
                role: 'model',
                content: '',
                timestamp: Date.now(),
              };
              return {
                ...s,
                messages: [...s.messages, surgeMessage]
              };
            }
            return s;
          });
        });

        for await (const chunk of responseStream) {
          const chunkText = chunk.text || chunk.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '')?.join('') || '';
          if (chunkText) {
            currentContent += chunkText;
          }
          if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            currentGroundingChunks = chunk.candidates[0].groundingMetadata.groundingChunks;
          }
          setSessions(prev => prev.map(s => s.id === targetSessionId ? {
            ...s,
            messages: s.messages.map(m => m.id === surgeMessageId ? { ...m, content: currentContent, groundingChunks: currentGroundingChunks } : m),
            lastUpdated: Date.now()
          } : s));
        }

        // Sync after stream finishes
        setSessions(prev => {
          const sessionToSync = prev.find(s => s.id === targetSessionId);
          if (sessionToSync) {
            syncSessions(prev, targetSessionId);
          }
          return prev;
        });
      }

    } catch (error: any) {
      console.error("Spyris error:", error);
      const errorMsg = String(error?.message || error || "");
      const isQuota = errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("Quota");
      
      setSessions(prev => {
        const errorSessions = prev.map(s => {
          if (s.id === targetSessionId) {
            let userNotice = appLanguage === 'ru' 
              ? "Не удалось обработать запрос. Пожалуйста, попробуйте повторить."
              : appLanguage === 'kk'
                ? "Сұранысты өңдеу мүмкін болмады. Қайталап көріңіз."
                : "Failed to process request. Please try again.";
            
            if (isQuota) {
              userNotice = appLanguage === 'ru'
                ? "Высокая нагрузка на сервер ИИ (лимит запросов). Пожалуйста, подождите минуту и отправьте снова."
                : appLanguage === 'kk'
                  ? "Жасанды интеллект серверіне жүктеме жоғары. Бір минут күтіп, қайталап көріңіз."
                  : "High load on AI server. Please wait a minute and try again.";
            }

            const errorMessage: Message = {
              id: crypto.randomUUID(),
              role: 'model',
              content: userNotice,
              timestamp: Date.now(),
            };
            return {
              ...s,
              messages: [...s.messages, errorMessage],
              lastUpdated: Date.now()
            };
          }
          return s;
        });
        syncSessions(errorSessions, targetSessionId);
        return errorSessions;
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Note: I need to fix the setSessions call in handleSendMessage
  // I'll use a functional update to be safe

  const [attachedImages, setAttachedImages] = useState<{ data: string, mimeType: string, name: string, url: string }[]>([]);
  const [attachedLinks, setAttachedLinks] = useState<string[]>([]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newImages: { data: string, mimeType: string, name: string, url: string }[] = [];

    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) {
        showToast(`Файл ${file.name} слишком большой (макс. 50МБ)`, 'error');
        continue;
      }
      try {
        const compressed = await compressImageFile(file, 1600, 0.85);
        newImages.push({
          url: compressed.url,
          data: compressed.data,
          mimeType: compressed.mimeType,
          name: file.name
        });
      } catch (err) {
        console.warn("Image compression fallback:", err);
        const reader = new FileReader();
        await new Promise<void>((resolve) => {
          reader.onload = (event) => {
            const result = (event.target?.result as string) || '';
            newImages.push({
              url: URL.createObjectURL(file),
              data: result.split(',')[1] || '',
              mimeType: file.type || 'image/jpeg',
              name: file.name
            });
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }
    }

    setAttachedImages(prev => [...prev, ...newImages]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const removeAttachedImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  const archiveSession = (id: string) => {
    const updated = sessions.map(s => s.id === id ? { ...s, isArchived: !s.isArchived } : s);
    setSessions(updated);
    syncSessions(updated, id);
  };

  const deleteSession = async (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    try {
      localStorage.setItem('spyris_saved_sessions', JSON.stringify(updated));
    } catch (e) {}
    if (currentSessionId === id) {
      setCurrentSessionId(updated.length > 0 ? updated[0].id : null);
    }
    if (user && user.name !== 'Guest' && !user.uid.startsWith('guest_') && !user.uid.startsWith('user_') && auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'sessions', id));
      } catch (e) {
        console.error("Failed to delete session", e);
      }
    }
  };

  const filteredSessions = sessions.filter(s => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const titleMatch = s.title.toLowerCase().includes(query);
    const deptMatch = (s.department || '').toLowerCase().includes(query);
    const messageMatch = s.messages.some(m => m.content?.toLowerCase().includes(query));
    return titleMatch || messageMatch || deptMatch;
  });

  const activeSessions = filteredSessions.filter(s => !s.isArchived);
  const archivedSessions = filteredSessions.filter(s => s.isArchived);

  if (!user) {
    return (
      <div className="min-h-screen bg-surge-bg flex items-center justify-center p-4 md:p-8 relative overflow-y-auto">
        <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-surge-purple/15 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-teal-500/10 blur-[130px] rounded-full pointer-events-none" />
        
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-4xl glass-panel rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative z-10 my-8 border-2 border-surge-ink/10"
        >
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 font-bold text-xs uppercase tracking-widest mb-4">
              <GraduationCap size={16} />
              <span>ЕНТ 2026 • Единое Национальное Тестирование</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-black text-surge-ink tracking-tight mb-3">
              Spyris<span className="text-surge-purple">Learn</span>
            </h1>
            <p className="text-surge-ink/60 text-sm md:text-base font-medium">
              Персональная система подготовки школьника к ЕНТ с контролем прогресса учителем
            </p>
          </div>

          {/* CONDITIONAL RENDER: ROLE REGISTRATION/LOGIN OR 2 DOORS */}
          {selectedEntryRole === 'teacher' ? (
            /* TEACHER REGISTRATION & LOGIN FORM */
            <div className="bg-surge-card rounded-3xl p-6 md:p-8 border-2 border-teal-500/40 shadow-2xl relative mb-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-surge-ink/10">
                <button
                  type="button"
                  onClick={() => { setSelectedEntryRole(null); setAuthError(''); }}
                  className="px-4 py-2 rounded-xl bg-surge-ink/5 hover:bg-surge-ink/10 text-surge-ink text-xs font-bold transition-all flex items-center gap-2"
                >
                  ← Назад к выбору роли
                </button>
                <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
                  <Users size={16} />
                  <span>Кабинет Преподавателя ЕНТ</span>
                </div>
              </div>

              {/* Mode Toggle Tabs */}
              <div className="flex bg-surge-ink/5 p-1 rounded-2xl mb-6">
                <button
                  type="button"
                  onClick={() => { setEntryMode('signup'); setAuthError(''); }}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-xs font-bold transition-all text-center",
                    entryMode === 'signup' 
                      ? "bg-teal-500 text-white shadow-lg shadow-teal-500/25" 
                      : "text-surge-ink/60 hover:text-surge-ink"
                  )}
                >
                  1. Регистрация нового учителя
                </button>
                <button
                  type="button"
                  onClick={() => { setEntryMode('login'); setAuthError(''); }}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-xs font-bold transition-all text-center",
                    entryMode === 'login' 
                      ? "bg-teal-500 text-white shadow-lg shadow-teal-500/25" 
                      : "text-surge-ink/60 hover:text-surge-ink"
                  )}
                >
                  2. Войти в существующий аккаунт
                </button>
              </div>

              <form onSubmit={handleTeacherAuthSubmit} className="space-y-4">
                {entryMode === 'signup' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-surge-ink/60 uppercase tracking-wider mb-1.5">
                          ФИО Преподавателя *
                        </label>
                        <input
                          type="text"
                          required
                          value={teacherRegForm.name}
                          onChange={e => setTeacherRegForm({ ...teacherRegForm, name: e.target.value })}
                          className="w-full bg-surge-bg border border-surge-border rounded-xl px-4 py-3 text-surge-ink text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                          placeholder="Например: Ибрагимов Руслан Маратович"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-surge-ink/60 uppercase tracking-wider mb-1.5">
                          Предметный профиль *
                        </label>
                        <select
                          value={teacherRegForm.subject}
                          onChange={e => setTeacherRegForm({ ...teacherRegForm, subject: e.target.value })}
                          className="w-full bg-surge-bg border border-surge-border rounded-xl px-4 py-3 text-surge-ink text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                        >
                          <option value="Математика">Математика (Профиль)</option>
                          <option value="Физика">Физика (Профиль)</option>
                          <option value="Химия">Химия (Профиль)</option>
                          <option value="Биология">Биология (Профиль)</option>
                          <option value="География">География (Профиль)</option>
                          <option value="Всемирная история">Всемирная история (Профиль)</option>
                          <option value="Основы права">Основы права / Құқық (Профиль)</option>
                          <option value="Английский язык">Английский язык / Иностранный (Профиль)</option>
                          <option value="Казахский язык и литература">Казахский язык и литература (Профиль)</option>
                          <option value="Русский язык и литература">Русский язык и литература (Профиль)</option>
                          <option value="Информатика">Информатика / IT (Профиль)</option>
                          <option value="Графика и проектирование">Графика и проектирование</option>
                          <option value="Творческий экзамен">Творческий экзамен</option>
                          <option value="История Казахстана">История Казахстана (Обязательный)</option>
                          <option value="Математическая грамотность">Математическая грамотность (Обязательный)</option>
                          <option value="Грамотность чтения">Грамотность чтения (Обязательный)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-surge-ink/60 uppercase tracking-wider mb-1.5">
                        Адрес школы / Учебного заведения *
                      </label>
                      <input
                        type="text"
                        required
                        value={teacherRegForm.schoolAddress}
                        onChange={e => setTeacherRegForm({ ...teacherRegForm, schoolAddress: e.target.value })}
                        className="w-full bg-surge-bg border border-surge-border rounded-xl px-4 py-3 text-surge-ink text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                        placeholder="Например: г. Алматы, пр. Абая 52, Лицей №134"
                      />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-surge-ink/60 uppercase tracking-wider mb-1.5">
                      Email (Логин) *
                    </label>
                    <input
                      type="email"
                      required
                      value={teacherRegForm.email}
                      onChange={e => setTeacherRegForm({ ...teacherRegForm, email: e.target.value })}
                      className="w-full bg-surge-bg border border-surge-border rounded-xl px-4 py-3 text-surge-ink text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                      placeholder="teacher@ent.kz"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-surge-ink/60 uppercase tracking-wider mb-1.5">
                      Пароль *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={teacherRegForm.password}
                      onChange={e => setTeacherRegForm({ ...teacherRegForm, password: e.target.value })}
                      className="w-full bg-surge-bg border border-surge-border rounded-xl px-4 py-3 text-surge-ink text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                      placeholder="Минимум 6 символов"
                    />
                  </div>
                </div>

                {authError && (
                  <div className="flex items-center gap-2 text-rose-500 text-xs font-bold bg-rose-500/10 p-3.5 rounded-xl border border-rose-500/20">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-teal-500/25 transition-all active:scale-95 text-sm flex items-center justify-center gap-2 mt-4"
                >
                  <Users size={18} />
                  <span>
                    {entryMode === 'signup' ? 'Зарегистрироваться и открыть кабинет учителя' : 'Войти в кабинет учителя'}
                  </span>
                </button>
              </form>
            </div>
          ) : selectedEntryRole === 'student' ? (
            /* STUDENT REGISTRATION & LOGIN FORM */
            <div className="bg-surge-card rounded-3xl p-6 md:p-8 border-2 border-surge-purple/40 shadow-2xl relative mb-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-surge-ink/10">
                <button
                  type="button"
                  onClick={() => { setSelectedEntryRole(null); setAuthError(''); }}
                  className="px-4 py-2 rounded-xl bg-surge-ink/5 hover:bg-surge-ink/10 text-surge-ink text-xs font-bold transition-all flex items-center gap-2"
                >
                  ← Назад к выбору роли
                </button>
                <div className="flex items-center gap-2 text-surge-purple font-bold text-xs uppercase tracking-wider">
                  <GraduationCap size={16} />
                  <span>Портал Ученика ЕНТ 2026</span>
                </div>
              </div>

              {/* Mode Toggle Tabs */}
              <div className="flex bg-surge-ink/5 p-1 rounded-2xl mb-6">
                <button
                  type="button"
                  onClick={() => { setEntryMode('signup'); setAuthError(''); }}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-xs font-bold transition-all text-center",
                    entryMode === 'signup' 
                      ? "bg-surge-purple text-white shadow-lg shadow-surge-purple/25" 
                      : "text-surge-ink/60 hover:text-surge-ink"
                  )}
                >
                  1. Регистрация ученика
                </button>
                <button
                  type="button"
                  onClick={() => { setEntryMode('login'); setAuthError(''); }}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-xs font-bold transition-all text-center",
                    entryMode === 'login' 
                      ? "bg-surge-purple text-white shadow-lg shadow-surge-purple/25" 
                      : "text-surge-ink/60 hover:text-surge-ink"
                  )}
                >
                  2. Войти в существующий аккаунт
                </button>
              </div>

              <form onSubmit={handleStudentAuthSubmit} className="space-y-4">
                {entryMode === 'signup' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-surge-ink/60 uppercase tracking-wider mb-1.5">
                          ФИО Ученика *
                        </label>
                        <input
                          type="text"
                          required
                          value={studentRegForm.name}
                          onChange={e => setStudentRegForm({ ...studentRegForm, name: e.target.value })}
                          className="w-full bg-surge-bg border border-surge-border rounded-xl px-4 py-3 text-surge-ink text-sm font-bold focus:outline-none focus:ring-2 focus:ring-surge-purple/30"
                          placeholder="Например: Касымов Арман"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-surge-ink/60 uppercase tracking-wider mb-1.5">
                          Профильные предметы ЕНТ *
                        </label>
                        <select
                          value={studentRegForm.profileSubjects}
                          onChange={e => setStudentRegForm({ ...studentRegForm, profileSubjects: e.target.value })}
                          className="w-full bg-surge-bg border border-surge-border rounded-xl px-4 py-3 text-surge-ink text-sm font-bold focus:outline-none focus:ring-2 focus:ring-surge-purple/30"
                        >
                          <option value="Математика + Физика">Математика + Физика (Инженерия / IT / Архитектура)</option>
                          <option value="Химия + Биология">Химия + Биология (Медицина / Фармация / Биотех)</option>
                          <option value="География + Математика">География + Математика (Экономика / Финансы / Менеджмент)</option>
                          <option value="Информатика + Математика">Информатика + Математика (IT / Программирование / Кибербезопасность)</option>
                          <option value="Биология + География">Биология + География (Экология / Агрономия)</option>
                          <option value="География + Английский язык">География + Английский язык (Туризм / Регионоведение)</option>
                          <option value="Всемирная история + Основы права">Всемирная история + Основы права / Құқық (Юриспруденция)</option>
                          <option value="Всемирная история + Английский язык">Всемирная история + Английский язык (Международные отношения)</option>
                          <option value="Всемирная история + География">Всемирная история + География (Политология / Социология)</option>
                          <option value="Казахский язык + Казахская литература">Казахский язык + Казахская литература (Филология / Педагогика)</option>
                          <option value="Русский язык + Русская литература">Русский язык + Русская литература (Филология / Журналистика)</option>
                          <option value="Творческий экзамен">Творческий экзамен (Дизайн / Искусство / Архитектура)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-surge-ink/60 uppercase tracking-wider mb-1.5">
                          Класс / Статус
                        </label>
                        <select
                          value={studentRegForm.schoolGrade}
                          onChange={e => setStudentRegForm({ ...studentRegForm, schoolGrade: e.target.value })}
                          className="w-full bg-surge-bg border border-surge-border rounded-xl px-4 py-3 text-surge-ink text-sm font-bold focus:outline-none focus:ring-2 focus:ring-surge-purple/30"
                        >
                          <option value="10 класс">10 класс (Ранний старт)</option>
                          <option value="11 класс">11 класс (Выпускной год)</option>
                          <option value="Выпускник">Выпускник колледжа / Повторный ЕНТ</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-surge-ink/60 uppercase tracking-wider mb-1.5">
                          Целевой балл (из 140)
                        </label>
                        <input
                          type="number"
                          min={50}
                          max={140}
                          value={studentRegForm.targetScore}
                          onChange={e => setStudentRegForm({ ...studentRegForm, targetScore: Number(e.target.value) })}
                          className="w-full bg-surge-bg border border-surge-border rounded-xl px-4 py-3 text-surge-ink text-sm font-bold focus:outline-none focus:ring-2 focus:ring-surge-purple/30 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-surge-ink/60 uppercase tracking-wider mb-1.5">
                          Телефон родителей
                        </label>
                        <input
                          type="text"
                          value={studentRegForm.parentContact}
                          onChange={e => setStudentRegForm({ ...studentRegForm, parentContact: e.target.value })}
                          className="w-full bg-surge-bg border border-surge-border rounded-xl px-4 py-3 text-surge-ink text-sm font-bold focus:outline-none focus:ring-2 focus:ring-surge-purple/30"
                          placeholder="+7 (777) 123-45-67"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-surge-ink/60 uppercase tracking-wider mb-1.5">
                      Email (Логин) *
                    </label>
                    <input
                      type="email"
                      required
                      value={studentRegForm.email}
                      onChange={e => setStudentRegForm({ ...studentRegForm, email: e.target.value })}
                      className="w-full bg-surge-bg border border-surge-border rounded-xl px-4 py-3 text-surge-ink text-sm font-bold focus:outline-none focus:ring-2 focus:ring-surge-purple/30"
                      placeholder="student@ent.kz"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-surge-ink/60 uppercase tracking-wider mb-1.5">
                      Пароль *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={studentRegForm.password}
                      onChange={e => setStudentRegForm({ ...studentRegForm, password: e.target.value })}
                      className="w-full bg-surge-bg border border-surge-border rounded-xl px-4 py-3 text-surge-ink text-sm font-bold focus:outline-none focus:ring-2 focus:ring-surge-purple/30"
                      placeholder="Минимум 6 символов"
                    />
                  </div>
                </div>

                {authError && (
                  <div className="flex items-center gap-2 text-rose-500 text-xs font-bold bg-rose-500/10 p-3.5 rounded-xl border border-rose-500/20">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-surge-purple hover:bg-surge-purple-dark text-white font-bold py-4 rounded-2xl shadow-xl shadow-surge-purple/25 transition-all active:scale-95 text-sm flex items-center justify-center gap-2 mt-4"
                >
                  <Zap size={18} />
                  <span>
                    {entryMode === 'signup' ? 'Зарегистрироваться и начать подготовку к ЕНТ' : 'Войти в аккаунт ученика'}
                  </span>
                </button>
              </form>
            </div>
          ) : (
            /* TWO PRIMARY DOORS: STUDENT & TEACHER */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Door 1: Student */}
              <div className="bg-surge-card rounded-3xl p-6 md:p-7 border-2 border-surge-purple/30 shadow-xl flex flex-col justify-between hover:border-surge-purple transition-all relative overflow-hidden group">
                <div className="absolute -right-6 -bottom-6 text-surge-purple/5 pointer-events-none">
                  <GraduationCap size={140} />
                </div>
                <div className="space-y-4 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-surge-purple/15 text-surge-purple flex items-center justify-center font-black text-2xl">
                    🎓
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-surge-purple">Режим Ученика</span>
                    <h3 className="text-2xl font-bold text-surge-ink mt-0.5">Зайти как ученик</h3>
                    <p className="text-xs text-surge-ink/60 mt-2 leading-relaxed">
                      Готовьтесь к ЕНТ, решайте пробные тесты, сдавайте задания от вашего учителя, копите баллы из 140 и выполняйте квесты на Грант.
                    </p>
                  </div>
                  <ul className="space-y-1.5 text-xs text-surge-ink/70 font-medium pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-surge-purple shrink-0" />
                      <span>Связь с учителем и задания класса</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-surge-purple shrink-0" />
                      <span>Аналитика баллов ЕНТ (до 140)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-surge-purple shrink-0" />
                      <span>ЕНТ Квесты, XP и достижения</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6 relative z-10 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEntryRole('student');
                      setEntryMode('signup');
                      setAuthError('');
                    }}
                    className="w-full bg-surge-purple hover:bg-surge-purple-dark text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-surge-purple/25 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
                  >
                    <Zap size={16} />
                    <span>Зарегистрироваться как Ученик</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEntryRole('student');
                      setEntryMode('login');
                      setAuthError('');
                    }}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-surge-ink/60 hover:text-surge-purple transition-all"
                  >
                    Уже есть аккаунт ученика? Войти
                  </button>
                </div>
              </div>

              {/* Door 2: Teacher */}
              <div className="bg-surge-card rounded-3xl p-6 md:p-7 border-2 border-teal-500/30 shadow-xl flex flex-col justify-between hover:border-teal-500 transition-all relative overflow-hidden group">
                <div className="absolute -right-6 -bottom-6 text-teal-500/5 pointer-events-none">
                  <Users size={140} />
                </div>
                <div className="space-y-4 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-teal-500/15 text-teal-400 flex items-center justify-center font-black text-2xl">
                    👨‍🏫
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-teal-400">Режим Преподавателя</span>
                    <h3 className="text-2xl font-bold text-surge-ink mt-0.5">Зайти как учитель</h3>
                    <p className="text-xs text-surge-ink/60 mt-2 leading-relaxed">
                      Создавайте классы («10 А»), контролируйте успеваемость учеников, формируйте тесты с ИИ, мотивируйте отстающих и уведомляйте родителей.
                    </p>
                  </div>
                  <ul className="space-y-1.5 text-xs text-surge-ink/70 font-medium pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-teal-400 shrink-0" />
                      <span>Создание классов и код приглашения</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-teal-400 shrink-0" />
                      <span>Контроль баллов и статуса учеников</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-teal-400 shrink-0" />
                      <span>Конструктор тестов, планов и связь с родителями</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6 relative z-10 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEntryRole('teacher');
                      setEntryMode('signup');
                      setAuthError('');
                    }}
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-teal-500/25 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
                  >
                    <Users size={16} />
                    <span>Зарегистрироваться как Учитель</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEntryRole('teacher');
                      setEntryMode('login');
                      setAuthError('');
                    }}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-surge-ink/60 hover:text-teal-400 transition-all"
                  >
                    Уже есть аккаунт учителя? Войти
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Standard Email / Password Form & Google */}
          <div className="border-t border-surge-ink/10 pt-6 max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-surge-ink/40 uppercase tracking-widest">
                Или вход через аккаунт
              </span>
              <button 
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'signup' : 'login');
                  setAuthError('');
                }}
                className="text-surge-purple hover:underline text-xs font-bold"
              >
                {authMode === 'login' ? 'Создать новый аккаунт' : 'Уже есть аккаунт? Войти'}
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-[11px] font-bold text-surge-ink/50 uppercase tracking-wider mb-1">Имя и фамилия</label>
                  <input 
                    type="text" 
                    value={authForm.name}
                    onChange={e => setAuthForm({...authForm, name: e.target.value})}
                    className="w-full bg-surge-bg border border-surge-border rounded-xl px-4 py-3 text-surge-ink text-sm font-bold focus:outline-none focus:ring-2 focus:ring-surge-purple/30"
                    placeholder="Например: Адиль Касымов"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-surge-ink/50 uppercase tracking-wider mb-1">Email</label>
                <input 
                  type="email" 
                  required
                  value={authForm.email}
                  onChange={e => setAuthForm({...authForm, email: e.target.value})}
                  className="w-full bg-surge-bg border border-surge-border rounded-xl px-4 py-3 text-surge-ink text-sm focus:outline-none focus:ring-2 focus:ring-surge-purple/30"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-surge-ink/50 uppercase tracking-wider mb-1">Пароль</label>
                <input 
                  type="password" 
                  required
                  value={authForm.password}
                  onChange={e => setAuthForm({...authForm, password: e.target.value})}
                  className="w-full bg-surge-bg border border-surge-border rounded-xl px-4 py-3 text-surge-ink text-sm focus:outline-none focus:ring-2 focus:ring-surge-purple/30"
                  placeholder="••••••••"
                />
              </div>

              {authError && (
                <div className="flex items-center gap-2 text-rose-500 text-xs font-bold bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                  <AlertCircle size={14} />
                  <span>{authError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  type="submit"
                  className="flex-1 bg-surge-ink/10 hover:bg-surge-ink/20 text-surge-ink font-bold py-3 rounded-xl transition-all text-xs"
                >
                  {authMode === 'login' ? 'Войти по почте' : 'Зарегистрироваться'}
                </button>
                <button 
                  type="button"
                  onClick={handleGoogleLogin}
                  className="flex-1 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 font-bold py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Google</span>
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleCameraCapture = (data: string, name: string) => {
    if (isCameraForAvatar) {
      if (user && user.name === 'Guest') {
        showToast("Гости не могут изменять аватар", "info");
      } else {
        const photoURL = `data:image/jpeg;base64,${data}`;
        if (user) {
          import('./firebase').then(({ updateUserProfile }) => {
            updateUserProfile(user.uid, { photoURL });
          });
        }
        showToast("Аватар обновлен!", "success");
      }
      setIsCameraForAvatar(false);
      setIsCameraOpen(false);
      return;
    }
    setAttachedImages(prev => [...prev, {
      data,
      mimeType: 'image/jpeg',
      name,
      url: `data:image/jpeg;base64,${data}`
    }]);
    showToast("Фото добавлено!", "success");
  };

  const handleUpdateName = () => {
    if (!tempName.trim() || !user) return;
    if (user.name === 'Guest') {
      showToast("Гости не могут изменять имя", "info");
      setEditingName(false);
      return;
    }
    import('./firebase').then(({ updateUserProfile }) => {
      updateUserProfile(user.uid, { name: tempName.trim() });
      setEditingName(false);
      showToast("Имя обновлено!", "success");
    });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (user.name === 'Guest') {
      showToast("Гости не могут изменять аватар", "info");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const photoURL = event.target?.result as string;
      import('./firebase').then(({ updateUserProfile }) => {
        updateUserProfile(user.uid, { photoURL });
        showToast("Аватар обновлен!", "success");
      });
    };
    reader.readAsDataURL(file);
  };

  const selectPresetAvatar = (url: string) => {
    if (!user) return;
    if (user.name === 'Guest') {
      showToast("Гости не могут изменять аватар", "info");
      setIsAvatarPickerOpen(false);
      return;
    }
    import('./firebase').then(({ updateUserProfile }) => {
      updateUserProfile(user.uid, { photoURL: url });
      setIsAvatarPickerOpen(false);
      showToast("Аватар обновлен!", "success");
    });
  };

  return (
    <div className="h-screen flex flex-col bg-surge-bg text-surge-ink font-sans">
      <CameraModal 
        isOpen={isCameraOpen} 
        onClose={() => {
          setIsCameraOpen(false);
          setIsCameraForAvatar(false);
        }} 
        onCapture={handleCameraCapture} 
      />
      
      {/* Profile Modal */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsProfileModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-surge-card border border-surge-border rounded-[2.5rem] shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative h-32 bg-gradient-to-r from-surge-purple to-violet-600">
                <button 
                  onClick={() => setIsProfileModalOpen(false)}
                  className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="px-8 pb-8 -mt-12 relative">
                <div className="flex flex-col items-center text-center">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-3xl bg-surge-card border-4 border-surge-card shadow-xl overflow-hidden flex items-center justify-center text-3xl font-bold text-surge-purple bg-surge-purple/10">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        user?.name?.slice(0, 2).toUpperCase() || '??'
                      )}
                    </div>
                    <button 
                      onClick={() => setIsAvatarPickerOpen(true)}
                      className="absolute bottom-0 right-0 p-2 bg-surge-purple text-white rounded-xl shadow-lg hover:scale-110 transition-transform"
                    >
                      <Camera size={16} />
                    </button>
                  </div>
                  
                  <div className="mt-4 w-full">
                    {editingName ? (
                      <div className="flex items-center gap-2 justify-center">
                        <input 
                          autoFocus
                          value={tempName}
                          onChange={e => setTempName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleUpdateName()}
                          className="bg-surge-bg border border-surge-purple px-4 py-2 rounded-xl text-center font-bold focus:outline-none"
                        />
                        <button onClick={handleUpdateName} className="p-2 bg-emerald-500 text-white rounded-xl"><Check size={16} /></button>
                        <button onClick={() => setEditingName(false)} className="p-2 bg-rose-500 text-white rounded-xl"><X size={16} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 justify-center group">
                        <h2 className="text-2xl font-black text-surge-ink tracking-tight">{user?.name || 'Guest'}</h2>
                        <button 
                          onClick={() => { setTempName(user?.name || ''); setEditingName(true); }}
                          className="p-1.5 text-surge-ink/20 hover:text-surge-purple opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    )}
                    <p className="text-sm text-surge-ink/40 font-medium">{user?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-8">
                  <div className="bg-surge-ink/5 p-4 rounded-2xl text-center border border-surge-ink/5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-surge-purple mb-1">Level</p>
                    <p className="text-xl font-black text-surge-ink">{user?.level || 1}</p>
                  </div>
                  <div className="bg-surge-ink/5 p-4 rounded-2xl text-center border border-surge-ink/5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-surge-purple mb-1">XP</p>
                    <p className="text-xl font-black text-surge-ink">{user?.xp || 0}</p>
                  </div>
                  <div className="bg-surge-ink/5 p-4 rounded-2xl text-center border border-surge-ink/5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-surge-purple mb-1">Tests</p>
                    <p className="text-xl font-black text-surge-ink">{user?.testsCompleted || 0}</p>
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-surge-ink/30 mb-4 flex items-center gap-2">
                    <Trophy size={14} className="text-yellow-500" />
                    Achievements
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {user?.badges && user.badges.length > 0 ? (
                      user.badges.map((badge, idx) => (
                        <div key={idx} className="px-4 py-2 bg-yellow-400/10 border border-yellow-400/30 rounded-xl text-yellow-600 text-xs font-bold flex items-center gap-2">
                          <Award size={14} />
                          {badge}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-surge-ink/20 italic">No achievements yet. Complete quizzes to earn badges!</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar Picker Modal */}
      <AnimatePresence>
        {isAvatarPickerOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setIsAvatarPickerOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-surge-card border border-surge-border rounded-[2.5rem] shadow-2xl p-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-surge-ink">Выберите аватар</h3>
                <button onClick={() => setIsAvatarPickerOpen(false)} className="p-2 hover:bg-surge-ink/5 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <button 
                    onClick={() => {
                      setIsCameraForAvatar(true);
                      setIsCameraOpen(true);
                      setIsAvatarPickerOpen(false);
                    }}
                    className="flex flex-col items-center gap-3 p-6 bg-surge-purple/10 border-2 border-surge-purple/20 rounded-3xl hover:bg-surge-purple/20 transition-all group"
                  >
                    <Camera size={32} className="text-surge-purple group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold text-surge-purple">Камера</span>
                  </button>
                  <label className="flex flex-col items-center gap-3 p-6 bg-blue-500/10 border-2 border-blue-500/20 rounded-3xl hover:bg-blue-500/20 transition-all group cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    <ImageIcon size={32} className="text-blue-500 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold text-blue-500">Галерея</span>
                  </label>
                </div>

                <h4 className="text-xs font-bold uppercase tracking-widest text-surge-ink/30 mb-4">Коллекция Spyris</h4>
                <div className="grid grid-cols-4 gap-4 pb-4">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button 
                      key={idx}
                      onClick={() => selectPresetAvatar(url)}
                      className="w-full aspect-square rounded-2xl overflow-hidden border-2 border-transparent hover:border-surge-purple transition-all hover:scale-105"
                    >
                      <img src={url} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl font-bold text-sm flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-emerald-500 text-white' :
              toast.type === 'error' ? 'bg-red-500 text-white' :
              'bg-surge-purple text-white'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 size={16} />}
            {toast.type === 'error' && <AlertCircle size={16} />}
            {toast.type === 'info' && <Info size={16} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="fixed md:relative z-[110] w-72 h-full glass-panel flex flex-col shadow-2xl"
          >
            <div className="p-6 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-black border border-surge-ink/20 rounded-xl flex items-center justify-center shadow-lg shadow-surge-purple/20 icon-glow-container shrink-0">
                  <Aperture className="lightning-effect" size={20} />
                </div>
                <div className="min-w-0">
                  <h1 className="font-display text-xl font-bold tracking-tight text-surge-ink truncate">{TRANSLATIONS[appLanguage].appTitle}</h1>
                  <p className="text-[10px] text-surge-purple font-bold uppercase tracking-tighter truncate">{TRANSLATIONS[appLanguage].studyAssistant}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)} 
                className="p-2 bg-surge-ink/5 hover:bg-rose-500 hover:text-white rounded-xl text-surge-ink/60 transition-all flex items-center gap-1 text-xs font-bold shrink-0"
                title="Закрыть отделы"
              >
                <ChevronsLeft size={16} />
                <span className="hidden lg:inline text-[11px]">Закрыть</span>
              </button>
            </div>

            <div className="px-4 mb-6 flex gap-2">
              <button 
                onClick={() => createNewSession('chat', selectedDept)}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-surge-purple to-indigo-600 hover:from-surge-purple-dark hover:to-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-surge-purple/20 active:scale-95 group overflow-hidden relative hover-glass-card hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]"
              >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent,rgba(255,255,255,0.2),transparent)] -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <Plus size={20} className="group-hover:rotate-180 transition-transform duration-500 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                <span className="group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all">{TRANSLATIONS[appLanguage].newSession}</span>
              </button>
              
              <button
                onClick={() => { setSelectedDept('Projects'); setCurrentSessionId(null); }}
                className={cn(
                  "px-4 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold transition-all shadow-lg active:scale-95",
                  selectedDept === 'Projects' 
                    ? "bg-violet-600 text-white shadow-violet-600/20" 
                    : "bg-surge-ink/5 text-surge-ink/60 hover:bg-violet-600 hover:text-white hover:shadow-violet-600/20"
                )}
                title={TRANSLATIONS[appLanguage].projects || "Projects Hub"}
              >
                <FolderOpen size={20} />
              </button>
            </div>


            <div className="px-4 mb-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surge-ink/30 group-focus-within:text-surge-purple transition-colors" size={16} />
                <input 
                  type="text"
                  placeholder={TRANSLATIONS[appLanguage].search || "Search archive..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-surge-bg border border-surge-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-surge-purple/30 focus:border-surge-purple transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 space-y-6 pb-6 custom-scrollbar">
              {/* Experience Highlight */}
              <div className="px-2">
                <button
                  onClick={() => { setSelectedDept('Experience'); setCurrentSessionId(null); }}
                  className={cn(
                    "w-full p-4 rounded-2xl border transition-all relative overflow-hidden group hover-glass-card",
                    selectedDept === 'Experience'
                      ? "bg-yellow-400/20 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.3)] glow-text"
                      : "bg-surge-ink/5 border-surge-ink/10 hover:border-yellow-400"
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                      selectedDept === 'Experience' ? "bg-yellow-400 text-white shadow-[0_0_15px_rgba(250,204,21,0.5)] scale-110" : "bg-surge-purple text-white group-hover:scale-110 group-hover:bg-yellow-400 group-hover:shadow-[0_0_15px_rgba(250,204,21,0.5)]"
                    )}>
                      <Trophy size={16} />
                    </div>
                    <div className="text-left">
                      <p className={cn("text-[10px] font-bold uppercase tracking-widest transition-colors", selectedDept === 'Experience' ? "text-yellow-500" : "text-surge-purple group-hover:text-yellow-500")}>{TRANSLATIONS[appLanguage].levelsTitle?.split(' ')[0] || "Level"} {level}</p>
                      <p className="text-sm font-bold text-surge-ink">{TRANSLATIONS[appLanguage].studentProgress || "Mastery Rank"}</p>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-surge-ink/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${xp % 100}%` }}
                      className={cn("h-full shadow-[0_0_10px_currentColor] transition-colors", selectedDept === 'Experience' ? "bg-yellow-400 text-yellow-400" : "bg-surge-purple text-surge-purple group-hover:bg-yellow-400 group-hover:text-yellow-400")}
                    />
                  </div>
                </button>
              </div>

              {/* Departments Filter */}
              <div className="px-2">
                <h2 className="px-3 text-[10px] font-bold uppercase tracking-widest text-surge-ink/30 mb-4 flex justify-between items-center">
                  <span>{TRANSLATIONS[appLanguage].knowledgeHub || "Knowledge Hub"}</span>
                  <div className="w-8 h-px bg-surge-ink/10"></div>
                </h2>
                <div className="grid grid-cols-2 gap-2 px-1">
                  {DEPARTMENTS.filter(d => d.id !== 'Experience' && d.id !== 'Projects').map(dept => {
                    const theme = getDeptThemeClasses(dept.id);
                    const isActive = selectedDept === dept.id;
                    return (
                      <motion.button
                        key={dept.id}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setSelectedDept(dept.id); setCurrentSessionId(null); }}
                        className={cn(
                          "w-full flex flex-col items-center justify-center p-3 rounded-2xl text-[10px] font-bold transition-all relative group border gap-2 text-center",
                          isActive 
                            ? `${theme.solid} text-white border-transparent shadow-lg shadow-black/10` 
                            : "bg-surge-ink/5 border-transparent text-surge-ink/40 hover:bg-surge-ink/10 hover:text-surge-ink/60"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-inner",
                          isActive ? "bg-white/20 text-white ring-4 ring-white/10" : "bg-surge-ink/10 text-surge-ink/30 group-hover:bg-surge-ink/20 group-hover:text-surge-ink/50"
                        )}>
                          {dept.icon}
                        </div>
                        <span className={cn("truncate w-full transition-colors", isActive ? "text-white font-black" : "")}>
                          {TRANSLATIONS[appLanguage].departments[dept.id]}
                        </span>
                        
                        {isActive && (
                          <motion.div 
                            layoutId="active-dept-glow"
                            className={cn("absolute inset-0 rounded-2xl -z-10 blur-xl opacity-20", dept.color)}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {activeSessions.length > 0 && (
                <div>
                  <h2 className="px-4 text-[10px] font-bold uppercase tracking-widest text-surge-ink/30 mb-2">
                    {TRANSLATIONS[appLanguage].history || "История чатов"}
                  </h2>
                  <div className="space-y-1">
                    {activeSessions.map(session => (
                      <button
                        key={session.id}
                        onClick={() => {
                          setCurrentSessionId(session.id);
                          if (session.department) setSelectedDept(session.department);
                          if (window.innerWidth < 768) setIsSidebarOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm transition-all group relative overflow-hidden",
                          currentSessionId === session.id 
                            ? "bg-surge-purple text-white shadow-xl shadow-surge-purple/20" 
                            : "hover:bg-surge-bg text-surge-ink/60 hover:text-surge-ink"
                        )}
                      >
                        <span className="flex-1 truncate font-medium">{session.title}</span>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <Archive 
                            size={14} 
                            className="hover:text-surge-purple transition-all cursor-pointer" 
                            onClick={(e) => { e.stopPropagation(); archiveSession(session.id); }}
                          />
                          <Trash2 
                            size={14} 
                            className="hover:text-red-500 transition-all cursor-pointer" 
                            onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {archivedSessions.length > 0 && (
                <div>
                  <h2 className="px-4 text-[10px] font-bold uppercase tracking-widest text-surge-ink/30 mb-2 mt-4 flex items-center gap-1.5">
                    <Archive size={12} />
                    <span>{appLanguage === 'ru' ? "Архив чатов" : appLanguage === 'kk' ? "Чаттар архивы" : "Archived Chats"}</span>
                  </h2>
                  <div className="space-y-1">
                    {archivedSessions.map(session => (
                      <button
                        key={session.id}
                        onClick={() => {
                          setCurrentSessionId(session.id);
                          if (session.department) setSelectedDept(session.department);
                          if (window.innerWidth < 768) setIsSidebarOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm transition-all group relative overflow-hidden",
                          currentSessionId === session.id 
                            ? "bg-surge-purple text-white shadow-xl shadow-surge-purple/20" 
                            : "hover:bg-surge-bg text-surge-ink/40 hover:text-surge-ink opacity-70"
                        )}
                      >
                        <span className="flex-1 truncate font-medium">{session.title}</span>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <RotateCcw 
                            size={14} 
                            className="hover:text-surge-purple cursor-pointer" 
                            onClick={(e) => { e.stopPropagation(); archiveSession(session.id); }}
                          />
                          <Trash2 
                            size={14} 
                            className="hover:text-red-500 cursor-pointer" 
                            onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-surge-border bg-surge-ink/[0.02]">
              <div 
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-surge-ink/5 transition-all cursor-pointer group relative hover-glass-card"
              >
                <div className="w-10 h-10 rounded-xl bg-surge-purple/20 flex items-center justify-center text-surge-purple font-bold text-sm shadow-inner border border-surge-purple/30 overflow-hidden group-hover:ring-2 group-hover:ring-surge-purple/50 transition-all duration-300">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  ) : (
                    user?.name?.slice(0, 2).toUpperCase() || '??'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-surge-ink truncate group-hover:glow-text transition-all">{user?.name || 'Guest'}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider",
                      user?.role === 'teacher' ? "bg-teal-500/15 text-teal-400 border border-teal-500/30" : "bg-surge-purple/15 text-surge-purple border border-surge-purple/30"
                    )}>
                      {user?.role === 'teacher' ? '👨‍🏫 Учитель' : '🎓 Ученик'}
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleToggleUserRole(); }}
                      className="text-[9px] font-bold text-surge-ink/40 hover:text-teal-400 transition-colors underline"
                      title="Переключить режим Учитель / Ученик"
                    >
                      Сменить
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      const themes: ('dark' | 'light' | 'night' | 'glass' | 'neon' | 'gold' | 'silver' | 'ocean' | 'diamond')[] = ['dark', 'light', 'night', 'glass', 'neon', 'gold', 'silver', 'ocean', 'diamond'];
                      const nextTheme = themes[(themes.indexOf(theme) + 1) % themes.length];
                      setTheme(nextTheme);
                    }}
                    className="p-2 hover:bg-surge-ink/10 rounded-lg text-surge-ink/40 hover:text-surge-ink transition-colors hover:scale-110"
                    title={`${TRANSLATIONS[appLanguage].themeTooltip} ${theme}`}
                  >
                    <Palette size={16} />
                  </button>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      const langs: AppLanguage[] = ['ru', 'kk', 'en'];
                      const nextLang = langs[(langs.indexOf(appLanguage) + 1) % langs.length];
                      setAppLanguage(nextLang);
                    }}
                    className="p-2 hover:bg-surge-ink/10 rounded-lg text-surge-ink/40 hover:text-surge-ink transition-colors hover:scale-110 flex items-center justify-center font-bold text-[10px] uppercase w-8"
                    title={`Current language: ${TRANSLATIONS[appLanguage].language}`}
                  >
                    {appLanguage}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                    className="p-2 hover:bg-red-500/20 rounded-lg text-surge-ink/20 hover:text-red-500 transition-colors hover:scale-110"
                    title={TRANSLATIONS[appLanguage].logoutTooltip}
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

        {/* Collapse Button */}
        <div className="hidden md:flex items-center justify-center h-full w-8 bg-surge-bg border-r border-surge-border z-[110]">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-surge-card hover:bg-surge-purple text-surge-ink/60 hover:text-white transition-all shadow-md border border-surge-border"
            title={isSidebarOpen ? "Закрыть отделы" : "Открыть отделы"}
          >
            {isSidebarOpen ? <ChevronsLeft size={16} /> : <ChevronsRight size={16} />}
          </button>
        </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-surge-bg overflow-y-auto">
        {/* Hidden File Input for Attach File buttons */}
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".pdf,.txt,.doc,.docx,.md,image/*"
          multiple
          className="hidden"
        />
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          ref={cameraInputRef} 
          className="hidden" 
          onChange={handleImageUpload} 
        />
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-surge-border bg-surge-card">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-surge-purple">
            <Menu size={24} />
          </button>
          <h1 className="font-display font-bold text-surge-ink">{TRANSLATIONS[appLanguage].appTitle}</h1>
          <div className="w-10" />
        </div>

        {!currentSessionId ? (
          <div className="flex-1 flex flex-col items-center justify-start p-8 pt-20 text-center relative overflow-y-auto mesh-bg">
            <motion.div 
              animate={{ 
                x: [0, 20, -20, 0], 
                y: [0, -20, 20, 0],
                scale: [1, 1.05, 0.95, 1]
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/4 left-1/4 w-96 h-96 bg-surge-purple/20 blur-[140px] rounded-full pointer-events-none" 
            />
            <motion.div 
              animate={{ 
                x: [0, -30, 30, 0], 
                y: [0, 30, -30, 0],
                scale: [1, 0.9, 1.1, 1]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-indigo-500/10 blur-[130px] rounded-full pointer-events-none" 
            />
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={selectedDept === 'Classroom' ? "max-w-6xl z-10 w-full" : "max-w-2xl z-10 w-full"}
            >
              {selectedDept !== 'Classroom' && (
                <>
                  <motion.div 
                    whileHover={{ scale: 1.05, rotate: 0 }}
                    className="w-24 h-24 bg-black/50 backdrop-blur-xl border-2 border-surge-purple/30 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-surge-purple/40 rotate-3 cursor-pointer transition-all hover-glass-card"
                  >
                    <Aperture className="text-surge-purple glow-text pulse-ring" size={48} />
                  </motion.div>
                  <h2 className="font-display text-5xl md:text-7xl font-black mb-6 text-surge-ink tracking-tighter">
                    {(TRANSLATIONS[appLanguage] as any).readyTo || "READY TO"} <span className="text-surge-purple italic glow-text hover:text-indigo-400 transition-colors cursor-pointer block mt-2">{(TRANSLATIONS[appLanguage] as any).study?.toUpperCase() || "STUDY"}</span>?
                  </h2>
                </>
              )}
              
              {selectedDept === 'Classroom' ? (
                <ClassroomPortal 
                  user={user!}
                  onUpdateUser={handleUpdateUser}
                  onAddXp={handleAddXp}
                  showToast={showToast}
                  onNavigateToDept={(dept) => setSelectedDept(dept)}
                  appLanguage={appLanguage}
                />
              ) : selectedDept === 'Marks' ? (
                <div className="bg-surge-card rounded-[2.5rem] p-10 shadow-2xl mb-12 border-2 border-amber-500/20 relative overflow-hidden text-left">
                  <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none text-amber-500">
                    <Trophy size={200} />
                  </div>
                  <h3 className="text-3xl font-display font-black text-amber-500 mb-2 tracking-tight">
                    {appLanguage === 'ru' ? 'Прогноз и Анализ баллов ЕНТ 2026' : appLanguage === 'kk' ? 'ҰБТ 2026 баллдарын талдау' : 'ENT 2026 Score Analyzer'}
                  </h3>
                  <p className="text-surge-ink/40 mb-8 text-sm font-medium">
                    {appLanguage === 'ru' 
                      ? 'Введите ваши текущие баллы пробных тестирований по предметам ЕНТ. Наш ИИ проанализирует ваши результаты и составит персональный пошаговый план подготовки на максимальный балл (140 из 140).'
                      : appLanguage === 'kk'
                      ? 'ҰБТ пәндері бойынша ағымдағы сынақ нәтижелерін енгізіңіз. Біздің ЖИ баллдарды талдап, максималды 140 баллға жетудің жеке жоспарын құрады.'
                      : 'Enter your current practice exam scores for ENT subjects. Our AI will analyze your scores and build a custom preparation plan to reach the maximum 140 points.'}
                  </p>

                  {/* ENT Overall Progress Summary Card */}
                  <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/60">Текущий общий результат</p>
                      <h4 className="text-4xl font-display font-black text-amber-500 mt-1">
                        {Object.entries(marksData).reduce((sum, [sub, val]) => sum + (disabledSubjects.includes(sub) ? 0 : Number(val || 0)), 0)} <span className="text-lg text-surge-ink/40 font-medium">/ 140 баллов</span>
                      </h4>
                      <p className="text-xs text-surge-ink/50 mt-1 font-medium">
                        {appLanguage === 'ru' 
                          ? 'Минимум для государственного гранта: ~100+ баллов' 
                          : 'Мемлекеттік гранттың төменгі шегі: ~100+ балл'}
                      </p>
                    </div>
                    <div className="flex-1 max-w-md">
                      <div className="w-full bg-surge-ink/5 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                          style={{ 
                            width: `${Math.min(100, (Object.entries(marksData).reduce((sum, [sub, val]) => sum + (disabledSubjects.includes(sub) ? 0 : Number(val || 0)), 0) / 140) * 100)}%` 
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-surge-ink/30 uppercase mt-2">
                        <span>0 баллов</span>
                        <span>Пороговый (50)</span>
                        <span>Грант (100)</span>
                        <span>Идеал (140)</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Score Presets */}
                  <div className="flex items-center gap-2 mb-8 flex-wrap relative z-10">
                    <span className="text-xs font-bold text-surge-ink/50 mr-2">Быстрый выбор баллов:</span>
                    <button
                      onClick={() => setMarksData({
                        'История Казахстана (макс. 20)': '15',
                        'Математическая грамотность (макс. 10)': '7',
                        'Грамотность чтения (макс. 10)': '7',
                        [`Профильный предмет 1 (${profileSubject1}) (макс. 50)`]: '21',
                        [`Профильный предмет 2 (${profileSubject2}) (макс. 50)`]: '20'
                      })}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-600 text-xs font-bold transition-all border border-amber-500/20"
                    >
                      Порог (50)
                    </button>
                    <button
                      onClick={() => setMarksData({
                        'История Казахстана (макс. 20)': '18',
                        'Математическая грамотность (макс. 10)': '9',
                        'Грамотность чтения (макс. 10)': '9',
                        [`Профильный предмет 1 (${profileSubject1}) (макс. 50)`]: '33',
                        [`Профильный предмет 2 (${profileSubject2}) (макс. 50)`]: '31'
                      })}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-600 text-xs font-bold transition-all border border-amber-500/20"
                    >
                      Грант (100)
                    </button>
                    <button
                      onClick={() => setMarksData({
                        'История Казахстана (макс. 20)': '20',
                        'Математическая грамотность (макс. 10)': '10',
                        'Грамотность чтения (макс. 10)': '10',
                        [`Профильный предмет 1 (${profileSubject1}) (макс. 50)`]: '50',
                        [`Профильный предмет 2 (${profileSubject2}) (макс. 50)`]: '50'
                      })}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-600 text-xs font-bold transition-all border border-amber-500/20"
                    >
                      Идеал (140)
                    </button>
                    <button
                      onClick={() => setMarksData({
                        'История Казахстана (макс. 20)': '0',
                        'Математическая грамотность (макс. 10)': '0',
                        'Грамотность чтения (макс. 10)': '0',
                        [`Профильный предмет 1 (${profileSubject1}) (макс. 50)`]: '0',
                        [`Профильный предмет 2 (${profileSubject2}) (макс. 50)`]: '0'
                      })}
                      className="px-3 py-1.5 rounded-xl bg-surge-ink/5 hover:bg-red-500 hover:text-white text-surge-ink/60 text-xs font-bold transition-all border border-surge-ink/10"
                    >
                      Сбросить (0)
                    </button>
                  </div>
                  
                  {/* Profile Subjects Pickers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6 bg-amber-500/5 rounded-3xl border border-amber-500/20 relative z-10 text-left">
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-widest text-amber-600 mb-2">
                        {appLanguage === 'ru' ? 'Выбор профильного предмета 1 *' : '1-ші бейінді пәнді таңдау *'}
                      </label>
                      <select
                        value={profileSubject1}
                        onChange={(e) => {
                          const val = e.target.value;
                          const oldKey = `Профильный предмет 1 (${profileSubject1}) (макс. 50)`;
                          const newKey = `Профильный предмет 1 (${val}) (макс. 50)`;
                          const score = marksData[oldKey] || '';
                          const updated = { ...marksData };
                          delete updated[oldKey];
                          updated[newKey] = score;
                          setProfileSubject1(val);
                          setMarksData(updated);
                        }}
                        className="w-full bg-surge-bg border border-amber-500/30 rounded-xl px-4 py-3 text-surge-ink text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      >
                        {[
                          'Физика', 'Математика (Профиль)', 'Химия', 'Биология', 'География', 
                          'Всемирная история', 'Основы права (Құқық)', 'Английский язык', 
                          'Информатика', 'Казахский язык и литература', 'Русский язык и литература'
                        ].map(sub => (
                          <option key={sub} value={sub} className="bg-surge-bg text-surge-ink">{sub}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-widest text-amber-600 mb-2">
                        {appLanguage === 'ru' ? 'Выбор профильного предмета 2 *' : '2-ші бейінді пәнді таңдау *'}
                      </label>
                      <select
                        value={profileSubject2}
                        onChange={(e) => {
                          const val = e.target.value;
                          const oldKey = `Профильный предмет 2 (${profileSubject2}) (макс. 50)`;
                          const newKey = `Профильный предмет 2 (${val}) (макс. 50)`;
                          const score = marksData[oldKey] || '';
                          const updated = { ...marksData };
                          delete updated[oldKey];
                          updated[newKey] = score;
                          setProfileSubject2(val);
                          setMarksData(updated);
                        }}
                        className="w-full bg-surge-bg border border-amber-500/30 rounded-xl px-4 py-3 text-surge-ink text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      >
                        {[
                          'Математика (Профиль)', 'Физика', 'Химия', 'Биология', 'География', 
                          'Всемирная история', 'Основы права (Құқық)', 'Английский язык', 
                          'Информатика', 'Казахский язык и литература', 'Русский язык и литература'
                        ].map(sub => (
                          <option key={sub} value={sub} className="bg-surge-bg text-surge-ink">{sub}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 relative z-10">
                    {(() => {
                      const currentMarks = {
                        'История Казахстана (макс. 20)': marksData['История Казахстана (макс. 20)'] !== undefined ? marksData['История Казахстана (макс. 20)'] : '',
                        'Математическая грамотность (макс. 10)': marksData['Математическая грамотность (макс. 10)'] !== undefined ? marksData['Математическая грамотность (макс. 10)'] : '',
                        'Грамотность чтения (макс. 10)': marksData['Грамотность чтения (макс. 10)'] !== undefined ? marksData['Грамотность чтения (макс. 10)'] : '',
                        [`Профильный предмет 1 (${profileSubject1}) (макс. 50)`]: marksData[`Профильный предмет 1 (${profileSubject1}) (макс. 50)`] !== undefined ? marksData[`Профильный предмет 1 (${profileSubject1}) (макс. 50)`] : '',
                        [`Профильный предмет 2 (${profileSubject2}) (макс. 50)`]: marksData[`Профильный предмет 2 (${profileSubject2}) (макс. 50)`] !== undefined ? marksData[`Профильный предмет 2 (${profileSubject2}) (макс. 50)`] : ''
                      };
                      return Object.entries(currentMarks).map(([subject, val]) => {
                        const isDisabled = disabledSubjects.includes(subject);
                        const maxScore = subject.includes('50') ? 50 : subject.includes('20') ? 20 : 10;
                        const scoreVal = marksData[subject] !== undefined ? marksData[subject] : val;
                        return (
                          <div key={subject} className={cn(
                            "flex items-center justify-between p-4 bg-surge-ink/5 rounded-2xl border transition-all group",
                            isDisabled ? "opacity-40 border-surge-ink/5" : "border-surge-ink/10 hover:border-amber-500/30"
                          )}>
                            <div className="flex items-center gap-3 overflow-hidden">
                              <button 
                                onClick={() => {
                                  if (isDisabled) {
                                    setDisabledSubjects(disabledSubjects.filter(s => s !== subject));
                                  } else {
                                    setDisabledSubjects([...disabledSubjects, subject]);
                                  }
                                }}
                                className={cn(
                                  "p-1.5 rounded-lg transition-all",
                                  isDisabled ? "text-amber-500 bg-amber-500/10" : "text-surge-ink/20 hover:text-amber-500 hover:bg-amber-500/10 opacity-0 group-hover:opacity-100"
                                )}
                                title={isDisabled ? "Показать предмет" : "Скрыть предмет"}
                              >
                                {isDisabled ? <Plus size={14} /> : <X size={14} />}
                              </button>
                              <span className={cn(
                                "text-sm font-bold text-surge-ink truncate",
                                isDisabled && "line-through opacity-30"
                              )}>
                                {subject}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input 
                                type="number"
                                min="0"
                                max={maxScore}
                                disabled={isDisabled}
                                placeholder="0"
                                value={scoreVal}
                                onChange={async (e) => {
                                  const newVal = Math.min(maxScore, Math.max(0, parseInt(e.target.value) || 0)).toString();
                                  setMarksData({...marksData, [subject]: newVal});
                                  if (user && user.name !== 'Guest') {
                                    await updateMark(user.uid, subject, parseInt(newVal) || 0);
                                  }
                                }}
                                className={cn(
                                  "w-16 bg-amber-500/10 border border-amber-500/20 rounded-xl px-2 py-2 text-center text-surge-ink font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50",
                                  isDisabled && "cursor-not-allowed opacity-30"
                                )}
                              />
                              <span className="text-xs font-bold text-surge-ink/20 font-mono">/ {maxScore}</span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  <div className="mb-10 relative z-10">
                    <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-2 ml-1">
                      {appLanguage === 'ru' 
                        ? 'Профильные предметы и темы, вызывающие наибольшие трудности (например: Физика и Математика, оптика, тригонометрия)'
                        : 'Сізге қиындық туғызатын бейінді пәндер мен тақырыптар (мысалы: Физика және Математика, оптика)'}
                    </label>
                    <textarea 
                      rows={3}
                      placeholder={appLanguage === 'ru' ? "Опишите ваши целевые вузы, специальность и предметы ЕНТ..." : "Қалайтын мамандығыңыз, ЖОО және бейінді пәндерді жазыңыз..."}
                      value={marksDescription}
                      onChange={(e) => setMarksDescription(e.target.value)}
                      className="w-full bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 text-surge-ink focus:outline-none focus:border-amber-500/50 transition-all resize-none font-medium text-sm"
                    />
                  </div>

                  <button 
                    onClick={async () => {
                      const activeMarks = Object.entries(marksData)
                        .filter(([s]) => !disabledSubjects.includes(s) && marksData[s] !== '');
                      
                      if (activeMarks.length === 0) {
                        showToast(appLanguage === 'ru' ? "Пожалуйста, введите баллы хотя бы по одному предмету." : "Баға енгізіңіз.", 'error');
                        return;
                      }

                      setIsAnalyzingMarks(true);
                      try {
                        const marksStr = activeMarks.map(([s, g]) => `${s}: ${g}`).join(', ');
                        const response = await ai.models.generateContent({
                          model: "gemini-3.8-flash",
                          contents: `Analyze these actual ENT (Kazakhstan Unified National Testing) practice exam scores (out of a max of 140): ${marksStr}. Maximum possible scores for each subject are: История Казахстана (max 20), Математическая грамотность (max 10), Грамотность чтения (max 10), Профильные предметы (max 50 each). ${marksDescription ? `Additional context from user (targets, university, profile): ${marksDescription}` : ''} Provide a highly customized, expert strategy to increase their score to reach their dream target, identifying specific gaps, preparation tips, and time management. Format using clear Markdown in ${appLanguage === 'ru' ? 'Russian' : appLanguage === 'kk' ? 'Kazakh' : 'English'} language.`,
                          config: { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                        });
                        const analysisText = response.text || response.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '')?.join('');
                        setMarksAnalysisResult(analysisText || "No analysis generated.");
                        addXp(50);
                      } catch (err) {
                        console.error(err);
                        setMarksAnalysisResult("Error analyzing marks.");
                      } finally {
                        setIsAnalyzingMarks(false);
                      }
                    }}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-[0.2em] py-6 rounded-2xl shadow-2xl shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
                  >
                    {isAnalyzingMarks ? 'ANALYZING...' : 'EXECUTE_ANALYSIS'}
                  </button>
                  {marksAnalysisResult && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-10 text-left relative z-10"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="text-amber-500 font-display font-bold text-xl uppercase tracking-widest">Analysis Result</h4>
                        <button 
                          onClick={() => setMarksAnalysisResult(null)}
                          className="text-[10px] font-black text-surge-ink/30 uppercase tracking-widest hover:text-amber-500 transition-colors"
                        >
                          Clear Analysis
                        </button>
                      </div>
                      <div className="bg-surge-ink/5 p-8 rounded-[2rem] border border-surge-ink/10 shadow-inner max-h-[500px] overflow-y-auto custom-scrollbar">
                        <div className="markdown-body overflow-x-auto">
                          <Markdown>{marksAnalysisResult}</Markdown>
                        </div>
                      </div>
                      <div className="mt-8">
                        <button 
                          onClick={() => copyToClipboard(marksAnalysisResult!)}
                          className="w-full bg-surge-ink/10 text-surge-ink font-bold py-4 rounded-2xl hover:bg-surge-ink/20 transition-all"
                        >
                          Copy Analysis
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : selectedDept === 'Flashcards' ? (
                <div className="bg-surge-card rounded-[2.5rem] p-10 shadow-2xl mb-12 border-2 border-blue-500/20 relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
                  <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none text-blue-500">
                    <Layers size={200} />
                  </div>
                  <h3 className="text-3xl font-display font-black text-blue-500 mb-2 tracking-tight relative z-10">{TRANSLATIONS[appLanguage].flashcardStudio || "Flashcard Studio"}</h3>
                  <p className="text-surge-ink/40 mb-10 text-sm font-medium relative z-10">{TRANSLATIONS[appLanguage].flashcardSubtitle || "Create custom study cards in seconds."}</p>
                  
                  <div className="space-y-6 mb-10 relative z-10">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-3 ml-2">Предмет ЕНТ</label>
                        <select 
                          value={flashcardsData.grade}
                          onChange={(e) => setFlashcardsData({...flashcardsData, grade: e.target.value})}
                          className="w-full bg-surge-ink/10 border-2 border-transparent rounded-2xl px-6 py-5 text-surge-ink font-bold focus:outline-none focus:border-blue-500/30 focus:bg-surge-ink/[0.05] transition-all cursor-pointer appearance-none"
                        >
                          <option value="Математика (Профиль)" className="bg-surge-bg text-surge-ink">Математика ЕНТ</option>
                          <option value="Физика" className="bg-surge-bg text-surge-ink">Физика ЕНТ</option>
                          <option value="Химия" className="bg-surge-bg text-surge-ink">Химия ЕНТ</option>
                          <option value="Биология" className="bg-surge-bg text-surge-ink">Биология ЕНТ</option>
                          <option value="География" className="bg-surge-bg text-surge-ink">География ЕНТ</option>
                          <option value="Всемирная история" className="bg-surge-bg text-surge-ink">Всемирная история ЕНТ</option>
                          <option value="Основы права" className="bg-surge-bg text-surge-ink">Основы права / Құқық ЕНТ</option>
                          <option value="Английский язык" className="bg-surge-bg text-surge-ink">Английский язык / Иностранный ЕНТ</option>
                          <option value="Казахский язык и литература" className="bg-surge-bg text-surge-ink">Казахский язык и литература ЕНТ</option>
                          <option value="Русский язык и литература" className="bg-surge-bg text-surge-ink">Русский язык и литература ЕНТ</option>
                          <option value="Информатика" className="bg-surge-bg text-surge-ink">Информатика / IT ЕНТ</option>
                          <option value="История Казахстана" className="bg-surge-bg text-surge-ink">История Казахстана ЕНТ</option>
                          <option value="Математическая грамотность" className="bg-surge-bg text-surge-ink">Математическая грамотность ЕНТ</option>
                          <option value="Грамотность чтения" className="bg-surge-bg text-surge-ink">Грамотность чтения ЕНТ</option>
                        </select>
                      </div>
                      <div className="md:w-1/3">
                        <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-3 ml-2">Count</label>
                        <select 
                          value={flashcardsData.count}
                          onChange={(e) => setFlashcardsData({...flashcardsData, count: parseInt(e.target.value)})}
                          className="w-full bg-surge-ink/10 border-2 border-transparent rounded-2xl px-6 py-5 text-surge-ink font-bold focus:outline-none focus:border-blue-500/30 focus:bg-surge-ink/[0.05] transition-all appearance-none cursor-pointer"
                        >
                          <option value={5} className="bg-surge-bg text-surge-ink">5 Cards</option>
                          <option value={10} className="bg-surge-bg text-surge-ink">10 Cards</option>
                          <option value={15} className="bg-surge-bg text-surge-ink">15 Cards</option>
                          <option value={20} className="bg-surge-bg text-surge-ink">20 Cards</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-3 ml-2">
                        <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest">Комментарий к карточкам (пожелания/акцент)</label>
                        <div className="flex items-center gap-4">
                          {uploadedFiles.length > 0 ? (
                            <button 
                              onClick={clearAllFiles}
                              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors"
                            >
                              <X size={12} />
                              Clear Files
                            </button>
                          ) : (
                            <button 
                              onClick={() => fileInputRef.current?.click()}
                              className={cn(
                                "flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest transition-colors",
                                "text-surge-ink/30 hover:text-blue-500"
                              )}
                            >
                              <Paperclip size={12} />
                              Attach File
                            </button>
                          )}
                          <button 
                            onClick={() => setShowUrlInput(!showUrlInput)}
                            className={cn(
                              "flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest transition-colors",
                              contentUrl ? "text-blue-500" : "text-surge-ink/30 hover:text-blue-500"
                            )}
                          >
                            <Link size={12} />
                            {contentUrl ? "Link Attached" : "Attach Link"}
                          </button>
                        </div>
                      </div>
                      <input 
                        type="text"
                        placeholder="Например: С упором на формулы, ключевые даты или сложные термины..."
                        value={flashcardsData.topic}
                        onChange={(e) => setFlashcardsData({...flashcardsData, topic: e.target.value})}
                        className="w-full bg-surge-ink/10 border-2 border-transparent rounded-2xl px-6 py-5 text-surge-ink font-bold focus:outline-none focus:border-blue-500/30 focus:bg-surge-ink/[0.05] transition-all text-sm"
                      />
                    </div>

                    {showUrlInput && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 relative"
                      >
                        <button 
                          onClick={() => setShowUrlInput(false)}
                          className="absolute top-2 right-2 p-1 text-surge-ink/30 hover:text-surge-ink bg-surge-ink/5 hover:bg-surge-ink/10 rounded-full transition-colors"
                        >
                          <X size={14} />
                        </button>
                        <label className="block text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2 ml-1">Source URL (YouTube, Article, etc.)</label>
                        <div className="flex gap-2">
                          <input 
                            type="url"
                            placeholder="https://..."
                            value={contentUrl}
                            onChange={(e) => setContentUrl(e.target.value)}
                            className="flex-1 bg-surge-ink/10 border border-blue-500/20 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-all text-surge-ink"
                          />
                          {contentUrl && (
                            <button 
                              onClick={() => setContentUrl('')}
                              className="p-2 text-surge-ink/30 hover:text-red-500 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                  <button 
                    onClick={() => {
                      const gradeContext = flashcardsData.grade ? ` по предмету ${flashcardsData.grade}` : '';
                      const wishes = flashcardsData.topic ? ` с учетом пожеланий: ${flashcardsData.topic}` : '';
                      const urlContext = contentUrl ? ` based on this source: ${contentUrl}` : '';
                      createNewSession('flashcards', 'Flashcards', `Создай ${flashcardsData.count} качественных обучающих карточек ЕНТ${gradeContext}${wishes}${urlContext}`);
                      addXp(30);
                    }}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black uppercase tracking-[0.2em] py-6 rounded-2xl shadow-2xl shadow-blue-500/20 transition-all active:scale-95"
                  >
                    Создать карточки ЕНТ
                  </button>
                </div>
              ) : selectedDept === 'Quizzes' ? (
                <div className="bg-surge-card rounded-[2.5rem] p-10 shadow-2xl mb-12 border-2 border-pink-500/20 relative overflow-hidden">
                  <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl"></div>
                  <div className="absolute -left-10 -bottom-10 opacity-5 pointer-events-none text-pink-500">
                    <HelpCircle size={200} />
                  </div>
                  
                  <div className="relative z-10">
                    <h3 className="text-3xl font-display font-black text-pink-500 mb-2 tracking-tight">{TRANSLATIONS[appLanguage].quizGenerator || "Pop Quiz Generator"}</h3>
                    <p className="text-surge-ink/40 mb-10 text-sm font-medium">{TRANSLATIONS[appLanguage].quizSubtitle || "Test your knowledge with AI-generated questions."}</p>
                    
                    <div className="space-y-8 mb-10">
                      <div className="border-b-2 border-surge-ink/10 pb-4">
                        <div className="flex items-center justify-between mb-2 ml-1">
                          <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest">Предмет ЕНТ</label>
                        <div className="flex items-center gap-4">
                          {uploadedFiles.length > 0 ? (
                            <button 
                              onClick={clearAllFiles}
                              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors"
                            >
                              <X size={12} />
                              Clear Files
                            </button>
                          ) : (
                            <button 
                              onClick={() => fileInputRef.current?.click()}
                              className={cn(
                                "flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest transition-colors",
                                "text-surge-ink/30 hover:text-pink-500"
                              )}
                            >
                              <Paperclip size={12} />
                              Attach File
                            </button>
                          )}
                          <button 
                            onClick={() => setShowUrlInput(!showUrlInput)}
                            className={cn(
                              "flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest transition-colors",
                              contentUrl ? "text-pink-500" : "text-surge-ink/30 hover:text-pink-500"
                            )}
                          >
                            <Link size={12} />
                            {contentUrl ? "Link Attached" : "Attach Link"}
                          </button>
                        </div>
                        </div>
                        <select 
                          value={quizzesData.grade}
                          onChange={(e) => setQuizzesData({...quizzesData, grade: e.target.value})}
                          className="w-full bg-surge-ink/10 border-none rounded-xl px-4 py-3 text-surge-ink font-bold text-lg focus:outline-none focus:ring-2 focus:ring-pink-500/30 cursor-pointer appearance-none"
                        >
                          <option value="Математика (Профиль)" className="bg-surge-bg text-surge-ink">Математика ЕНТ</option>
                          <option value="Физика" className="bg-surge-bg text-surge-ink">Физика ЕНТ</option>
                          <option value="Химия" className="bg-surge-bg text-surge-ink">Химия ЕНТ</option>
                          <option value="Биология" className="bg-surge-bg text-surge-ink">Биология ЕНТ</option>
                          <option value="География" className="bg-surge-bg text-surge-ink">География ЕНТ</option>
                          <option value="Всемирная история" className="bg-surge-bg text-surge-ink">Всемирная история ЕНТ</option>
                          <option value="Основы права" className="bg-surge-bg text-surge-ink">Основы права / Құқық ЕНТ</option>
                          <option value="Английский язык" className="bg-surge-bg text-surge-ink">Английский язык / Иностранный ЕНТ</option>
                          <option value="Казахский язык и литература" className="bg-surge-bg text-surge-ink">Казахский язык и литература ЕНТ</option>
                          <option value="Русский язык и литература" className="bg-surge-bg text-surge-ink">Русский язык и литература ЕНТ</option>
                          <option value="Информатика" className="bg-surge-bg text-surge-ink">Информатика / IT ЕНТ</option>
                          <option value="История Казахстана" className="bg-surge-bg text-surge-ink">История Казахстана ЕНТ</option>
                          <option value="Математическая грамотность" className="bg-surge-bg text-surge-ink">Математическая грамотность ЕНТ</option>
                          <option value="Грамотность чтения" className="bg-surge-bg text-surge-ink">Грамотность чтения ЕНТ</option>
                        </select>
                      </div>

                      {showUrlInput && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-pink-500/5 border border-pink-500/20 rounded-2xl p-4 relative"
                        >
                          <button 
                            onClick={() => setShowUrlInput(false)}
                            className="absolute top-2 right-2 p-1 text-surge-ink/30 hover:text-surge-ink bg-surge-ink/5 hover:bg-surge-ink/10 rounded-full transition-colors"
                          >
                            <X size={14} />
                          </button>
                          <label className="block text-[10px] font-bold text-pink-500 uppercase tracking-widest mb-2 ml-1">Source URL (YouTube, Article, etc.)</label>
                          <div className="flex gap-2">
                            <input 
                              type="url"
                              placeholder="https://..."
                              value={contentUrl}
                              onChange={(e) => setContentUrl(e.target.value)}
                              className="flex-1 bg-surge-ink/10 border border-pink-500/20 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-pink-500 transition-all text-surge-ink"
                            />
                            {contentUrl && (
                              <button 
                                onClick={() => setContentUrl('')}
                                className="p-2 text-surge-ink/30 hover:text-red-500 transition-colors"
                              >
                                <X size={16} />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                      <div className="border-b-2 border-surge-ink/10 pb-4">
                        <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-2 ml-1">Комментарий к викторине (пожелания/акцент)</label>
                        <input 
                          type="text"
                          placeholder="Например: С упором на ключевые даты, формулы или практические задания..."
                          value={quizzesData.topic}
                          onChange={(e) => setQuizzesData({...quizzesData, topic: e.target.value})}
                          className="w-full bg-surge-ink/10 border-none rounded-xl px-4 py-3 text-surge-ink font-bold text-base focus:outline-none focus:ring-2 focus:ring-pink-500/30 placeholder:text-surge-ink/20"
                        />
                      </div>
                      <div className="border-b-2 border-surge-ink/10 pb-4">
                        <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-2 ml-1">Количество вопросов</label>
                        <select 
                          value={quizzesData.count}
                          onChange={(e) => setQuizzesData({...quizzesData, count: parseInt(e.target.value)})}
                          className="w-full bg-surge-ink/10 border-none rounded-xl px-4 py-3 text-surge-ink font-bold text-lg focus:outline-none focus:ring-2 focus:ring-pink-500/30 appearance-none cursor-pointer"
                        >
                          <option value={5} className="bg-surge-bg text-surge-ink">5 вопросов (Экспресс)</option>
                          <option value={10} className="bg-surge-bg text-surge-ink">10 вопросов (Стандарт)</option>
                          <option value={15} className="bg-surge-bg text-surge-ink">15 вопросов (Углубленный)</option>
                          <option value={20} className="bg-surge-bg text-surge-ink">20 вопросов (Экзаменационный)</option>
                        </select>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        const gradeContext = quizzesData.grade ? ` по предмету ${quizzesData.grade}` : '';
                        const wishes = quizzesData.topic ? ` с учетом пожеланий: ${quizzesData.topic}` : '';
                        const urlContext = contentUrl ? ` based on this source: ${contentUrl}` : '';
                        createNewSession('quiz', 'Quizzes', `Создай официальную викторину ЕНТ из ${quizzesData.count} вопросов${gradeContext}${wishes}${urlContext}`);
                        addXp(30);
                      }}
                      className="w-full bg-pink-500 hover:bg-pink-600 text-white font-black uppercase tracking-[0.2em] py-6 rounded-2xl shadow-2xl shadow-pink-500/20 transition-all active:scale-95"
                    >
                      Запустить викторину ЕНТ
                    </button>
                  </div>
                </div>
              ) : selectedDept === 'Plan' ? (
                <div className="bg-surge-card rounded-[2.5rem] p-10 shadow-2xl mb-12 border-2 border-green-500/20 relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none text-green-500">
                    <Calendar size={200} />
                  </div>
                  <h3 className="text-3xl font-display font-black text-green-500 mb-2 tracking-tight relative z-10">{TRANSLATIONS[appLanguage].studyPlanArchitect || "Study Plan Architect"}</h3>
                  <p className="text-surge-ink/40 text-sm mb-10 font-medium relative z-10">{TRANSLATIONS[appLanguage].buildStructuredPath || "Build a structured path to your academic goals."}</p>
                  
                  {!planResult ? (
                    <>
                      <div className="space-y-6 mb-10 text-left relative z-10">
                        <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-3 ml-2">What are you studying for?</label>
                        <textarea 
                          rows={4}
                          placeholder="e.g. Final Exams in 2 weeks, Learning Python from scratch, SAT preparation..."
                          value={planGoal}
                          onChange={(e) => setPlanGoal(e.target.value)}
                          className="w-full bg-surge-ink/5 border-2 border-transparent rounded-2xl px-6 py-5 text-surge-ink font-bold focus:outline-none focus:border-green-500/30 focus:bg-surge-ink/[0.02] transition-all resize-none shadow-inner text-sm"
                        />
                      </div>
                      <button 
                        disabled={!planGoal.trim() || isPlanning}
                        onClick={async () => {
                          setIsPlanning(true);
                          try {
                            // replaced with shared ai proxy
                            const response = await ai.models.generateContent({
                              model: "gemini-3.8-flash",
                              contents: `Create a detailed, step-by-step study plan for the following goal: ${planGoal}. Format it as a structured list with clear milestones and daily tasks. Use Markdown. MUST format response strictly in ${appLanguage === 'ru' ? 'Russian' : appLanguage === 'kk' ? 'Kazakh' : 'English'} language.`,
                              config: { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                            });
                            const planText = response.text || response.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '')?.join('');
                            setPlanResult(planText || "No plan generated.");
                            if (user) await updateXP(user.uid, 50);
                          } catch (err) {
                            console.error(err);
                            setPlanResult("Error generating plan.");
                          } finally {
                            setIsPlanning(false);
                          }
                        }}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-black uppercase tracking-[0.2em] py-6 rounded-2xl shadow-2xl shadow-green-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
                      >
                        {isPlanning ? 'ARCHITECTING...' : 'DRAFT_MY_PLAN'}
                      </button>
                    </>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-left relative z-10"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="text-green-500 font-display font-bold text-xl uppercase tracking-widest">Your Study Roadmap</h4>
                        <div className="flex gap-4">
                          <button 
                            onClick={async () => {
                              if (user) {
                                await copyToClipboard(planResult);
                                showToast("Plan copied to clipboard!", 'success');
                              }
                            }}
                            className="text-[10px] font-black text-green-500 uppercase tracking-widest hover:underline"
                          >
                            Copy to Clipboard
                          </button>
                          <button 
                            onClick={() => setPlanResult(null)}
                            className="text-[10px] font-black text-surge-ink/30 uppercase tracking-widest hover:text-green-500 transition-colors"
                          >
                            Create New Plan
                          </button>
                        </div>
                      </div>
                      <div className="bg-surge-ink/5 p-8 rounded-[2rem] border border-surge-ink/10 shadow-inner max-h-[500px] overflow-y-auto custom-scrollbar">
                        <div className="markdown-body overflow-x-auto">
                          <Markdown>{planResult}</Markdown>
                        </div>
                      </div>
                      <div className="mt-8">
                        <button 
                          onClick={() => copyToClipboard(planResult)}
                          className="w-full bg-surge-ink/10 text-surge-ink font-bold py-4 rounded-2xl hover:bg-surge-ink/20 transition-all"
                        >
                          Copy Plan
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : selectedDept === 'Test' ? (
                <EntExamSimulator
                  user={user}
                  appLanguage={appLanguage}
                  isSidebarOpen={isSidebarOpen}
                  onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                  onCompleteExam={({ score, maxScore, mode }) => {
                    addXp(mode === 'full' ? 150 : 50);
                    if (user?.uid) {
                      import('./firebase').then(({ updateTestsCompleted }) => {
                        updateTestsCompleted(user.uid);
                      });
                    }
                  }}
                  onExit={() => setSelectedDept('General')}
                />
              ) : selectedDept === 'Translator' ? (
                <div className="bg-surge-card rounded-[2rem] p-8 shadow-2xl mb-12 border border-emerald-500/20 relative overflow-hidden text-surge-ink">
                  <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none text-emerald-500">
                    <Globe size={200} />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-emerald-500 mb-2">AI.Support</h3>
                  <p className="text-surge-ink/40 text-sm mb-6 font-medium">{appLanguage === 'kk' ? 'Аудармашы және Дос пен қолдау (Мотивация)' : 'Переводчик & Друг и поддержка (Мотивация и вдохновение)'}</p>
                  
                  <div className="flex space-x-2 mb-6 relative z-10 bg-surge-ink/5 p-1 rounded-xl">
                    <button
                      onClick={() => setTranslatorMode('translate')}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${translatorMode === 'translate' ? 'bg-emerald-500 text-white shadow-md' : 'text-surge-ink/50 hover:text-surge-ink'}`}
                    >
                      {appLanguage === 'kk' ? 'Аудармашы' : 'Переводчик'}
                    </button>
                    <button
                      onClick={() => setTranslatorMode('psychologist')}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${translatorMode === 'psychologist' ? 'bg-emerald-500 text-white shadow-md' : 'text-surge-ink/50 hover:text-surge-ink'}`}
                    >
                      {appLanguage === 'kk' ? 'Дос және қолдау' : 'Друг и поддержка'}
                    </button>
                  </div>

                  {translatorMode === 'translate' ? (
                    <>
                      <div className="space-y-6 mb-8 text-left relative z-10">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                            <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-2 ml-1">Source</label>
                            <select 
                              value={translatorData.sourceLang}
                              onChange={(e) => setTranslatorData({...translatorData, sourceLang: e.target.value})}
                              className="w-full bg-transparent border-none px-1 py-2 text-surge-ink focus:outline-none focus:ring-0 appearance-none font-bold"
                            >
                              {['Auto Detect', 'Russian', 'English', 'Kazakh', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Turkish', 'Arabic', 'Italian', 'Portuguese'].map(lang => (
                                <option key={lang} value={lang} className="bg-surge-card text-surge-ink">{lang}</option>
                              ))}
                            </select>
                          </div>
                          <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                            <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-2 ml-1">Target</label>
                            <select 
                              value={translatorData.targetLang}
                              onChange={(e) => setTranslatorData({...translatorData, targetLang: e.target.value})}
                              className="w-full bg-transparent border-none px-1 py-2 text-surge-ink focus:outline-none focus:ring-0 appearance-none font-bold"
                            >
                              {['English', 'Russian', 'Kazakh', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Turkish', 'Arabic', 'Italian', 'Portuguese'].map(lang => (
                                <option key={lang} value={lang} className="bg-surge-card text-surge-ink">{lang}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-2 ml-1">Input Text</label>
                          <textarea 
                            rows={4}
                            placeholder="Type anything here..."
                            value={translatorData.text}
                            onChange={(e) => setTranslatorData({...translatorData, text: e.target.value})}
                            className="w-full bg-surge-ink/5 border border-surge-ink/10 rounded-xl px-4 py-3 text-surge-ink focus:outline-none focus:border-emerald-500/50 transition-all resize-none font-medium text-sm"
                          />
                        </div>
                      </div>
                      <button 
                        disabled={!translatorData.text.trim() || isTranslating}
                        onClick={async () => {
                          setIsTranslating(true);
                          try {
                            const source = translatorData.sourceLang === 'Auto Detect' ? 'detected language' : translatorData.sourceLang;
                            // replaced with shared ai proxy
                            const response = await ai.models.generateContent({
                              model: "gemini-3.8-flash",
                              contents: `Translate the following text from ${source} to ${translatorData.targetLang}:\n\n${translatorData.text}`,
                              config: { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                            });
                            const transText = response.text || response.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '')?.join('');
                            setTranslatorResult(transText || "No translation generated.");
                            addXp(20);
                          } catch (err) {
                            console.error(err);
                            setTranslatorResult("Error generating translation.");
                          } finally {
                            setIsTranslating(false);
                          }
                        }}
                        className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-mono font-bold py-4 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
                      >
                        {isTranslating ? 'TRANSLATING...' : 'EXECUTE_TRANSLATION'}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="space-y-6 mb-8 text-left relative z-10">
                        <div>
                          <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-2 ml-1">
                            {appLanguage === 'kk' ? 'Қалай сезініп отырсың? Не мазалайды?' : 'Как ты себя чувствуешь? Поделись тем, что на душе:'}
                          </label>
                          <textarea 
                            rows={3}
                            placeholder={appLanguage === 'kk' ? "Мысалы: ҰБТ жақындаған сайын қобалжып жүрмін, күшім қалмағандай..." : "Например: Сильно переживаю из-за ЕНТ, чувствую выгорание и усталость..."}
                            value={psychologistData.problem}
                            onChange={(e) => setPsychologistData({...psychologistData, problem: e.target.value})}
                            className="w-full bg-surge-ink/5 border border-surge-ink/10 rounded-xl px-4 py-3 text-surge-ink focus:outline-none focus:border-emerald-500/50 transition-all resize-none font-medium text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                            <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-2 ml-1">
                              {appLanguage === 'kk' ? 'Көңіл-күй' : 'Текущее состояние'}
                            </label>
                            <select 
                              value={psychologistData.mood}
                              onChange={(e) => setPsychologistData({...psychologistData, mood: e.target.value})}
                              className="w-full bg-transparent border-none px-1 py-2 text-surge-ink focus:outline-none focus:ring-0 appearance-none font-bold text-sm"
                            >
                              {['Стресс / Переживания', 'Выгорание / Усталость', 'Тревожность перед тестом', 'Потеря мотивации', 'Одиночество / Непонимание'].map(t => (
                                <option key={t} value={t} className="bg-surge-card text-surge-ink">{t}</option>
                              ))}
                            </select>
                          </div>
                          <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                            <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-2 ml-1">
                              {appLanguage === 'kk' ? 'Қолдау түрі' : 'Формат поддержки'}
                            </label>
                            <select 
                              value={psychologistData.approach}
                              onChange={(e) => setPsychologistData({...psychologistData, approach: e.target.value})}
                              className="w-full bg-transparent border-none px-1 py-2 text-surge-ink focus:outline-none focus:ring-0 appearance-none font-bold text-sm"
                            >
                              {['Дружеское ободрение', 'Практический совет', 'Мощная мотивация', 'Спокойствие и дыхание'].map(l => (
                                <option key={l} value={l} className="bg-surge-card text-surge-ink">{l}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                      <button 
                        disabled={!psychologistData.problem.trim() || isTranslating}
                        onClick={async () => {
                          setIsTranslating(true);
                          try {
                            const response = await ai.models.generateContent({
                              model: "gemini-3.8-flash",
                              contents: `You are an empathetic, encouraging friend and mentor for an ENT (Unified National Testing) student. A student feels ${psychologistData.mood.toLowerCase()} and shares: "${psychologistData.problem}". Respond warmly, validate their emotions, give practical stress-relief and study motivation tips, and inspire confidence in their upcoming exams. Be like a caring best friend and mentor. MUST format response strictly in ${appLanguage === 'ru' ? 'Russian' : appLanguage === 'kk' ? 'Kazakh' : 'English'} language.`,
                              config: { thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL } }
                            });
                            const supportText = response.text || response.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '')?.join('');
                            setTranslatorResult(supportText || "No response generated.");
                            addXp(20);
                          } catch (err) {
                            console.error(err);
                            setTranslatorResult("Error generating support message.");
                          } finally {
                            setIsTranslating(false);
                          }
                        }}
                        className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-mono font-bold py-4 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
                      >
                        {isTranslating ? (appLanguage === 'kk' ? 'ҚОЛДАУ ДАЙЫНДАЛУДА...' : 'ПОДГОТОВКА ПОДДЕРЖКИ...') : (appLanguage === 'kk' ? 'ДОСТЫҚ ҚОЛДАУ АЛУ' : 'ПОЛУЧИТЬ ПОДДЕРЖКУ ДРУГА')}
                      </button>
                    </>
                  )}
                  
                  {translatorResult && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-8 p-8 bg-surge-card rounded-3xl text-left relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-t-8 border-emerald-500 overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-500">
                        <Globe size={80} />
                      </div>
                      <div className="flex justify-between items-center mb-6 border-b border-surge-ink/5 pb-4">
                        <div>
                          <h4 className="text-emerald-500 font-display font-bold text-lg uppercase tracking-widest">AI Result Screen</h4>
                          <p className="text-surge-ink/40 text-[10px] font-bold uppercase tracking-widest">Generated by Spyris Neural Engine</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => copyToClipboard(translatorResult)}
                            className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-colors"
                            title="Copy to clipboard"
                          >
                            <Copy size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              handleSendMessage(undefined, `[AI Generated Result]:\n\n${translatorResult}`);
                              setTranslatorResult('');
                            }}
                            className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                            title="Send to chat"
                          >
                            <Send size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="text-surge-ink font-medium whitespace-pre-wrap leading-relaxed font-sans text-lg">
                        {translatorResult}
                      </div>
                      <div className="mt-8 pt-4 border-t border-surge-ink/5 flex justify-between items-center">
                        <div className="flex gap-1">
                          {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500/20" />)}
                        </div>
                        <span className="text-[10px] font-bold text-emerald-500/30 uppercase tracking-tighter">End of transmission</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : selectedDept === 'Voice' ? (
                <div className="bg-surge-card rounded-[2.5rem] p-10 shadow-2xl mb-12 border-2 border-indigo-500/20 relative overflow-hidden flex flex-col items-center min-h-[520px] justify-center">
                  <div className="absolute -left-10 -top-10 w-64 h-64 bg-surge-purple/5 rounded-full blur-3xl"></div>
                  <div className="absolute -left-10 -top-10 opacity-5 pointer-events-none text-surge-purple">
                    <Mic size={200} />
                  </div>
                  
                  <div className="relative z-10 text-center mb-8">
                    <h2 className="text-4xl font-display font-bold text-surge-ink mb-3">
                      {appLanguage === 'kk' ? 'Дауыстық диалог' : 'Голосовой диалог'}
                    </h2>
                    <p className="text-surge-ink/50 font-medium text-sm max-w-md mx-auto mb-6">
                      {appLanguage === 'kk'
                        ? 'Сұрақтарыңызды қазақша немесе орысша қойыңыз — Spyris дәл сол тілде жауап береді.'
                        : 'Говорите на русском или казахском — Spyris ответит строго на том же языке.'}
                    </p>

                    {/* Language selector toggle */}
                    <div className="inline-flex items-center gap-1.5 p-1.5 bg-surge-ink/5 rounded-2xl border border-surge-ink/10">
                      <button
                        onClick={() => {
                          setVoiceLangMode('auto');
                          if (isLiveActive) stopLiveSession();
                        }}
                        className={cn(
                          "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all",
                          voiceLangMode === 'auto' 
                            ? "bg-surge-purple text-white shadow-md" 
                            : "text-surge-ink/50 hover:text-surge-ink"
                        )}
                      >
                        {appLanguage === 'kk' ? 'Авто (айтқан тілде)' : 'Авто (как говорю)'}
                      </button>
                      <button
                        onClick={() => {
                          setVoiceLangMode('ru');
                          if (isLiveActive) stopLiveSession();
                        }}
                        className={cn(
                          "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all",
                          voiceLangMode === 'ru' 
                            ? "bg-surge-purple text-white shadow-md" 
                            : "text-surge-ink/50 hover:text-surge-ink"
                        )}
                      >
                        Русский
                      </button>
                      <button
                        onClick={() => {
                          setVoiceLangMode('kk');
                          if (isLiveActive) stopLiveSession();
                        }}
                        className={cn(
                          "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all",
                          voiceLangMode === 'kk' 
                            ? "bg-surge-purple text-white shadow-md" 
                            : "text-surge-ink/50 hover:text-surge-ink"
                        )}
                      >
                        Қазақша
                      </button>
                    </div>
                  </div>

                  <div className="w-48 h-48 rounded-full bg-surge-purple/10 flex items-center justify-center mb-8 relative z-10">
                    {isLiveActive && (
                      <>
                        <motion.div 
                          animate={{ scale: isAiSpeaking ? [1, 2, 1] : [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                          transition={{ duration: isAiSpeaking ? 1 : 2, repeat: Infinity }}
                          className={cn("absolute inset-0 rounded-full", isAiSpeaking ? "bg-indigo-500" : "bg-surge-purple")}
                        />
                        <motion.div 
                          animate={{ scale: isAiSpeaking ? [1, 1.6, 1] : [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
                          transition={{ duration: isAiSpeaking ? 0.8 : 1.5, repeat: Infinity, delay: 0.3 }}
                          className={cn("absolute inset-0 rounded-full", isAiSpeaking ? "bg-indigo-500" : "bg-surge-purple")}
                        />
                      </>
                    )}
                    <div className={cn(
                      "w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 z-10",
                      isLiveActive 
                        ? (isAiSpeaking ? "bg-indigo-600 shadow-indigo-500/40 scale-110" : "bg-surge-purple shadow-surge-purple/40 scale-105") 
                        : "bg-surge-ink/10"
                    )}>
                      {isLiveActive ? (
                        isAiSpeaking ? <Volume2 size={50} className="text-white animate-pulse" /> : <Mic size={50} className="text-white animate-pulse" />
                      ) : (
                        <Mic size={50} className="text-surge-ink/40" />
                      )}
                    </div>
                  </div>

                  {/* Status label */}
                  {isLiveActive && (
                    <div className="mb-6 relative z-10">
                      <span className={cn(
                        "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border",
                        isAiSpeaking 
                          ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/30 animate-pulse" 
                          : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                      )}>
                        <span className={cn("w-2 h-2 rounded-full", isAiSpeaking ? "bg-indigo-500 animate-ping" : "bg-emerald-500")} />
                        {isAiSpeaking 
                          ? (appLanguage === 'kk' ? 'ИИ сөйлеп жатыр... Тоқтату үшін басыңыз' : 'ИИ говорит... Нажмите СТОП чтобы остановить') 
                          : (appLanguage === 'kk' ? 'Сізді тыңдап тұр... Микрофонға сөйлеңіз' : 'Слушаю вас... Говорите в микрофон')}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col items-center gap-6 relative z-10 w-full max-w-md">
                    {isLiveActive ? (
                      <button 
                        onClick={stopLiveSession}
                        className="px-14 py-4 bg-red-600 hover:bg-red-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-red-500/30 transition-all active:scale-95 flex items-center gap-3 cursor-pointer"
                        title="Остановить голос и микрофон"
                      >
                        <Square size={20} fill="currentColor" />
                        {appLanguage === 'kk' ? 'ТОҚТАТУ (СТОП)' : 'ОСТАНОВИТЬ (СТОП)'}
                      </button>
                    ) : (
                      <button 
                        onClick={startLiveSession}
                        className="px-14 py-4 bg-surge-purple hover:bg-surge-purple/90 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-surge-purple/30 transition-all active:scale-95 flex items-center gap-3 cursor-pointer"
                      >
                        <Play size={20} fill="currentColor" />
                        {appLanguage === 'kk' ? 'СӨЙЛЕСУДІ БАСТАУ' : 'НАЧАТЬ РАЗГОВОР'}
                      </button>
                    )}

                    {liveTranscription && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full p-6 bg-surge-ink/5 rounded-2xl border border-surge-ink/10 text-center"
                      >
                        <p className="text-surge-ink/70 italic text-sm leading-relaxed">
                          "{liveTranscription.slice(-180)}..."
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>
              ) : selectedDept === 'Experience' ? (
                <div className="bg-surge-card rounded-[2.5rem] p-10 shadow-2xl mb-12 border-2 border-yellow-500/20 relative overflow-hidden text-left">
                  <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none text-yellow-500">
                    <Trophy size={200} />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
                      <div className="w-24 h-24 rounded-[2rem] bg-yellow-500 flex items-center justify-center shadow-2xl shadow-yellow-500/40 flex-shrink-0 rotate-3">
                        <Trophy className="text-white" size={48} />
                      </div>
                      <div className="text-center md:text-left">
                        <h3 className="text-4xl font-display font-black text-surge-ink mb-2 tracking-tight uppercase">LEVEL {user?.level || 1}</h3>
                        <div className="flex items-center gap-3 justify-center md:justify-start">
                          <span className="text-yellow-500 font-black uppercase tracking-[0.2em] text-xs px-3 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/20">Mastery Rank: {user?.rank || 'Novice Scholar'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5 mb-12">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em]">
                        <span className="text-surge-ink/30">Progress to Level {(user?.level || 1) + 1}</span>
                        <span className="text-yellow-500">{(user?.xp || 0) % 1000} / 1000 XP</span>
                      </div>
                      <div className="w-full h-6 bg-surge-ink/5 rounded-2xl overflow-hidden border-2 border-surge-ink/5 p-1">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${((user?.xp || 0) % 1000) / 10}%` }}
                          className="h-full bg-yellow-500 rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.4)]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                      <div className="bg-surge-ink/5 rounded-3xl p-8 border border-surge-ink/5 text-center group hover:border-yellow-500/30 transition-all">
                        <span className="block text-3xl font-display font-black text-surge-ink mb-2 group-hover:text-yellow-500 transition-colors">{user?.xp || 0}</span>
                        <span className="text-[10px] text-surge-ink/30 uppercase font-black tracking-widest">Total XP</span>
                      </div>
                      <div className="bg-surge-ink/5 rounded-3xl p-8 border border-surge-ink/5 text-center group hover:border-yellow-500/30 transition-all">
                        <span className="block text-3xl font-display font-black text-surge-ink mb-2 group-hover:text-yellow-500 transition-colors">{user?.level || 1}</span>
                        <span className="text-[10px] text-surge-ink/30 uppercase font-black tracking-widest">Current Level</span>
                      </div>
                      <div className="bg-surge-ink/5 rounded-3xl p-8 border border-surge-ink/5 text-center group hover:border-yellow-500/30 transition-all">
                        <span className="block text-3xl font-display font-black text-surge-ink mb-2 group-hover:text-yellow-500 transition-colors">{user?.badges?.length || 0}</span>
                        <span className="text-[10px] text-surge-ink/30 uppercase font-black tracking-widest">Achievements</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <h4 className="text-xs font-black text-surge-ink/30 uppercase tracking-[0.3em] flex items-center gap-3 mb-8">
                          <div className="w-8 h-px bg-yellow-500/30"></div>
                          Daily Quests
                        </h4>
                        <div className="space-y-4">
                          {[
                            { name: "Study for 15 minutes", xp: 50, icon: Clock, targetDept: 'Timer' },
                            { name: "Complete a Test", xp: 100, icon: FileText, targetDept: 'Test' },
                            { name: "Solve a Quiz", xp: 40, icon: HelpCircle, targetDept: 'Quizzes' },
                            { name: "Review Flashcards", xp: 30, icon: Coffee, targetDept: 'Flashcards' }
                          ].map((quest, i) => {
                            const isDone = completedQuests.includes(quest.name);
                            return (
                              <button 
                                key={i} 
                                onClick={() => {
                                  if (!isDone) {
                                    setCompletedQuests([...completedQuests, quest.name]);
                                    addXp(quest.xp);
                                  }
                                  setSelectedDept(quest.targetDept as Department);
                                }}
                                className={cn(
                                  "w-full flex items-center justify-between p-5 rounded-2xl border transition-all cursor-pointer group",
                                  isDone ? "bg-yellow-500/10 border-yellow-500/30 opacity-75" : "bg-surge-ink/5 border-transparent hover:border-yellow-500/30"
                                )}
                              >
                                <div className="flex items-center gap-5">
                                  <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                                    isDone ? "bg-yellow-500 text-white" : "bg-yellow-500/10 text-yellow-500 group-hover:bg-yellow-500 group-hover:text-white"
                                  )}>
                                    {isDone ? <CheckCircle2 size={20} /> : <quest.icon size={20} />}
                                  </div>
                                  <div className="text-left">
                                    <p className={cn("text-sm font-bold", isDone ? "line-through text-surge-ink/50" : "text-surge-ink")}>{quest.name}</p>
                                    <p className="text-[10px] text-yellow-500 font-black uppercase tracking-widest mt-1">
                                      {isDone ? "Выполнено ✓" : `+${quest.xp} XP`}
                                    </p>
                                  </div>
                                </div>
                                <ArrowRight size={16} className="text-surge-ink/20 group-hover:text-yellow-500 transition-all group-hover:translate-x-1" />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-xs font-black text-surge-ink/30 uppercase tracking-[0.3em] flex items-center gap-3 mb-8">
                          <div className="w-8 h-px bg-yellow-500/30"></div>
                          Unlocked Badges
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(ALL_ACHIEVEMENTS).map(([id, ach]) => {
                            const isUnlocked = achievements.includes(id);
                            return (
                              <div 
                                key={id} 
                                className={cn(
                                  "p-5 rounded-3xl border transition-all flex flex-col items-center text-center gap-3",
                                  isUnlocked 
                                    ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-600" 
                                    : "bg-surge-ink/5 border-transparent text-surge-ink/10 grayscale opacity-40"
                                )}
                              >
                                <div className={cn("p-3 rounded-2xl shadow-lg", isUnlocked ? "bg-yellow-500 text-white shadow-yellow-500/20" : "bg-surge-ink/10")}>
                                  {ach.icon}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-tighter leading-tight">{ach.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : selectedDept === 'SmartVideos' ? (
                <div className="bg-surge-card rounded-[2.5rem] p-8 md:p-12 shadow-2xl mb-12 border border-red-500/20 relative overflow-hidden text-surge-ink text-left">
                  <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none text-red-500">
                    <Play size={240} />
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10 border-b border-surge-ink/10 pb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">
                          YouTube Integration
                        </span>
                      </div>
                      <h3 className="text-3xl font-display font-black text-red-500 tracking-tight mb-2">
                        Поиск видеоуроков на YouTube
                      </h3>
                      <p className="text-surge-ink/50 text-sm font-medium max-w-xl">
                        Выберите предмет или введите тему для моментального перехода на платформу YouTube.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6 relative z-10 max-w-2xl mx-auto my-8">
                    <div>
                      <label className="block text-xs font-bold text-surge-ink/40 uppercase tracking-widest mb-3 ml-1">
                        Предмет или тема видеоурока
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <select 
                          value={smartVideosData.classLevel}
                          onChange={(e) => setSmartVideosData({...smartVideosData, classLevel: e.target.value})}
                          className="w-full bg-surge-ink/5 border border-surge-ink/10 rounded-2xl px-5 py-4 text-surge-ink focus:outline-none focus:border-red-500/50 transition-all font-bold text-sm"
                        >
                          <option value="Математика ЕНТ" className="bg-surge-bg">Математика ЕНТ</option>
                          <option value="Физика ЕНТ" className="bg-surge-bg">Физика ЕНТ</option>
                          <option value="Химия ЕНТ" className="bg-surge-bg">Химия ЕНТ</option>
                          <option value="Биология ЕНТ" className="bg-surge-bg">Биология ЕНТ</option>
                          <option value="География ЕНТ" className="bg-surge-bg">География ЕНТ</option>
                          <option value="Всемирная история ЕНТ" className="bg-surge-bg">Всемирная история ЕНТ</option>
                          <option value="Основы права ЕНТ" className="bg-surge-bg">Основы права ЕНТ</option>
                          <option value="Английский язык ЕНТ" className="bg-surge-bg">Английский язык ЕНТ</option>
                          <option value="Казахский язык ЕНТ" className="bg-surge-bg">Казахский язык ЕНТ</option>
                          <option value="История Казахстана ЕНТ" className="bg-surge-bg">История Казахстана ЕНТ</option>
                          <option value="Математическая грамотность ЕНТ" className="bg-surge-bg">Математическая грамотность ЕНТ</option>
                        </select>

                        <input 
                          type="text"
                          placeholder="Укажите тему (напр. Законы Термодинамики)..."
                          value={smartVideosData.topic}
                          onChange={(e) => setSmartVideosData({...smartVideosData, topic: e.target.value})}
                          className="w-full bg-surge-ink/5 border border-surge-ink/10 rounded-2xl px-5 py-4 text-surge-ink focus:outline-none focus:border-red-500/50 transition-all font-medium text-sm"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        const searchQuery = `${smartVideosData.classLevel} ${smartVideosData.topic}`.trim() || 'Единое Национальное Тестирование ЕНТ ҰБТ';
                        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`, '_blank');
                      }}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-lg uppercase tracking-wider py-6 px-8 rounded-2xl shadow-2xl shadow-red-500/30 transition-all active:scale-95 flex items-center justify-center gap-4 group cursor-pointer"
                    >
                      <Play size={28} className="fill-white group-hover:scale-110 transition-transform" />
                      <span>Найти видеоролики в платформе YouTube</span>
                    </button>
                  </div>
                </div>
              ) : selectedDept === 'Projects' ? (
                <div className="bg-surge-card rounded-[2.5rem] p-10 shadow-2xl mb-12 border-2 border-violet-500/20 relative overflow-hidden text-left">
                  <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none text-violet-500">
                    <Layers size={200} />
                  </div>
                  <h3 className="text-3xl font-display font-black text-violet-500 mb-2 tracking-tight">{TRANSLATIONS[appLanguage].projectsHub || "Project Manager"}</h3>
                  <p className="text-surge-ink/40 mb-10 text-sm font-medium">{TRANSLATIONS[appLanguage].projectsSubtitle || "Track your academic projects, assignments, and long-term goals."}</p>
                  
                  <div className="flex flex-col md:flex-row gap-4 mb-10 relative z-10">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-2 ml-1">Project Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Science Fair Research"
                          value={newProject.name}
                          onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                          className="w-full bg-violet-500/10 border border-violet-500/20 rounded-2xl px-6 py-4 text-surge-ink focus:outline-none focus:border-violet-500/50 transition-all font-bold"
                        />
                      </div>
                      <div className="w-full md:w-48">
                        <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-2 ml-1">Deadline</label>
                        <input 
                          type="date" 
                          value={newProject.deadline}
                          onChange={(e) => setNewProject({...newProject, deadline: e.target.value})}
                          className="w-full bg-violet-500/10 border border-violet-500/20 rounded-2xl px-6 py-4 text-surge-ink focus:outline-none focus:border-violet-500/50 transition-all font-bold"
                        />
                      </div>
                    <div className="flex items-end">
                      <button 
                        onClick={async () => {
                          if (!newProject.name.trim()) {
                            showToast("Please enter a project name.", 'error');
                            return;
                          }
                          if (user) {
                            if (user.name !== 'Guest') {
                              await createProject(user.uid, newProject.name.trim(), newProject.deadline || 'No deadline');
                            } else {
                              showToast("Гости не могут создавать проекты", "info");
                            }
                            setNewProject({ name: '', deadline: '' });
                            checkAndAwardAchievement('FIRST_PROJECT');
                          }
                        }}
                        className="w-full md:w-auto bg-violet-500 hover:bg-violet-600 text-white px-8 py-4 rounded-2xl transition-all shadow-lg shadow-violet-500/20 active:scale-95 flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs"
                      >
                        <Plus size={20} />
                        Create Project
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 relative z-10">
                    {projects.length === 0 ? (
                      <div className="text-center py-20 bg-surge-ink/5 rounded-[2rem] border-2 border-dashed border-surge-ink/10">
                        <Archive className="mx-auto text-surge-ink/10 mb-4" size={48} />
                        <p className="text-surge-ink/30 font-bold uppercase tracking-widest text-xs">No active projects</p>
                      </div>
                    ) : (
                      projects.map((project) => (
                        <div 
                          key={project.id}
                          className="flex items-center justify-between p-6 bg-surge-ink/5 rounded-3xl border border-surge-ink/5 shadow-lg group hover:border-indigo-500/30 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={async () => {
                                const newStatus = project.status === 'Completed' ? 'In Progress' : 'Completed';
                                await updateProjectStatus(project.id, newStatus);
                              }}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${project.status === 'Completed' ? 'bg-emerald-500 text-white' : 'bg-surge-ink/5 text-surge-ink/20 hover:bg-violet-500/10 hover:text-violet-500'}`}
                            >
                              {project.status === 'Completed' ? <CheckCircle2 size={20} /> : <div className="w-4 h-4 rounded-full border-2 border-current" />}
                            </button>
                            <div>
                              <h4 className={`font-display font-bold text-lg transition-all ${project.status === 'Completed' ? 'text-surge-ink/30 line-through' : 'text-surge-ink'}`}>{project.name}</h4>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-surge-ink/30 flex items-center gap-1">
                                  <Calendar size={10} className="text-violet-500" />
                                  {project.deadline || 'No deadline'}
                                </span>
                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${project.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-violet-500/10 text-violet-500'}`}>
                                  {project.status}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleSendMessage(undefined, `I'm working on my project: ${project.name}. Help me with the next steps!`)}
                              className="p-3 bg-surge-ink/5 text-surge-ink/40 rounded-xl hover:bg-violet-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                              title="Ask AI for help"
                            >
                              <HelpCircle size={18} />
                            </button>
                            <button 
                              onClick={async () => {
                                await deleteProject(project.id);
                              }}
                              className="p-3 bg-surge-ink/5 text-surge-ink/40 rounded-xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                              title="Delete project"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : selectedDept === 'Timer' ? (
                <div className="bg-surge-card rounded-[2.5rem] p-10 shadow-2xl mb-12 border-2 border-red-500/20 relative overflow-hidden flex flex-col items-center">
                  <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none text-red-500">
                    <Clock size={200} />
                  </div>
                  <div className="flex gap-4 mb-8 relative z-10">
                    <button 
                      onClick={() => {
                        setTimerMode('study');
                        setTimerTimeLeft(timerSettings.study);
                        setIsTimerRunning(false);
                      }}
                      className={cn(
                        "px-6 py-2 rounded-xl font-bold transition-all",
                        timerMode === 'study' ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-surge-ink/5 text-surge-ink/40 hover:bg-surge-ink/10"
                      )}
                    >
                      Study
                    </button>
                    <button 
                      onClick={() => {
                        setTimerMode('break');
                        setTimerTimeLeft(timerSettings.break);
                        setIsTimerRunning(false);
                      }}
                      className={cn(
                        "px-6 py-2 rounded-xl font-bold transition-all",
                        timerMode === 'break' ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-surge-ink/5 text-surge-ink/40 hover:bg-surge-ink/10"
                      )}
                    >
                      Break
                    </button>
                  </div>

                  <div className="text-8xl font-display font-bold text-red-500 mb-10 tracking-tighter relative z-10">
                    {formatTimerTime(timerTimeLeft)}
                  </div>

                  <div className="flex items-center gap-6 mb-12 relative z-10">
                    <button 
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-2xl shadow-red-500/40 hover:scale-110 transition-all active:scale-95"
                    >
                      {isTimerRunning ? <Pause size={32} className="text-white" /> : <Play size={32} className="text-white ml-1" />}
                    </button>
                    <button 
                      onClick={() => {
                        setIsTimerRunning(false);
                        setTimerTimeLeft(timerSettings[timerMode]);
                      }}
                      className="w-14 h-14 rounded-full bg-surge-ink/5 flex items-center justify-center text-surge-ink/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                    >
                      <RotateCcw size={24} />
                    </button>
                  </div>

                  <div className="w-full max-w-md space-y-8 text-left relative z-10">
                    <h4 className="text-xs font-bold text-surge-ink/40 uppercase tracking-widest ml-2">Settings</h4>
                    
                    <div className="space-y-6">
                      <div className="bg-surge-ink/5 p-5 rounded-2xl border border-surge-ink/10">
                        <label className="block text-[10px] font-bold text-surge-ink/30 uppercase mb-3 ml-2">Study Duration</label>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <input 
                              type="number"
                              placeholder="H"
                              value={Math.floor(timerSettings.study / 3600)}
                              onChange={(e) => {
                                const h = parseInt(e.target.value) || 0;
                                const m = Math.floor((timerSettings.study % 3600) / 60);
                                const s = timerSettings.study % 60;
                                const total = (h * 3600) + (m * 60) + s;
                                setTimerSettings({...timerSettings, study: total});
                                if (timerMode === 'study') setTimerTimeLeft(total);
                              }}
                              className="w-full bg-transparent border-none px-3 py-2 text-surge-ink text-center font-bold text-lg focus:outline-none focus:ring-0"
                            />
                            <span className="block text-[8px] text-center text-surge-ink/30 uppercase font-bold">Hours</span>
                          </div>
                          <div className="space-y-1">
                            <input 
                              type="number"
                              placeholder="M"
                              value={Math.floor((timerSettings.study % 3600) / 60)}
                              onChange={(e) => {
                                const h = Math.floor(timerSettings.study / 3600);
                                const m = parseInt(e.target.value) || 0;
                                const s = timerSettings.study % 60;
                                const total = (h * 3600) + (m * 60) + s;
                                setTimerSettings({...timerSettings, study: total});
                                if (timerMode === 'study') setTimerTimeLeft(total);
                              }}
                              className="w-full bg-transparent border-none px-3 py-2 text-surge-ink text-center font-bold text-lg focus:outline-none focus:ring-0"
                            />
                            <span className="block text-[8px] text-center text-surge-ink/30 uppercase font-bold">Minutes</span>
                          </div>
                          <div className="space-y-1">
                            <input 
                              type="number"
                              placeholder="S"
                              value={timerSettings.study % 60}
                              onChange={(e) => {
                                const h = Math.floor(timerSettings.study / 3600);
                                const m = Math.floor((timerSettings.study % 3600) / 60);
                                const s = parseInt(e.target.value) || 0;
                                const total = (h * 3600) + (m * 60) + s;
                                setTimerSettings({...timerSettings, study: total});
                                if (timerMode === 'study') setTimerTimeLeft(total);
                              }}
                              className="w-full bg-transparent border-none px-3 py-2 text-surge-ink text-center font-bold text-lg focus:outline-none focus:ring-0"
                            />
                            <span className="block text-[8px] text-center text-surge-ink/30 uppercase font-bold">Seconds</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-surge-ink/5 p-5 rounded-2xl border border-surge-ink/10">
                        <label className="block text-[10px] font-bold text-surge-ink/30 uppercase mb-3 ml-2">Break Duration</label>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <input 
                              type="number"
                              placeholder="H"
                              value={Math.floor(timerSettings.break / 3600)}
                              onChange={(e) => {
                                const h = parseInt(e.target.value) || 0;
                                const m = Math.floor((timerSettings.break % 3600) / 60);
                                const s = timerSettings.break % 60;
                                const total = (h * 3600) + (m * 60) + s;
                                setTimerSettings({...timerSettings, break: total});
                                if (timerMode === 'break') setTimerTimeLeft(total);
                              }}
                              className="w-full bg-transparent border-none px-3 py-2 text-surge-ink text-center font-bold text-lg focus:outline-none focus:ring-0"
                            />
                            <span className="block text-[8px] text-center text-surge-ink/30 uppercase font-bold">Hours</span>
                          </div>
                          <div className="space-y-1">
                            <input 
                              type="number"
                              placeholder="M"
                              value={Math.floor((timerSettings.break % 3600) / 60)}
                              onChange={(e) => {
                                const h = Math.floor(timerSettings.break / 3600);
                                const m = parseInt(e.target.value) || 0;
                                const s = timerSettings.break % 60;
                                const total = (h * 3600) + (m * 60) + s;
                                setTimerSettings({...timerSettings, break: total});
                                if (timerMode === 'break') setTimerTimeLeft(total);
                              }}
                              className="w-full bg-transparent border-none px-3 py-2 text-surge-ink text-center font-bold text-lg focus:outline-none focus:ring-0"
                            />
                            <span className="block text-[8px] text-center text-surge-ink/30 uppercase font-bold">Minutes</span>
                          </div>
                          <div className="space-y-1">
                            <input 
                              type="number"
                              placeholder="S"
                              value={timerSettings.break % 60}
                              onChange={(e) => {
                                const h = Math.floor(timerSettings.break / 3600);
                                const m = Math.floor((timerSettings.break % 3600) / 60);
                                const s = parseInt(e.target.value) || 0;
                                const total = (h * 3600) + (m * 60) + s;
                                setTimerSettings({...timerSettings, break: total});
                                if (timerMode === 'break') setTimerTimeLeft(total);
                              }}
                              className="w-full bg-transparent border-none px-3 py-2 text-surge-ink text-center font-bold text-lg focus:outline-none focus:ring-0"
                            />
                            <span className="block text-[8px] text-center text-surge-ink/30 uppercase font-bold">Seconds</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-surge-ink/50 mb-12 text-lg max-w-lg mx-auto leading-relaxed font-medium">
                    {TRANSLATIONS[appLanguage].welcomeSubtitle}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button 
                      onClick={() => createNewSession('chat', selectedDept)}
                      className="group relative flex flex-col items-center gap-4 p-8 glass-panel rounded-3xl hover:border-surge-purple transition-all hover-glass-card"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-surge-purple/10 flex items-center justify-center text-surge-purple group-hover:scale-110 group-hover:bg-surge-purple group-hover:text-white transition-all duration-300">
                        <MessageSquare size={28} />
                      </div>
                      <div className="text-center">
                        <span className="block text-lg font-bold text-surge-ink mb-1 group-hover:glow-text transition-all">{TRANSLATIONS[appLanguage].quickChat}</span>
                        <span className="text-xs text-surge-ink/40">{TRANSLATIONS[appLanguage].askSpyris}</span>
                      </div>
                    </button>
                    <button 
                      onClick={() => {
                        createNewSession('conspect', selectedDept);
                      }}
                      className="group relative flex flex-col items-center gap-4 p-8 glass-panel rounded-3xl hover:border-white transition-all hover-glass-card"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-surge-ink/10 flex items-center justify-center text-surge-ink group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all duration-300">
                        <ImageIcon size={28} />
                      </div>
                      <div className="text-center">
                        <span className="block text-lg font-bold text-surge-ink mb-1">{TRANSLATIONS[appLanguage].newConspect}</span>
                        <span className="text-xs text-surge-ink/40">{TRANSLATIONS[appLanguage].uploadPhotoNotes}</span>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        ) : (
          <>
            {/* Header */}
            <header className="h-20 border-b border-surge-border bg-surge-bg/80 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-20">
              <div className="flex items-center gap-4 min-w-0">
                <div className={cn(
                  "p-3 rounded-2xl shadow-inner",
                  DEPARTMENTS.find(d => d.id === currentSession?.department)?.color || 'bg-surge-purple'
                )}>
                  {currentSession?.type === 'conspect' ? <FileText size={20} className="text-surge-ink" /> : <Aperture size={20} className="text-surge-ink" />}
                </div>
                <div className="min-w-0">
                  <h2 className="font-display font-bold text-surge-ink truncate text-lg">{currentSession?.title}</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-surge-purple">
                    {currentSession?.department} Department
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => archiveSession(currentSessionId)}
                  className={cn(
                    "p-2.5 rounded-xl transition-all border",
                    currentSession?.isArchived 
                      ? "bg-surge-purple/20 border-surge-purple text-surge-purple" 
                      : "bg-surge-card border-surge-border text-surge-ink/40 hover:text-surge-ink hover:border-surge-ink/20"
                  )}
                >
                  <Archive size={20} />
                </button>
                <button 
                  onClick={() => deleteSession(currentSessionId)}
                  className="p-2.5 bg-surge-card border border-surge-border text-surge-ink/40 hover:text-red-500 hover:border-red-500/30 rounded-xl transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </header>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar"
            >
              {currentSession?.type === 'flashcards' ? (
                <div className="max-w-5xl mx-auto">
                  {currentSession.messages.filter(m => m.flashcards).map((message, idx) => {
                    const messageIndex = currentSession.messages.findIndex(m => m.id === message.id);
                    const userMessage = messageIndex > 0 ? currentSession.messages[messageIndex - 1] : null;
                    const topic = userMessage?.content?.replace(/Generate \d+ flashcards about /i, '') || 'Flashcards';
                    return (
                      <div key={`${message.id || 'flash'}_${idx}`} className="mb-12">
                        <h3 className="text-2xl font-bold text-surge-ink mb-6 text-center capitalize">{topic}</h3>
                        <FlashcardViewer flashcards={message.flashcards!} />
                      </div>
                    );
                  })}
                  {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20 text-surge-ink/50">
                      <Loader2 size={48} className="animate-spin mb-4 text-surge-purple" />
                      <p className="font-medium animate-pulse">Generating your flashcards...</p>
                    </div>
                  )}
                </div>
              ) : currentSession?.type === 'quiz' ? (
                <div className="max-w-5xl mx-auto">
                  {currentSession.messages.filter(m => m.quiz).map((message, idx) => {
                    const messageIndex = currentSession.messages.findIndex(m => m.id === message.id);
                    const userMessage = messageIndex > 0 ? currentSession.messages[messageIndex - 1] : null;
                    const topic = userMessage?.content?.replace(/Generate a \d+ question quiz about /i, '') || 'Quiz';
                    return (
                      <div key={`${message.id || 'quiz'}_${idx}`} className="mb-12">
                        <h3 className="text-2xl font-bold text-surge-ink mb-6 text-center capitalize">{topic}</h3>
                        <QuizViewer 
                          quiz={message.quiz!} 
                          onComplete={() => {
                            if (user && user.name !== 'Guest') {
                              import('./firebase').then(({ updateTestsCompleted }) => {
                                updateTestsCompleted(user.uid);
                              });
                            }
                          }}
                        />
                      </div>
                    );
                  })}
                  {isLoading && <GeminiThinking />}
                </div>
              ) : (
                <>
                  {currentSession?.messages.map((message, idx) => (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      key={`${message.id || 'msg'}_${idx}`}
                      className={cn(
                        "flex gap-6 max-w-5xl mx-auto",
                        message.role === 'user' ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center font-bold text-sm shadow-lg",
                        message.role === 'user' ? "bg-surge-purple/40 text-white" : "bg-surge-purple text-white"
                      )}>
                        {message.role === 'user' ? (user?.name?.slice(0, 2).toUpperCase() || 'U') : <Aperture size={18} />}
                      </div>
                      <div className={cn(
                        "flex flex-col gap-2 max-w-[80%]",
                        message.role === 'user' ? "items-end" : "items-start"
                      )}>
                        <div className={cn(
                          "px-6 py-4 rounded-3xl text-[15px] leading-relaxed shadow-2xl",
                          message.role === 'user' 
                            ? "bg-surge-purple text-white rounded-tr-none" 
                            : "bg-surge-card border border-surge-border text-surge-ink/90 rounded-tl-none"
                        )}>
                          {message.image && (
                            <img 
                              src={`data:image/jpeg;base64,${message.image}`} 
                              alt="Attached" 
                              className="max-w-xs rounded-xl mb-4 cursor-pointer hover:opacity-90 transition-opacity" 
                              onClick={() => setPreviewFile({ name: 'Attached Image', data: `data:image/jpeg;base64,${message.image}`, type: 'image/jpeg' })}
                            />
                          )}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {message.attachments.map((imgData, idx) => (
                                <img 
                                  key={idx} 
                                  src={`data:image/jpeg;base64,${imgData}`} 
                                  alt={`Attached ${idx + 1}`} 
                                  className="max-w-[150px] rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity" 
                                  onClick={() => setPreviewFile({ name: `Attached Image ${idx + 1}`, data: `data:image/jpeg;base64,${imgData}`, type: 'image/jpeg' })}
                                />
                              ))}
                            </div>
                          )}
                          {message.role === 'model' ? (
                            <div className="markdown-body">
                              {message.content && (
                          <div className="overflow-x-auto">
                            <Markdown 
                              remarkPlugins={[remarkMath, remarkGfm]} 
                              rehypePlugins={[rehypeKatex]}
                              components={{
                                a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-surge-purple hover:underline" />
                              }}
                            >
                              {message.content}
                            </Markdown>
                          </div>
                              )}
                              {message.groundingChunks && message.groundingChunks.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-surge-ink/10">
                                  <h4 className="text-xs font-bold text-surge-ink/50 uppercase tracking-widest mb-2">Sources</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {message.groundingChunks.map((chunk, idx) => {
                                      if (chunk.web?.uri) {
                                        return (
                                          <a 
                                            key={idx} 
                                            href={chunk.web.uri} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-surge-ink/5 hover:bg-surge-ink/10 rounded-lg text-xs font-medium text-surge-ink/70 transition-colors"
                                          >
                                            <span className="truncate max-w-[200px]">{chunk.web.title || new URL(chunk.web.uri).hostname}</span>
                                          </a>
                                        );
                                      }
                                      return null;
                                    })}
                                  </div>
                                </div>
                              )}
                              {message.flashcards && <FlashcardViewer flashcards={message.flashcards} />}
                              {message.quiz && <QuizViewer quiz={message.quiz} />}
                              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-surge-ink/5">
                                <button 
                                  onClick={() => playMessage(message.content)}
                                  className="p-2 bg-surge-ink/5 hover:bg-surge-purple/10 text-surge-ink/40 hover:text-surge-purple rounded-lg transition-all"
                                  title={TRANSLATIONS[appLanguage].playAudioTooltip}
                                >
                                  <Volume2 size={14} />
                                </button>
                                <button 
                                  className="p-2 bg-surge-ink/5 hover:bg-surge-purple/10 text-surge-ink/40 hover:text-surge-purple rounded-lg transition-all"
                                  title={TRANSLATIONS[appLanguage].copyTextTooltip}
                                  onClick={() => copyToClipboard(message.content)}
                                >
                                  <Copy size={14} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="markdown-body user-markdown">
                              {message.content && (
                          <div className="overflow-x-auto">
                            <Markdown 
                              remarkPlugins={[remarkMath, remarkGfm]} 
                              rehypePlugins={[rehypeKatex]}
                              components={{
                                a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="underline" />
                              }}
                            >
                              {message.content}
                            </Markdown>
                          </div>
                              )}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-surge-ink/20 px-2 uppercase tracking-tighter">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                  
                  {isLoading && <GeminiThinking />}
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="p-8 bg-surge-bg border-t border-surge-border">
              <form 
                onSubmit={handleSendMessage}
                className="max-w-5xl mx-auto relative"
              >
                {attachedImages.length > 0 && (
                  <div className="absolute bottom-full left-0 mb-4 p-3 glass-panel rounded-2xl inline-flex gap-3 max-w-full overflow-x-auto shadow-2xl border border-surge-purple/20">
                    {attachedImages.map((img, idx) => (
                      <div key={idx} className="relative flex-shrink-0 group">
                        <img 
                          src={img.url} 
                          alt={`Attached ${idx + 1}`} 
                          className="h-24 w-24 object-cover rounded-xl border-2 border-surge-purple/30 group-hover:border-surge-purple transition-all cursor-pointer" 
                          onClick={() => setPreviewFile({ name: img.name, data: img.url, type: img.mimeType })}
                        />
                        <button 
                          type="button"
                          onClick={() => removeAttachedImage(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg z-10"
                        >
                          <X size={14} />
                        </button>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                           <span className="text-[10px] text-white font-bold uppercase tracking-wider">Preview</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {uploadedFiles.length > 0 && (
                  <div className="absolute bottom-full left-0 mb-4 p-3 glass-panel rounded-2xl flex flex-wrap gap-3 max-w-full shadow-2xl border border-emerald-500/20">
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="relative flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl group cursor-pointer hover:bg-emerald-500/20 transition-all" onClick={() => setPreviewFile(file)}>
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                          <FileText size={18} className="text-emerald-500" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-emerald-700 truncate max-w-[120px]">{file.name}</span>
                          <span className="text-[10px] text-emerald-600/70 uppercase font-bold">{file.type.split('/')[1] || 'file'}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="ml-2 text-emerald-500 hover:text-red-500 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {attachedLinks.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {attachedLinks.map((link, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-surge-purple/10 border border-surge-purple/20 text-surge-purple px-3 py-1.5 rounded-xl text-xs font-bold">
                        <Link size={12} />
                        <span className="max-w-[150px] truncate">{link}</span>
                        <button 
                          onClick={() => setAttachedLinks(prev => prev.filter((_, i) => i !== idx))}
                          className="hover:text-white transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-end gap-3 bg-surge-card border border-surge-border rounded-[2rem] p-3 focus-within:ring-4 focus-within:ring-surge-purple/10 focus-within:border-surge-purple transition-all shadow-2xl">
                  <div className="relative pl-2 pb-2 flex items-end">
                    <button
                      type="button"
                      onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                      className="p-3 bg-surge-bg hover:bg-surge-purple/10 rounded-full text-white/50 hover:text-surge-purple transition-all group"
                      title={TRANSLATIONS[appLanguage].addAttachmentTooltip}
                    >
                      <Plus size={24} className={cn("transition-transform", isPlusMenuOpen && "rotate-45")} />
                    </button>

                    <AnimatePresence>
                      {isPlusMenuOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute bottom-full left-0 mb-4 w-72 bg-surge-card border border-surge-border rounded-3xl shadow-2xl overflow-hidden z-50 flex flex-col py-3"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setIsCameraOpen(true);
                              setIsPlusMenuOpen(false);
                            }}
                            className="flex items-center gap-4 px-5 py-3 hover:bg-surge-ink/5 text-left transition-colors group"
                          >
                            <div className="p-2 bg-surge-ink/5 rounded-xl group-hover:bg-surge-ink/10 transition-colors">
                              <Camera size={18} className="text-surge-ink/60" />
                            </div>
                            <span className="text-sm font-bold text-surge-ink">{TRANSLATIONS[appLanguage].takePhoto}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              fileInputRef.current?.click();
                              setIsPlusMenuOpen(false);
                            }}
                            className="flex items-center gap-4 px-5 py-3 hover:bg-surge-ink/5 text-left transition-colors group"
                          >
                            <div className="p-2 bg-surge-ink/5 rounded-xl group-hover:bg-surge-ink/10 transition-colors">
                              <Paperclip size={18} className="text-surge-ink/60" />
                            </div>
                            <span className="text-sm font-bold text-surge-ink">{TRANSLATIONS[appLanguage].addFiles}</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => {
                              setIsLinkModalOpen(true);
                              setIsPlusMenuOpen(false);
                            }}
                            className="flex items-center gap-4 px-5 py-3 hover:bg-surge-ink/5 text-left transition-colors group"
                          >
                            <div className="p-2 bg-surge-ink/5 rounded-xl group-hover:bg-surge-ink/10 transition-colors">
                              <Link size={18} className="text-surge-ink/60" />
                            </div>
                            <span className="text-sm font-bold text-surge-ink">{TRANSLATIONS[appLanguage].addLink}</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => {
                              setIsThinkingMode(!isThinkingMode);
                              setIsPlusMenuOpen(false);
                            }}
                            className="flex items-center gap-4 px-5 py-3 hover:bg-surge-ink/5 text-left transition-colors group"
                          >
                            <div className={cn("p-2 rounded-xl transition-colors", isThinkingMode ? "bg-surge-purple/20" : "bg-surge-ink/5 group-hover:bg-surge-ink/10")}>
                              <Brain size={18} className={isThinkingMode ? "text-surge-purple" : "text-surge-ink/60"} />
                            </div>
                            <span className="text-sm font-bold text-surge-ink">{TRANSLATIONS[appLanguage].thinking}</span>
                            {isThinkingMode && <CheckCircle2 size={16} className="ml-auto text-surge-purple" />}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <div className="w-full flex items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleVoiceTyping}
                        className={cn(
                          "p-2 rounded-xl transition-all flex-shrink-0 flex items-center justify-center",
                          isVoiceTyping 
                            ? "bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse" 
                            : "bg-surge-ink/5 text-surge-ink/40 hover:bg-surge-ink/10 hover:text-surge-ink"
                        )}
                        title={TRANSLATIONS[appLanguage].voiceInputTooltip}
                      >
                        <Mic size={20} />
                      </button>
                      <textarea 
                        rows={1}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder={isVoiceTyping ? TRANSLATIONS[appLanguage].speak : uploadedFiles.length > 0 ? TRANSLATIONS[appLanguage].askAboutFiles.replace('{count}', uploadedFiles.length.toString()) : 
                                     currentSession?.department === 'Marks' ? TRANSLATIONS[appLanguage].enterMarks : 
                                     currentSession?.department === 'Flashcards' ? TRANSLATIONS[appLanguage].enterFlashcardTopic :
                                     currentSession?.department === 'Quizzes' ? TRANSLATIONS[appLanguage].enterQuizTopic :
                                     TRANSLATIONS[appLanguage].messageSpyris}
                        className="w-full bg-transparent border-none focus:ring-0 py-4 text-base resize-none max-h-60 text-surge-ink placeholder:text-surge-ink/20 font-medium"
                      />
                    </div>
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={(!input.trim() && attachedImages.length === 0 && uploadedFiles.length === 0) || isLoading}
                    className={cn(
                      "p-4 rounded-2xl transition-all shadow-xl",
                      (input.trim() || attachedImages.length > 0 || uploadedFiles.length > 0) && !isLoading 
                        ? "bg-surge-purple text-white shadow-surge-purple/30 hover:scale-105 active:scale-95" 
                        : "bg-surge-border text-surge-ink/10 cursor-not-allowed"
                    )}
                  >
                    <Send size={24} />
                  </button>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-surge-ink/20">
                    Spyris v2.5 <span className="text-surge-purple">Turbo</span>
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-surge-ink/20">
                    Secure <span className="text-surge-purple">Archive</span>
                  </p>
                </div>
              </form>
            </div>
          </>
        )}
      </main>

      <AnimatePresence>
        {showSubscription && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md glass-panel rounded-[2.5rem] p-10 shadow-2xl relative"
            >
              <button 
                onClick={() => {
                  setShowSubscription(false);
                  setPaymentStep('plan');
                }}
                className="absolute top-6 right-6 p-2 hover:bg-surge-ink/5 rounded-full text-surge-ink/40 transition-colors"
              >
                <X size={20} />
              </button>
              
              {paymentStep === 'plan' ? (
                <>
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-black border border-surge-ink/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-surge-purple/20 icon-glow-container">
                      <Aperture className="lightning-effect" size={32} />
                    </div>
                    <h2 className="text-3xl font-display font-bold text-surge-ink mb-2">Choose Your Plan</h2>
                    <p className="text-surge-ink/40 text-sm">Unlock the full power of SpyrisLearn</p>
                  </div>

                  <div className="space-y-4 mb-10 max-h-[400px] overflow-y-auto pr-2">
                    {/* Basic Plan */}
                    <div className="p-5 rounded-2xl border border-surge-ink/10 bg-surge-ink/5 relative">
                      <h3 className="text-xl font-bold text-surge-ink mb-1">Basic</h3>
                      <p className="text-surge-ink/40 text-sm mb-4">Free forever</p>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-3 text-surge-ink/80 text-sm">
                          <CheckCircle2 size={16} className="text-surge-ink/40" />
                          <span>Basic AI Chat</span>
                        </div>
                        <div className="flex items-center gap-3 text-surge-ink/80 text-sm">
                          <CheckCircle2 size={16} className="text-surge-ink/40" />
                          <span>Limited Conspects (3/day)</span>
                        </div>
                        <div className="flex items-center gap-3 text-surge-ink/80 text-sm">
                          <CheckCircle2 size={16} className="text-surge-ink/40" />
                          <span>Standard Study Timer</span>
                        </div>
                      </div>
                      <button className="w-full bg-surge-ink/10 text-surge-ink/40 font-bold py-3 rounded-xl cursor-not-allowed">
                        Current Plan
                      </button>
                    </div>

                    {/* Pro Plan */}
                    <div className="p-5 rounded-2xl border-2 border-surge-purple bg-surge-purple/5 relative">
                      <div className="absolute -top-3 right-4 bg-surge-purple text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                        Popular
                      </div>
                      <h3 className="text-xl font-bold text-surge-ink mb-1">Pro</h3>
                      <p className="text-surge-ink/40 text-sm mb-4">$4.99 / month</p>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-3 text-surge-ink/80 text-sm">
                          <CheckCircle2 size={16} className="text-surge-purple" />
                          <span>Unlimited AI Chat & Conspects</span>
                        </div>
                        <div className="flex items-center gap-3 text-surge-ink/80 text-sm">
                          <CheckCircle2 size={16} className="text-surge-purple" />
                          <span>Priority Marks Analysis</span>
                        </div>
                        <div className="flex items-center gap-3 text-surge-ink/80 text-sm">
                          <CheckCircle2 size={16} className="text-surge-purple" />
                          <span>Unlimited Flashcards & Quizzes</span>
                        </div>
                        <div className="flex items-center gap-3 text-surge-ink/80 text-sm">
                          <CheckCircle2 size={16} className="text-surge-purple" />
                          <span>Cloud Sync Across Devices</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => { setSelectedPlan('Pro'); setPaymentStep('checkout'); }}
                        className="w-full bg-surge-purple hover:bg-surge-purple-dark text-white font-bold py-3 rounded-xl shadow-lg shadow-surge-purple/20 transition-all active:scale-95"
                      >
                        Upgrade to Pro
                      </button>
                    </div>

                    {/* Plus Plan */}
                    <div className="p-5 rounded-2xl border border-amber-500/50 bg-amber-500/5 relative">
                      <h3 className="text-xl font-bold text-surge-ink mb-1">Plus</h3>
                      <p className="text-surge-ink/40 text-sm mb-4">$19.99 / month</p>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-3 text-surge-ink/80 text-sm">
                          <CheckCircle2 size={16} className="text-amber-500" />
                          <span>Everything in Pro</span>
                        </div>
                        <div className="flex items-center gap-3 text-surge-ink/80 text-sm">
                          <CheckCircle2 size={16} className="text-amber-500" />
                          <span>1-on-1 AI Voice Tutoring</span>
                        </div>
                        <div className="flex items-center gap-3 text-surge-ink/80 text-sm">
                          <CheckCircle2 size={16} className="text-amber-500" />
                          <span>Personalized Study Plans</span>
                        </div>
                        <div className="flex items-center gap-3 text-surge-ink/80 text-sm">
                          <CheckCircle2 size={16} className="text-amber-500" />
                          <span>Early Access to New Features</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => { setSelectedPlan('Plus'); setPaymentStep('checkout'); }}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                      >
                        Upgrade to Plus
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-display font-bold text-surge-ink mb-2">Secure Checkout</h2>
                    <p className="text-surge-ink/40 text-sm">Enter payment details for {selectedPlan} plan</p>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div>
                      <label className="block text-xs font-bold text-surge-ink/40 uppercase tracking-widest mb-2 ml-1">Cardholder Name</label>
                      <input 
                        type="text"
                        value={paymentForm.cardName}
                        onChange={(e) => setPaymentForm({...paymentForm, cardName: e.target.value})}
                        className="w-full bg-surge-ink/5 border border-surge-ink/10 rounded-2xl px-5 py-4 text-surge-ink focus:outline-none focus:ring-2 focus:ring-surge-purple/30 transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-surge-ink/40 uppercase tracking-widest mb-2 ml-1">Card Number</label>
                      <input 
                        type="text"
                        value={paymentForm.cardNumber}
                        onChange={(e) => setPaymentForm({...paymentForm, cardNumber: e.target.value})}
                        className="w-full bg-surge-ink/5 border border-surge-ink/10 rounded-2xl px-5 py-4 text-surge-ink focus:outline-none focus:ring-2 focus:ring-surge-purple/30 transition-all"
                        placeholder="0000 0000 0000 0000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-surge-ink/40 uppercase tracking-widest mb-2 ml-1">CVV (3 digits)</label>
                      <input 
                        type="text"
                        maxLength={3}
                        value={paymentForm.cvv}
                        onChange={(e) => setPaymentForm({...paymentForm, cvv: e.target.value})}
                        className="w-16 bg-surge-ink/5 border border-surge-ink/10 rounded-2xl px-3 py-4 text-surge-ink text-center focus:outline-none focus:ring-2 focus:ring-surge-purple/30 transition-all"
                        placeholder="123"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      if (!paymentForm.cardName || !paymentForm.cardNumber || !paymentForm.cvv) {
                        showToast("Please fill in all payment details.", 'error');
                        return;
                      }
                      showToast(`Subscription successful! You are now a ${selectedPlan} Student.`, 'success');
                      setShowSubscription(false);
                      setPaymentStep('plan');
                      setPaymentForm({ cardNumber: '', cardName: '', cvv: '' });
                    }}
                    className="w-full bg-surge-purple hover:bg-surge-purple-dark text-white font-bold py-4 rounded-2xl shadow-xl shadow-surge-purple/20 transition-all active:scale-95 mb-4"
                  >
                    Complete Payment
                  </button>
                  <button 
                    onClick={() => setPaymentStep('plan')}
                    className="w-full text-surge-ink/40 text-sm font-bold hover:text-surge-ink transition-colors"
                  >
                    Back to Plans
                  </button>
                </>
              )}
              
              <p className="text-[10px] text-center text-surge-ink/20 uppercase tracking-widest font-bold mt-4">
                Cancel anytime • Secure payment
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTimerRunning && selectedDept !== 'Timer' && isFloatingTimerVisible && (
          <motion.div
            drag
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-24 right-6 z-[60] bg-surge-card border border-surge-purple/30 p-4 rounded-2xl shadow-2xl flex flex-col items-center gap-2 cursor-move min-w-[120px]"
          >
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsFloatingTimerVisible(false);
              }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-surge-ink text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all z-10"
            >
              <X size={14} />
            </button>
            <div className="flex items-center gap-2 text-surge-purple pointer-events-none">
              <TimerIcon size={16} className={isTimerRunning ? "animate-pulse" : ""} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{timerMode}</span>
            </div>
            <div className="text-2xl font-display font-bold text-surge-ink pointer-events-none">
              {formatTimerTime(timerTimeLeft)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLinkModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-surge-ink/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-surge-card border border-surge-border rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setIsLinkModalOpen(false)}
                className="absolute top-6 right-6 text-surge-ink/40 hover:text-surge-ink transition-colors"
              >
                <X size={24} />
              </button>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-surge-purple/10 flex items-center justify-center text-surge-purple">
                  <Link size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold text-surge-ink">Attach Link</h3>
                  <p className="text-surge-ink/50 text-sm">Website, YouTube, or Presentation URL</p>
                </div>
              </div>

              <input 
                type="url"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="https://..."
                className="w-full bg-surge-bg border border-surge-border rounded-xl px-4 py-3 text-surge-ink focus:outline-none focus:border-surge-purple/50 transition-all mb-6"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && linkInput) {
                    setAttachedLinks(prev => [...prev, linkInput]);
                    setLinkInput('');
                    setIsLinkModalOpen(false);
                  }
                }}
              />

              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-6 py-3 rounded-xl font-bold text-surge-ink/60 hover:bg-surge-ink/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (linkInput) {
                      setAttachedLinks(prev => [...prev, linkInput]);
                      setLinkInput('');
                      setIsLinkModalOpen(false);
                    }
                  }}
                  disabled={!linkInput}
                  className="px-6 py-3 rounded-xl font-bold bg-surge-purple text-white hover:bg-surge-purple-dark transition-colors disabled:opacity-50"
                >
                  Attach
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewFile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12 bg-black/95 backdrop-blur-md"
            onClick={() => setPreviewFile(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-7xl w-full max-h-full flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setPreviewFile(null)}
                className="absolute -top-12 right-0 p-3 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
              >
                <X size={24} />
              </button>
              
              <div className="w-full bg-surge-card rounded-3xl overflow-hidden shadow-2xl border border-surge-border flex flex-col max-h-[85vh]">
                <div className="p-4 border-b border-surge-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-surge-purple/10 rounded-lg text-surge-purple">
                      {previewFile.type.startsWith('image/') ? <ImageIcon size={18} /> : <FileText size={18} />}
                    </div>
                    <span className="font-bold text-surge-ink truncate max-w-xs md:max-w-xl">{previewFile.name}</span>
                  </div>
                  <a 
                    href={previewFile.data} 
                    download={previewFile.name}
                    className="p-2 bg-surge-purple text-white rounded-lg hover:bg-surge-purple-dark transition-all flex items-center gap-2 text-xs font-bold"
                  >
                    <Download size={14} />
                    <span className="hidden sm:inline">Download</span>
                  </a>
                </div>
                
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-surge-bg/50">
                  {previewFile.type.startsWith('image/') ? (
                    <img 
                      src={previewFile.data} 
                      alt={previewFile.name} 
                      className="max-w-full max-h-full object-contain rounded-xl shadow-lg" 
                    />
                  ) : previewFile.type === 'application/pdf' ? (
                    <iframe 
                      src={previewFile.data} 
                      className="w-full h-full min-h-[60vh] rounded-xl"
                      title={previewFile.name}
                    />
                  ) : previewFile.type.includes('text') || previewFile.type.includes('markdown') ? (
                    <div className="w-full h-full p-8 bg-surge-card text-surge-ink font-mono text-sm whitespace-pre-wrap">
                      {previewFile.data.startsWith('data:') ? 'Binary data cannot be displayed as text.' : previewFile.data}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 py-20">
                      <div className="w-20 h-20 bg-surge-ink/5 rounded-3xl flex items-center justify-center text-surge-ink/20">
                        <FileText size={40} />
                      </div>
                      <p className="text-surge-ink/40 font-medium">Preview not available for this file type.</p>
                      <a href={previewFile.data} download={previewFile.name} className="text-surge-purple font-bold hover:underline">Download to view</a>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}

