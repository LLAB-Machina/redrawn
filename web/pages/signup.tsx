import { useEffect, useState } from "react";
import { api } from "../src/services/genApi";
import { useGetV1MeQuery } from "../src/services/genApi";

export default function Signup() {
  const [triggerGoogleStart] = api.useLazyGetV1AuthGoogleStartQuery();
  const [error, setError] = useState<string | null>(null);
  const { data: me, error: meError } = useGetV1MeQuery(undefined);

  useEffect(() => {
    const isAuthed = !(meError && (meError as any).status === 401) && !!me;
    if (isAuthed) {
      // If already signed in, send to app
      const url = new URL(window.location.href);
      const next = url.searchParams.get("next");
      const dest = next && next.startsWith("/") ? next : "/app";
      window.location.replace(dest);
    }
  }, [me, meError]);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-neutral-600">
          Use Google to sign in. New users get{" "}
          <span className="font-medium text-neutral-900">10 free credits</span>.
        </p>
      </div>
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}
      <button
        className="btn btn-neutral h-10 gap-2 px-4"
        type="button"
        onClick={async () => {
          try {
            const res = await triggerGoogleStart(undefined);
            const data = (res as any)?.data as { url?: string } | undefined;
            if (data?.url) window.location.href = data.url;
          } catch (e: any) {
            setError(String(e));
          }
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          className="h-4 w-4"
        >
          <path
            fill="#FFC107"
            d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.156,7.961,3.039l5.657-5.657C33.327,6.053,28.884,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
          />
          <path
            fill="#FF3D00"
            d="M6.306,14.691l6.571,4.814C14.655,16.108,18.961,14,24,14c3.059,0,5.842,1.156,7.961,3.039l5.657-5.657C33.327,6.053,28.884,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
          />
          <path
            fill="#4CAF50"
            d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.278-7.949l-6.49,5.002C9.593,39.556,16.227,44,24,44z"
          />
          <path
            fill="#1976D2"
            d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.102,5.611c0.001-0.001,0.001-0.001,0.002-0.002l6.19,5.238C36.673,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
          />
        </svg>
        Continue with Google
      </button>
    </div>
  );
}
