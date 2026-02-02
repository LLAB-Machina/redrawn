import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useGetCreditBalanceQuery } from '../services/api'

interface LayoutProps {
  children: React.ReactNode
  title?: string
}

export default function Layout({ children, title = 'Redrawn' }: LayoutProps) {
  const router = useRouter()
  const { data: credits } = useGetCreditBalanceQuery()

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/albums', label: 'Albums' },
    { href: '/themes', label: 'Themes' },
  ]

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <Link href="/dashboard" className="flex items-center gap-2">
                <span className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Redrawn
                </span>
              </Link>

              {/* Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = router.pathname.startsWith(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-slate-100 text-slate-900'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </nav>

              {/* Right side */}
              <div className="flex items-center gap-4">
                {/* Credits */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full border border-amber-200">
                  <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                  <span className="text-sm font-medium text-amber-900">
                    {credits?.balance ?? 0} credits
                  </span>
                </div>

                {/* Settings */}
                <Link
                  href="/settings"
                  className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main>{children}</main>
      </div>
    </>
  )
}
