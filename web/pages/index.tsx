export default function Home() {
  return (
    <div className="space-y-12">
      <section className="grid items-center gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">AI‑filtered photo albums you can share</h1>
          <p className="text-lg text-neutral-700">Create an album, apply a theme, and instantly get beautiful, on‑brand images to share with friends and family.</p>
          <div className="flex flex-wrap gap-3">
            <a className="inline-flex h-11 items-center justify-center rounded-md bg-black px-5 text-sm font-medium text-white shadow-sm ring-1 ring-black/10 hover:bg-neutral-900" href="/signup">Get started — 10 free credits</a>
            <a className="inline-flex h-11 items-center justify-center rounded-md border border-neutral-300 bg-white px-5 text-sm font-medium text-neutral-800 shadow-sm hover:bg-neutral-50" href="/app">Open app</a>
          </div>
          <div className="text-xs text-neutral-500">Each generated image costs 1 credit. Keep originals forever.</div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="aspect-[4/5] overflow-hidden rounded-lg bg-neutral-200"></div>
          <div className="aspect-[1/1] overflow-hidden rounded-lg bg-neutral-200"></div>
          <div className="aspect-[3/4] overflow-hidden rounded-lg bg-neutral-200"></div>
          <div className="aspect-[16/10] col-span-2 overflow-hidden rounded-lg bg-neutral-200"></div>
          <div className="aspect-[3/2] overflow-hidden rounded-lg bg-neutral-200"></div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Example albums</h2>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <a key={i} href="/app" className="group">
              <div className="aspect-[4/3] overflow-hidden rounded-lg bg-neutral-200 ring-1 ring-inset ring-neutral-300"></div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <div className="font-medium">Sample Album {i + 1}</div>
                <div className="text-neutral-500 group-hover:text-neutral-700">View →</div>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="text-sm font-semibold">1. Create an album</div>
          <div className="mt-1 text-sm text-neutral-600">Start a new album for an event or memory. Invite collaborators.</div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="text-sm font-semibold">2. Upload and choose a theme</div>
          <div className="mt-1 text-sm text-neutral-600">Upload single images, many at once, or a .zip. Pick a theme per album or image.</div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="text-sm font-semibold">3. Generate and share</div>
          <div className="mt-1 text-sm text-neutral-600">We generate styled images (1 credit each). Share the album link with anyone.</div>
        </div>
      </section>
    </div>
  )
}

