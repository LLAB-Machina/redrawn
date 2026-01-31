import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <Head>
        <title>Redrawn — Themed Photo Albums</title>
        <meta name="description" content="Generate themed, on-brand visuals from your photos" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950">
        {/* Noise texture overlay */}
        <div className="fixed inset-0 opacity-[0.03] pointer-events-none" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }} 
        />

        <main className="relative z-10">
          {/* Hero */}
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24 lg:py-32">
            <div className="text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8">
                <span className="w-2 h-2 rounded-full bg-coral-500 animate-pulse" style={{backgroundColor: '#ff6b6b'}} />
                <span className="text-sm text-white/60 font-medium tracking-wide">Now in beta</span>
              </div>

              {/* Headline */}
              <h1 
                className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Redrawn
              </h1>
              
              <p 
                className="text-xl sm:text-2xl text-white/70 max-w-2xl mx-auto mb-12 leading-relaxed"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Transform your photos into themed, on-brand visuals.
                Collaborate. Share. Create.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/auth/register"
                  className="group px-8 py-4 rounded-full font-medium text-slate-900 transition-all duration-300 hover:scale-105"
                  style={{ 
                    fontFamily: "'Inter', sans-serif",
                    backgroundColor: '#ff6b6b',
                  }}
                >
                  <span className="flex items-center gap-2">
                    Get Started
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </Link>
                
                <Link
                  href="/auth/login"
                  className="px-8 py-4 rounded-full font-medium text-white border border-white/20 backdrop-blur-sm hover:bg-white/5 transition-all duration-300"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>

          {/* Features grid */}
          <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 pb-24">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Themed Generation',
                  desc: 'Apply brand styles to any photo with AI-powered transformations.',
                },
                {
                  title: 'Collaborative Albums',
                  desc: 'Invite team members. Manage roles. Build together.',
                },
                {
                  title: 'Share Publicly',
                  desc: 'Publish albums with custom slugs. Password protection optional.',
                },
              ].map((feature, i) => (
                <div 
                  key={i}
                  className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-500"
                  style={{ 
                    fontFamily: "'Inter', sans-serif",
                    animationDelay: `${i * 100}ms`,
                  }}
                >
                  <h3 
                    className="text-xl font-semibold text-white mb-3"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-white/60 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
