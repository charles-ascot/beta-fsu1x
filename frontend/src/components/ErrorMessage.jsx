export default function ErrorMessage({ error }) {
  return (
    <div className="mx-6 mt-4 p-4 bg-red-900/20 border border-red-800 rounded-xl text-red-400 text-sm">
      <span className="font-medium">Error: </span>
      {error?.message || 'Something went wrong'}
    </div>
  )
}
