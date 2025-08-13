import { usePostV1BillingCreateCheckoutSessionMutation } from '../src/services/genApi'

export default function Billing() {
  const [createCheckout] = usePostV1BillingCreateCheckoutSessionMutation()
  async function startCheckout() {
    try {
      const data = await createCheckout(undefined as any).unwrap()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(JSON.stringify(data))
      }
    } catch (e: any) { alert(String(e)) }
  }
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Billing</h2>
        <p className="text-neutral-600">Manage your plan and payment method.</p>
      </div>
      <button className="inline-flex h-9 items-center rounded-md bg-black px-4 text-sm font-medium text-white shadow-sm ring-1 ring-black/10 hover:bg-neutral-900"
        onClick={startCheckout}>
        Start Checkout
      </button>
    </div>
  )
}

