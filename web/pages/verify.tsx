import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { usePostV1AuthVerifyMutation } from "../src/services/genApi";
import Link from "next/link";

export default function Verify() {
  const router = useRouter();
  const { token, next } = router.query as { token?: string; next?: string };
  const [verify, { isLoading }] = usePostV1AuthVerifyMutation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      if (!token) return;
      try {
        await verify({ verifyRequest: { token } }).unwrap();
        const dest = next && next.startsWith("/") ? next : "/app";
        router.replace(dest);
      } catch (e: any) {
        setError("Verification failed. Your link may have expired.");
      }
    }
    run();
  }, [token, next, verify, router]);

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Signing you in…</h1>
      <p className="text-sm text-neutral-600">
        Please wait while we verify your magic link.
      </p>
      {isLoading && (
        <div className="h-2 w-full animate-pulse rounded bg-neutral-200" />
      )}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}{" "}
          <Link
            className="ml-1 underline decoration-neutral-300 underline-offset-4 hover:text-red-900"
            href="/signup"
          >
            Request a new link
          </Link>
          .
        </div>
      )}
    </div>
  );
}
