export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const token = localStorage.getItem('RD_AUTH_TOKEN');
    return token && token.trim().length > 0 ? token : null;
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (token && token.trim().length > 0) {
      localStorage.setItem('RD_AUTH_TOKEN', token);
    } else {
      localStorage.removeItem('RD_AUTH_TOKEN');
    }
  } catch {
    // ignore
  }
}

