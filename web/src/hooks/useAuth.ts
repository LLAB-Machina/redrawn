import { useGetV1MeQuery } from "@/services/genApi";

export function useAuth() {
  const {
    data: user,
    error,
    isLoading,
  } = useGetV1MeQuery(
    {},
    {
      // Avoid refetching on every route change/focus when cache exists
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  const isAuthenticated =
    !!user && !(error && (error as { status?: number }).status === 401);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
  };
}
