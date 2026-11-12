import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp);
}

export function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(timestamp);
}

function hashString(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193 ^ 0x5bd1e995;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ c, 0x5bd1e995);
  }
  return (h1 >>> 0).toString(36) + (h2 >>> 0).toString(36);
}

export function stableLocalUid(role: 'teacher' | 'student', email: string): string {
  const cleanEmail = email.trim().toLowerCase();
  let hash = 5381;
  for (let i = 0; i < cleanEmail.length; i++) {
    hash = ((hash << 5) + hash) + cleanEmail.charCodeAt(i);
    hash = hash & hash;
  }
  return `user_${role}_${(hash >>> 0).toString(36)}`;
}

export function localUserId(role: 'student' | 'teacher', email: string): string {
  return stableLocalUid(role, email);
}

const LOCAL_PROFILE_PREFIX = 'spyris_local_profile_';
export const LOCAL_SESSION_KEY = 'spyris_local_user';

export function loadLocalProfile<T>(uid: string): T | null {
  try {
    const raw = localStorage.getItem(LOCAL_PROFILE_PREFIX + uid);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveLocalSession<T extends { uid: string }>(profile: T): void {
  try {
    localStorage.setItem(LOCAL_PROFILE_PREFIX + profile.uid, JSON.stringify(profile));
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(profile));
  } catch {}
}

export function clearLocalSession(): void {
  try {
    localStorage.removeItem(LOCAL_SESSION_KEY);
  } catch {}
}

export async function compressImageFile(file: File, maxDimension = 1600, quality = 0.85): Promise<{ data: string; mimeType: string; url: string }> {
  return new Promise((resolve, reject) => {
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const full = (e.target?.result as string) || '';
        const base64 = full.split(',')[1] || '';
        resolve({ data: base64, mimeType: file.type, url: full });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const full = (e.target?.result as string) || '';
          resolve({ data: full.split(',')[1] || '', mimeType: file.type || 'image/jpeg', url: full });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const dataUrl = canvas.toDataURL(outputMime, quality);
      const base64 = dataUrl.split(',')[1] || '';
      resolve({ data: base64, mimeType: outputMime, url: dataUrl });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      const reader = new FileReader();
      reader.onload = (e) => {
        const full = (e.target?.result as string) || '';
        resolve({ data: full.split(',')[1] || '', mimeType: file.type || 'image/jpeg', url: full });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    };
    img.src = objectUrl;
  });
}

