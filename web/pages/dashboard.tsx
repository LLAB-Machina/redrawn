import Head from 'next/head'

export default function Dashboard() {
  return (
    <>
      <Head>
        <title>Dashboard - Redrawn</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Redrawn</h1>
            <nav className="flex space-x-4">
              <a href="/albums" className="text-gray-600 hover:text-gray-900">
                Albums
              </a>
              <a href="/themes" className="text-gray-600 hover:text-gray-900">
                Themes
              </a>
              <a href="/settings" className="text-gray-600 hover:text-gray-900">
                Settings
              </a>
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Welcome to Redrawn!
            </h2>
            <p className="text-gray-600">
              This is your dashboard. Album and photo management coming soon.
            </p>
          </div>
        </main>
      </div>
    </>
  )
}
