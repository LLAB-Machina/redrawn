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
          const payload = (action as any).payload as { data?: any; error?: any } | undefined;
          const data = payload?.data ?? payload;
          const msg =
            data?.message ||
            data?.detail ||
            data?.error ||
            (typeof data === 'string' ? data : '') ||
            'Something went wrong';
          toast.error(msg);
        }
        return next(action);
      },
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
