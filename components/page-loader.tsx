export function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-5">
      <div className="relative flex items-center justify-center">
        <div className="absolute w-16 h-16 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <div className="absolute w-10 h-10 rounded-full border-2 border-secondary/20 border-b-secondary animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.8s" }} />
        <div className="h-4 w-4 rounded-full bg-gradient-to-br from-primary via-secondary to-accent animate-pulse" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs font-mono font-semibold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          PlanZ gigs
        </span>
        <span className="text-[10px] font-mono text-muted-foreground/40 animate-pulse" style={{ animationDuration: "1.5s" }}>
          loading...
        </span>
      </div>
    </div>
  )
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border/40 bg-card/50 p-4 space-y-3 animate-pulse"
          style={{ animationDelay: `${i * 0.05}s`, animationDuration: "1.5s" }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 rounded-full bg-muted/60" />
              <div className="h-2.5 w-1/2 rounded-full bg-muted/40" />
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-muted/30" />
          <div className="h-2 w-2/3 rounded-full bg-muted/30" />
        </div>
      ))}
    </div>
  )
}

export function StatSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border/40 bg-card/50 p-4 space-y-2 animate-pulse">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10" />
          <div className="h-6 w-16 rounded bg-muted/50" />
          <div className="h-2.5 w-20 rounded-full bg-muted/30" />
        </div>
      ))}
    </div>
  )
}
