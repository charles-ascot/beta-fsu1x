export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-800">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
