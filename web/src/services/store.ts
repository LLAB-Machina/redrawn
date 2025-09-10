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
        interface RejectedAction {
          type: string;
          payload?: {
            data?: {
              message?: string;
              detail?: string;
              error?: string;
              status?: number;
            };
            error?: string;
            status?: number;
          };
          meta?: {
            arg?: {
              endpointName?: string;
            };
          };
        }
        
        const rejectedAction = action as RejectedAction;
        
        if (
          typeof rejectedAction?.type === 'string' &&
          rejectedAction.type.endsWith('/rejected') &&
          typeof window !== 'undefined'
        ) {
          const payload = rejectedAction.payload;
          const data = payload?.data ?? payload;
          const status = payload?.status ?? (data && typeof data === 'object' && 'status' in data ? data.status : undefined);
          const endpointName: string | undefined = rejectedAction?.meta?.arg?.endpointName;

          // Suppress noisy unauthenticated toasts when probing session state
          const suppressToast = endpointName === 'getV1Me' && status === 401;

          if (!suppressToast) {
            let msg = 'Something went wrong';
            
            if (typeof data === 'string') {
              msg = data;
            } else if (data && typeof data === 'object') {
              const errorData = data as { message?: string; detail?: string; error?: string };
              msg = errorData.message || errorData.detail || errorData.error || msg;
            }
            
            toast.error(msg);
          }
        }
        return next(action);
      },
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
