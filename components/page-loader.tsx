export function PageLoader() {
 return (
 <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-5">
 <div className="relative flex items-center justify-center">
 <div className="absolute w-16 h-16 rounded-full border-2 border-muted border-t-primary animate-spin" />
 <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
 </div>
 <div className="flex flex-col items-center gap-1">
 <span className="text-sm font-semibold text-foreground">
 PlanZ gigs
 </span>
 <span className="text-xs text-muted-foreground animate-pulse" style={{ animationDuration: "1.5s" }}>
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
 className="rounded-lg border border-border bg-card p-4 space-y-3 animate-pulse"
 style={{ animationDelay: `${i * 0.05}s`, animationDuration: "1.5s" }}
 >
 <div className="flex items-start gap-3">
 <div className="w-10 h-10 rounded-lg bg-muted" />
 <div className="flex-1 space-y-2">
 <div className="h-3 w-3/4 rounded bg-muted" />
 <div className="h-2.5 w-1/2 rounded bg-muted" />
 </div>
 </div>
 <div className="h-2 w-full rounded bg-muted" />
 <div className="h-2 w-2/3 rounded bg-muted" />
 </div>
 ))}
 </div>
 )
}

export function StatSkeleton() {
 return (
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
 {[1, 2, 3].map((i) => (
 <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-2 animate-pulse">
 <div className="w-8 h-8 rounded-lg bg-muted" />
 <div className="h-6 w-16 rounded bg-muted" />
 <div className="h-2.5 w-20 rounded bg-muted" />
 </div>
 ))}
 </div>
 )
}
