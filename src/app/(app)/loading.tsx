export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse" aria-label="กำลังโหลด" role="status">
      <div className="h-7 w-40 rounded bg-black/10 dark:bg-white/10" />
      <div className="h-12 rounded-xl bg-black/10 dark:bg-white/10" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-black/10 dark:bg-white/10" />
        ))}
      </div>
    </div>
  )
}
