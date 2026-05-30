import Link from 'next/link'
export function EmptyState({ text, ctaHref, ctaLabel }: { text: string; ctaHref?: string; ctaLabel?: string }) {
  return (
    <div className="text-center opacity-70 py-12">
      <p>{text}</p>
      {ctaHref && <Link href={ctaHref} className="inline-block mt-3 underline">{ctaLabel}</Link>}
    </div>
  )
}
