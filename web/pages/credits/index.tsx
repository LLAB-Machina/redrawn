import { useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import { 
  useGetCreditBalanceQuery,
  usePurchaseCreditsMutation,
  useListCreditTransactionsQuery,
} from '@/services/api'

const CREDIT_PACKAGES = [
  { amount: 10, price: 5, popular: false },
  { amount: 50, price: 20, popular: true },
  { amount: 200, price: 60, popular: false },
]

export default function CreditsPage() {
  const router = useRouter()
  const [selectedPackage, setSelectedPackage] = useState(CREDIT_PACKAGES[1])
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe')
  const [isProcessing, setIsProcessing] = useState(false)
  
  const { data: balanceData, isLoading: balanceLoading } = useGetCreditBalanceQuery()
  const { data: transactionsData, isLoading: transactionsLoading } = useListCreditTransactionsQuery({ limit: 5 })
  const [purchaseCredits] = usePurchaseCreditsMutation()

  const balance = balanceData?.balance ?? 0
  const transactions = transactionsData?.transactions ?? []

  const handlePurchase = async () => {
    setIsProcessing(true)
    try {
      const result = await purchaseCredits({
        amount: selectedPackage.amount,
        payment_method: paymentMethod,
      }).unwrap()
      
      // Handle payment redirect
      if (result.checkout_url) {
        window.location.href = result.checkout_url
      } else if (result.client_secret) {
        // Stripe Elements would be initialized here
        router.push('/credits/success')
      }
    } catch (err) {
      console.error('Purchase failed:', err)
      alert('Purchase failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Layout title="Credits - Redrawn">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>
            Credits
          </h1>
          <p className="text-slate-600 mt-1">
            Purchase credits to generate themed photos
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Current Balance */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6 mb-6">
              <h2 className="text-sm font-medium text-amber-800 uppercase tracking-wide mb-2">
                Current Balance
              </h2>
              <div className="text-5xl font-bold text-amber-900">
                {balanceLoading ? '-' : balance}
              </div>
              <p className="text-amber-700 text-sm mt-2">
                Credits available for photo generation
              </p>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Recent Activity</h2>
              
              {transactionsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-slate-100 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <p className="text-slate-500 text-sm">No recent transactions</p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-slate-900 capitalize">
                          {tx.type}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-sm font-semibold ${
                        tx.amount > 0 ? 'text-green-600' : 'text-slate-900'
                      }`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Purchase Options */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-6">Purchase Credits</h2>

              {/* Credit Packages */}
              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                {CREDIT_PACKAGES.map((pkg) => (
                  <button
                    key={pkg.amount}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`relative p-6 rounded-xl border-2 text-left transition-all ${
                      selectedPackage.amount === pkg.amount
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900 text-white text-xs font-medium rounded-full">
                        Popular
                      </span>
                    )}
                    <div className="text-3xl font-bold text-slate-900 mb-1">
                      {pkg.amount}
                    </div>
                    <div className="text-sm text-slate-500">credits</div>
                    <div className="mt-4 text-lg font-semibold text-slate-900">
                      ${pkg.price}
                    </div>
                    <div className="text-xs text-slate-500">
                      ${(pkg.price / pkg.amount).toFixed(2)}/credit
                    </div>
                  </button>
                ))}
              </div>

              {/* Payment Method */}
              <div className="mb-8">
                <h3 className="text-sm font-medium text-slate-900 mb-3">Payment Method</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPaymentMethod('stripe')}
                    className={`flex-1 p-4 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                      paymentMethod === 'stripe'
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                    </svg>
                    <span className="font-medium">Card</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('paypal')}
                    className={`flex-1 p-4 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                      paymentMethod === 'paypal'
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082H9.63l-1.496 9.478h2.79c.457 0 .85-.335.922-.788l.04-.19.73-4.627.047-.255a.933.933 0 0 1 .922-.788h.58c3.76 0 6.704-1.528 7.565-5.946.266-1.37.177-2.566-.345-3.57l-.167-.318-.005-.01z"/>
                    </svg>
                    <span className="font-medium">PayPal</span>
                  </button>
                </div>
              </div>

              {/* Purchase Button */}
              <button
                onClick={handlePurchase}
                disabled={isProcessing}
                className="w-full py-4 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>Purchase {selectedPackage.amount} Credits for ${selectedPackage.price}</>
                )}
              </button>

              <p className="text-center text-sm text-slate-500 mt-4">
                Secure payment processing. Credits are non-refundable.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
