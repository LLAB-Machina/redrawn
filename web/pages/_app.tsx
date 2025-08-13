import type { AppProps } from 'next/app'
import Link from 'next/link'
import { Provider } from 'react-redux'
import { store } from '../src/services/store'
import '../styles/globals.css'
import { Toaster, toast } from 'sonner'
import { useEffect } from 'react'

export default function App({ Component, pageProps }: AppProps) {
  // Dev-only: show a lightweight popup when our proxy includes backend stack
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return

    const origFetch = window.fetch
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const res = await origFetch(input, init)
      try {
        if (!res.ok && res.headers.get('content-type')?.includes('application/json')) {
          const clone = res.clone()
          const data = await clone.json().catch(() => null as any)
          const stack = (data && (data.stack || data?.backend?.errors?.find((e: any) => e?.more?.stack)?.more?.stack)) as string | undefined
          const msg = (data && (data.message || data?.backend?.detail || data?.detail || data?.title)) as string | undefined
          // User-friendly toast
          toast.error(msg ?? 'Request failed')
          if (stack) {
            const el = document.createElement('div')
            el.style.position = 'fixed'
            el.style.right = '12px'
            el.style.bottom = '12px'
            el.style.zIndex = '99999'
            el.style.maxWidth = '640px'
            el.style.padding = '12px 14px'
            el.style.borderRadius = '8px'
            el.style.background = '#111827'
            el.style.color = '#F9FAFB'
            el.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)'
            el.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
            el.style.whiteSpace = 'pre-wrap'
            el.style.overflow = 'auto'
            el.style.maxHeight = '60vh'
            el.innerText = `${msg ?? 'Request failed'}\n\n${stack}`
            el.onclick = () => el.remove()
            document.body.appendChild(el)
            setTimeout(() => el.remove(), 15000)

            // Optional: trigger Next.js dev overlay by throwing an uncaught error
            // Enable by setting NEXT_PUBLIC_DEV_THROW_ON_API_ERROR=1
            if (process.env.NEXT_PUBLIC_DEV_THROW_ON_API_ERROR === '1') {
              const err = new Error(msg ?? 'Request failed')
              // Append stack from backend for visibility in overlay
              try { (err as any).stack = `${err.stack}\n\nBackend:\n${stack}` } catch {}
              setTimeout(() => { throw err }, 0)
            }
          }
        }
      } catch {
        // ignore
      }
      return res
    }

    return () => {
      window.fetch = origFetch
    }
  }, [])

  return (
    <Provider store={store}>
      <div className="min-h-screen bg-neutral-50 text-neutral-900">
        <header className="border-b border-neutral-200 bg-white">
          <nav className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
            <div className="mr-auto font-semibold">Redrawn</div>
            <Link className="text-sm text-neutral-700 hover:text-black" href="/">Home</Link>
            <Link className="text-sm text-neutral-700 hover:text-black" href="/signup">Sign in</Link>
            <Link className="text-sm text-neutral-700 hover:text-black" href="/app">App</Link>
            <Link className="text-sm text-neutral-700 hover:text-black" href="/app/themes">Themes</Link>
            <Link className="text-sm text-neutral-700 hover:text-black" href="/billing">Billing</Link>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">
          <Toaster richColors position="top-center" />
          <Component {...pageProps} />
        </main>
      </div>
    </Provider>
  )
}

