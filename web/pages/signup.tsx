import { FormEvent, useState } from 'react'
import { usePostV1AuthRequestMagicLinkMutation } from '../src/services/genApi'

export default function Signup() {
  const [requestMagicLink, { isLoading }] = usePostV1AuthRequestMagicLinkMutation()
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    try {
      await requestMagicLink({ email }).unwrap()
      setSentTo(email)
    } catch (err: any) {
      setError(String(err))
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm text-neutral-600">We’ll email you a magic link to sign in or create your account. New users get <span className="font-medium text-neutral-800">10 free credits</span>.</p>
      </div>

      {sentTo ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Check your email ({sentTo}) for a sign-in link.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-neutral-700">Email</span>
            <input
              className="h-10 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
            />
          </label>
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
          )}
          <button
            className="inline-flex h-10 items-center justify-center rounded-md bg-black px-4 text-sm font-medium text-white shadow-sm ring-1 ring-black/10 hover:bg-neutral-900 disabled:opacity-50"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Sending…' : 'Email me a magic link'}
          </button>
        </form>
      )}
    </div>
  )
}

