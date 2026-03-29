/**
 * Shows Odds API quota remaining.
 * Colour-coded: green >200, amber 50-200, red <50.
 */
export default function QuotaBadge({ remaining }) {
  if (remaining == null) return null

  const n = parseInt(remaining, 10)
  const cls =
    n > 200 ? 'badge-green' :
    n > 50  ? 'badge-amber' :
               'badge-red'

  return (
    <span className={cls}>
      {n} credits remaining
    </span>
  )
}
