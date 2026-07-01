type Props = {
  label: string
  value: number
}

export function StatCard({ label, value }: Props) {
  return (
    <div className="card stat-card">
      <div className="muted">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  )
}
