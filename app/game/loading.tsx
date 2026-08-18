export default function GameLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-card border-2 border-foreground shadow-brutal-lg p-5 sm:p-8 lg:p-10 flex flex-col gap-8 sm:gap-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="border-2 border-foreground bg-card p-2.5 shadow-brutal animate-pulse">
              <div className="w-5 h-5 bg-muted rounded" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="h-8 w-32 bg-muted rounded animate-pulse" />
              <div className="h-3 w-20 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="border-2 border-foreground bg-foreground text-background px-4 py-2 text-center shadow-brutal">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70 leading-none mb-1">Timer</p>
              <div className="h-8 w-10 bg-muted/30 rounded animate-pulse" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {["WPM", "Accuracy", "Errors", "Progress"].map((label) => (
            <div key={label} className="border-2 border-foreground bg-secondary px-4 py-3 shadow-brutal flex flex-col gap-1.5">
              <div className="h-3 w-16 bg-muted rounded animate-pulse" />
              <div className="h-7 w-12 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>

        <div className="bg-secondary border-2 border-foreground p-6 sm:p-8 h-[200px] sm:h-[220px] relative overflow-hidden">
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: 80 }).map((_, i) => (
              <div key={i} className="h-6 w-3 bg-muted/30 rounded animate-pulse" style={{ animationDelay: `${i * 20}ms` }} />
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <div className="h-11 w-28 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}
