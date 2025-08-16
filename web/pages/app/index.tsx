import Link from "next/link";
import { useState } from "react";
import {
  useGetV1AlbumsQuery,
  useGetV1MeQuery,
  usePatchV1MeMutation,
  type Album,
} from "../../src/services/genApi";
import { AlbumWizard } from "../../components/AlbumWizard";

export default function AppHome() {
  const { data: meQ, error: meError } = useGetV1MeQuery(undefined);
  const { data: albumsQ, refetch } = useGetV1AlbumsQuery(undefined);
  const [showWizard, setShowWizard] = useState(false);

  const me = meQ ?? null;
  const albums = (albumsQ ?? []) as Album[];
  const isAuthed = !!me && !(meError && (meError as any).status === 401);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Your albums</h2>
        <div className="text-sm text-neutral-700">
          {isAuthed && me ? (
            <span>
              Credits: <span className="font-medium">{me.credits ?? 0}</span>
            </span>
          ) : (
            <Link
              className="underline decoration-neutral-300 underline-offset-4 hover:text-black"
              href="/signup"
            >
              Sign in — 10 free credits
            </Link>
          )}
        </div>
      </div>

      {isAuthed && me && (!me.name || me.name.trim() === "") ? (
        <CompleteProfileCard />
      ) : showWizard ? (
        <AlbumWizard
          onSuccess={() => {
            setShowWizard(false);
            refetch();
          }}
          onCancel={() => setShowWizard(false)}
        />
      ) : (
        <div className="card max-w-md">
          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold tracking-tight">
                Create album
              </div>
              <p className="text-xs text-neutral-600 mt-1">
                Set up a new photo album with custom themes and privacy settings
              </p>
            </div>
            <button
              onClick={() => setShowWizard(true)}
              className="btn btn-primary w-full h-10"
            >
              Create New Album
            </button>
          </div>
        </div>
      )}

      {!albums || albums.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-600">
          You don’t have any albums yet. Create your first album above.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {albums.map((a) => (
            <Link key={a.id} href={`/app/albums/${a.id}`} className="group">
              <div className="aspect-[4/3] overflow-hidden rounded-xl bg-white shadow-card ring-1 ring-inset ring-neutral-200 transition-shadow duration-200 group-hover:shadow-lg"></div>
              <div className="mt-2 text-sm">
                <div className="font-medium">{a.name || "Untitled album"}</div>
                <div className="text-neutral-600">/{a.slug}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function CompleteProfileCard() {
  const [name, setName] = useState("");
  const [save, { isLoading }] = usePatchV1MeMutation();
  return (
    <div className="card max-w-md">
      <div className="space-y-4">
        <div>
          <div className="text-sm font-semibold tracking-tight">Complete your profile</div>
          <p className="text-xs text-neutral-600 mt-1">
            We couldn’t get your name from Google. Please enter your name.
          </p>
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-medium">Your name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            placeholder="Jane Doe"
          />
        </div>
        <button
          disabled={!name.trim() || isLoading}
          onClick={async () => {
            try {
              await save({ patchMeRequest: { name } } as any).unwrap();
              window.location.reload();
            } catch {}
          }}
          className="btn btn-primary w-full h-10 disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </div>
  );
}
