import { configureStore } from '@reduxjs/toolkit';
import { emptySplitApi } from './emptyApi';
import { toast } from 'sonner';

export const store = configureStore({
  reducer: { [emptySplitApi.reducerPath]: emptySplitApi.reducer },
  middleware: (gDM) =>
    gDM().concat(
      emptySplitApi.middleware,
      // User-friendly toast middleware for rejected API calls
      () => (next: (action: unknown) => unknown) => (action: unknown) => {
        // RTK Query rejected action shape: type ends with '/rejected'
        if (
          typeof (action as any)?.type === 'string' &&
          (action as any).type.endsWith('/rejected') &&
          typeof window !== 'undefined'
        ) {
          const payload = (action as any).payload as { data?: any; error?: any; status?: number } | undefined;
          const data = payload?.data ?? payload;
          const status = (payload as any)?.status ?? (data as any)?.status;
          const endpointName: string | undefined = (action as any)?.meta?.arg?.endpointName;

          // Suppress noisy unauthenticated toasts when probing session state
          const suppressToast = endpointName === 'getV1Me' && status === 401;

          if (!suppressToast) {
            const msg =
              (data as any)?.message ||
              (data as any)?.detail ||
              (data as any)?.error ||
              (typeof data === 'string' ? (data as any) : '') ||
              'Something went wrong';
            toast.error(msg);
          }
        }
        return next(action);
      },
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
