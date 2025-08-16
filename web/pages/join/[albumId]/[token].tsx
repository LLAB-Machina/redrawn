import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { usePostV1AlbumsByIdInviteLinksAcceptAndTokenMutation } from '../../../src/services/genApi';

export default function JoinAlbum() {
  const router = useRouter();
  const { albumId, token } = router.query as {
    albumId?: string;
    token?: string;
  };
  const [accept] = usePostV1AlbumsByIdInviteLinksAcceptAndTokenMutation();
  const [status, setStatus] = useState<string>('Joining...');

  useEffect(() => {
    if (!albumId || !token) return;
    (async () => {
      try {
        await accept({ id: albumId, token: token }).unwrap();
        setStatus('Success! Redirecting...');
        router.replace(`/app/albums/${albumId}`);
      } catch (e: any) {
        // If unauthorized, redirect to sign-in preserving next
        const msg = String(e?.data?.message || e);
        if (msg.toLowerCase().includes('unauthorized') || e?.status === 401) {
          const next = encodeURIComponent(`/join/${albumId}/${token}`);
          router.replace(`/verify?next=${next}`);
          return;
        }
        setStatus('This invite link is invalid or expired.');
      }
    })();
  }, [albumId, token]);

  return (
    <div className="mx-auto max-w-md p-6 text-center">
      <div className="text-lg font-semibold">Accepting invite…</div>
      <div className="mt-2 text-sm text-neutral-600">{status}</div>
    </div>
  );
}
