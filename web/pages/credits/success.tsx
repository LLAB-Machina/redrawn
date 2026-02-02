import { useRouter } from 'next/router'
import { useEffect } from 'react'
import Link from 'next/link'
import Layout from '@/components/Layout'

export default function CreditsSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    // Optional: Auto-redirect after a few seconds
    const timer = setTimeout(() => {
      // router.push('/credits')
    }, 5000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <Layout title="Purchase Successful - Redrawn">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Purchase Successful!
          </h1>
          <p className="text-slate-600 mb-8">
            Your credits have been added to your account and are ready to use.
          </p>

          <div className="space-y-3">
            <Link
              href="/credits"
              className="block w-full py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
            >
              View Credits
            </Link>
            <Link
              href="/albums"
              className="block w-full py-3 bg-white text-slate-700 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Go to Albums
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}
