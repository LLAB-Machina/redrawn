import { useGetV1MeQuery } from '@/services/genApi';

export function useAuth() {
  const { data: user, error, isLoading } = useGetV1MeQuery({});
  
  const isAuthenticated = !!user && !(error && (error as any).status === 401);
  
  return {
    user,
    isAuthenticated,
    isLoading,
    error,
  };
}
