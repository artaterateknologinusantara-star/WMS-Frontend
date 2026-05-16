const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthUser {
  token: string;
  userId: number;
  username: string;
  fullName: string;
  role: string;
}

const STORAGE_KEY = 'syntera_auth_user';
const COOKIE_NAME = 'syntera_auth_token';

export async function loginUser(request: LoginRequest): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const payload = await response.json();
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message ?? 'Login failed.');
  }

  const user: AuthUser = payload.data as AuthUser;

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    // Set cookie so Next.js middleware can detect auth state
    const maxAge = 8 * 3600;
    document.cookie = `${COOKIE_NAME}=${user.token}; path=/; max-age=${maxAge}; SameSite=Lax`;
  }

  return user;
}

export function logoutUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
  }
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as AuthUser) : null;
  } catch {
    return null;
  }
}
