import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card border-2 border-foreground shadow-brutal-lg p-8 flex flex-col items-center gap-6 text-center">
        <div className="bg-foreground text-background px-4 py-2 shadow-brutal">
          <span className="text-4xl font-black font-mono">404</span>
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Page Not Found</h1>
          <p className="text-muted-foreground font-medium leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist. Head back to the home page and start typing.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 border-2 border-foreground bg-primary text-primary-foreground px-5 py-2.5 text-xs font-black uppercase tracking-[0.15em] shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
