import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { User } from './types';
import firebaseConfig from '../firebase-applet-config.json';

import { initializeFirestore, getDocFromServer, terminate } from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email || undefined,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId || undefined,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
  return errInfo;
}

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);

// Initialize Firestore with long polling to avoid WebSocket issues in sandboxed environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  ignoreUndefinedProperties: true,
}, firebaseConfig.firestoreDatabaseId);

// Connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, '_test_', 'connection'));
    console.log("Firestore connection successful");
  } catch (error: any) {
    if (error.message?.includes('the client is offline')) {
      console.error("Firestore is offline. Check your configuration or internet connection.");
    }
  }
}
testConnection();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Auth Helpers
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Login failed:", error);
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/cancelled-popup-request' || error?.code === 'auth/popup-closed-by-user') {
      throw new Error("Всплывающее окно входа через Google было заблокировано браузером или отменено. Пожалуйста, используйте вход по Email и Паролю.");
    }
    throw error;
  }
};

export const loginAnonymously = async () => {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error("Anonymous login failed:", error);
    throw error;
  }
};

export const logout = () => signOut(auth);

// Firestore Helpers
export const getUserProfile = async (uid: string) => {
  const docRef = doc(db, 'users', uid);
  try {
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }
};

export const createUserProfile = async (user: FirebaseUser, role: 'student' | 'teacher' = 'student') => {
  const docRef = doc(db, 'users', user.uid);
  const profile: User = {
    uid: user.uid,
    name: user.displayName || (role === 'teacher' ? 'Преподаватель ЕНТ' : 'Ученик ЕНТ'),
    email: user.email || '',
    photoURL: user.photoURL || undefined,
    role,
    level: 1,
    xp: 0,
    rank: role === 'teacher' ? 'Наставник ЕНТ' : 'Кандидат на Грант',
    badges: ['ENT_PIONEER'],
    testsCompleted: 0,
    targetEntScore: 125,
    currentEntScore: 85,
    classIds: [],
    teacherSubject: role === 'teacher' ? 'Физика и Математика' : undefined
  };
  try {
    await setDoc(docRef, { ...profile, createdAt: new Date().toISOString() }, { merge: true });
    return profile;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
  }
};

