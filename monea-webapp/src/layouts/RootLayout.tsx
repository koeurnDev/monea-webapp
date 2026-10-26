import { Link, Outlet, useLocation, useNavigationType } from 'react-router-dom'
import { useLayoutEffect } from 'react'
import { LoadingBar } from '@/components/ui/LoadingBar'
import SystemStatusListener from '@/components/layout/SystemStatusListener'
import { ErrorBoundary } from '@/components/error-boundary'

/**
 * Root layout — wraps every page.
 * Replaces src/app/layout.tsx (the body/html wrapper is now in index.html).
 */
export default function RootLayout() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()

  useLayoutEffect(() => {
    const previousRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'auto'

    return () => {
      window.history.scrollRestoration = previousRestoration
    }
  }, [])

  useLayoutEffect(() => {
    if (navigationType === 'POP') return

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    })
  }, [navigationType, pathname])

  return (
    <>
      <SystemStatusListener />
      <LoadingBar />
      <ErrorBoundary
        key={pathname}
        name={`Route ${pathname}`}
        fallback={
          <main className="mx-auto flex min-h-[55vh] w-full max-w-3xl items-center justify-center px-4 py-10">
            <section role="alert" className="w-full rounded-2xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
              <h1 className="font-kantumruy text-lg font-bold text-foreground">
                ទំព័រនេះមិនអាចបង្ហាញបានទេ
              </h1>
              <p className="mx-auto mt-2 max-w-md font-kantumruy text-sm leading-6 text-muted-foreground">
                សូមសាកល្បងម្តងទៀត ឬត្រឡប់ទៅទំព័រដើម។ ទិន្នន័យដែលបានរក្សាទុកមិនត្រូវបានលុបទេ។
              </p>
              <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="min-h-11 rounded-xl bg-primary px-5 font-kantumruy text-sm font-bold text-primary-foreground hover:bg-primary/90"
                >
                  ព្យាយាមម្តងទៀត
                </button>
                <Link
                  to="/"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-background px-5 font-kantumruy text-sm font-bold text-foreground hover:bg-muted"
                >
                  ទៅទំព័រដើម
                </Link>
              </div>
            </section>
          </main>
        }
      >
        <Outlet />
      </ErrorBoundary>
    </>
  )
}
