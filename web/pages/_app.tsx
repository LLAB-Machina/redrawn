import type { AppProps } from 'next/app'
import Link from 'next/link'
import { Provider } from 'react-redux'
import { store } from '../src/services/store'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <div className="min-h-screen bg-neutral-50 text-neutral-900">
        <header className="border-b border-neutral-200 bg-white">
          <nav className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
            <div className="mr-auto font-semibold">Redrawn</div>
            <Link className="text-sm text-neutral-700 hover:text-black" href="/">Home</Link>
            <Link className="text-sm text-neutral-700 hover:text-black" href="/signup">Create account</Link>
            <Link className="text-sm text-neutral-700 hover:text-black" href="/app">App</Link>
            <Link className="text-sm text-neutral-700 hover:text-black" href="/app/themes">Themes</Link>
            <Link className="text-sm text-neutral-700 hover:text-black" href="/billing">Billing</Link>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">
          <Component {...pageProps} />
        </main>
      </div>
    </Provider>
  )
}

