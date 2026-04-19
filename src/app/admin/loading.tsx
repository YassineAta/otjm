export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto" />
        <p className="mt-3 text-sm text-gray-500">Chargement...</p>
      </div>
    </div>
  )
}