export const updateUserProfile = async (uid: string, updates: Partial<User>) => {
  const docRef = doc(db, 'users', uid);
  try {
    await setDoc(docRef, updates, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
};

export const updateTestsCompleted = async (uid: string) => {
  const docRef = doc(db, 'users', uid);
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      await updateDoc(docRef, { 
        testsCompleted: (data.testsCompleted || 0) + 1 
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
};

export const updateXP = async (uid: string, xpToAdd: number) => {
  const docRef = doc(db, 'users', uid);
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      const newXP = (data.xp || 0) + xpToAdd;
      const newLevel = Math.floor(newXP / 1000) + 1;
      
      const ranks = [
        'Novice Scholar',
        'Apprentice Researcher',
        'Dedicated Student',
        'Academic Explorer',
        'Knowledge Seeker',
        'Insightful Analyst',
        'Master Learner',
        'Distinguished Scholar',
        'Academic Luminary',
        'Grand Sage'
      ];
      const newRank = ranks[Math.min(newLevel - 1, ranks.length - 1)];

      await updateDoc(docRef, { 
        xp: newXP, 
        level: newLevel,
        rank: newRank
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
};

// Marks Helpers
export const createProject = async (uid: string, title: string, deadline: string) => {
  const docRef = doc(collection(db, 'projects'));
  try {
    await setDoc(docRef, {
      id: docRef.id,
      uid,
      title,
      deadline,
      status: 'In Progress',
      tasks: [],
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `projects/${docRef.id}`);
  }
};

export const updateProjectStatus = async (projectId: string, status: string) => {
  const docRef = doc(db, 'projects', projectId);
  try {
    await updateDoc(docRef, { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `projects/${projectId}`);
  }
};

export const deleteProject = async (projectId: string) => {
  const docRef = doc(db, 'projects', projectId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `projects/${projectId}`);
  }
};

export const updateMark = async (uid: string, subject: string, value: number) => {
  const q = query(collection(db, 'marks'), where('uid', '==', uid), where('subject', '==', subject));
  try {
    const snap = await getDocs(q);
    if (snap.empty) {
      const docRef = doc(collection(db, 'marks'));
      await setDoc(docRef, {
        id: docRef.id,
        uid,
        subject,
        value,
        date: new Date().toISOString().split('T')[0]
      });
    } else {
      const docRef = doc(db, 'marks', snap.docs[0].id);
      await updateDoc(docRef, { value, date: new Date().toISOString().split('T')[0] });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `marks/[searching]`);
  }
};

// Classroom & UNT Progress Helpers
export const createClassroom = async (teacherId: string, teacherName: string, name: string, subject: string) => {
  const docRef = doc(collection(db, 'classes'));
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const code = `ENT-${randomSuffix}`;
  const classroomData = {
    id: docRef.id,
    teacherId,
    teacherName,
    name,
    subject,
    code,
    createdAt: Date.now(),
    studentIds: []
  };
  try {
    await setDoc(docRef, classroomData);
    return classroomData;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `classes/${docRef.id}`);
  }
};

export const joinClassroomByCode = async (studentId: string, code: string) => {
  const cleanCode = code.trim().toUpperCase();
  const q = query(collection(db, 'classes'), where('code', '==', cleanCode));
  try {
    const snap = await getDocs(q);
    if (snap.empty) {
      throw new Error("Класс с таким кодом не найден. Проверьте код и попробуйте снова.");
    }
    const classDoc = snap.docs[0];
    const data = classDoc.data();
    const studentIds: string[] = data.studentIds || [];
    if (!studentIds.includes(studentId)) {
      studentIds.push(studentId);
      await updateDoc(doc(db, 'classes', classDoc.id), { studentIds });
      
      // Update student's classIds in user profile
      const userRef = doc(db, 'users', studentId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const uData = userSnap.data();
        const currentClasses: string[] = uData.classIds || [];
        if (!currentClasses.includes(classDoc.id)) {
          await updateDoc(userRef, { classIds: [...currentClasses, classDoc.id] });
        }
      }
    }
    return { id: classDoc.id, ...data, studentIds };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `classes/[join]`);
  }
};

export const createClassAssignment = async (assignment: {
  classId: string;
  teacherId: string;
  teacherName: string;
  title: string;
  type: 'test' | 'quiz' | 'flashcards' | 'task' | 'plan';
  subject: string;
  description: string;
  deadline?: string;
  contentData?: any;
}) => {
  const docRef = doc(collection(db, 'assignments'));
  const assignmentData = {
    ...assignment,
    id: docRef.id,
    createdAt: Date.now(),
    submissions: {}
  };
  try {
    await setDoc(docRef, assignmentData);
    return assignmentData;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `assignments/${docRef.id}`);
  }
};

export const submitAssignmentScore = async (
  assignmentId: string,
  studentId: string,
  studentName: string,
  score: number,
  maxScore = 100
) => {
  const docRef = doc(db, 'assignments', assignmentId);
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      const submissions = data.submissions || {};
      submissions[studentId] = {
        studentId,
        studentName,
        score,
        maxScore,
        completedAt: Date.now(),
        status: 'completed'
      };
      await updateDoc(docRef, { submissions });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `assignments/${assignmentId}`);
  }
};

export const sendTeacherMessage = async (msg: {
  senderId: string;
  senderName: string;
  senderRole: 'teacher' | 'student';
  receiverId: string;
  classId?: string;
  content: string;
  type?: 'message' | 'parent_alert' | 'motivation' | 'voice_note' | 'video_invite';
  audioUrl?: string;
}) => {
  const docRef = doc(collection(db, 'teacher_messages'));
  const messageData = {
    ...msg,
    id: docRef.id,
    timestamp: Date.now(),
    type: msg.type || 'message'
  };
  try {
    await setDoc(docRef, messageData);
    return messageData;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `teacher_messages/${docRef.id}`);
  }
};

