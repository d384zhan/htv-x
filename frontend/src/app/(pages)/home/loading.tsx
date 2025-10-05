export default function HomeLoading() {
  return (
    <div className="h-screen bg-[#181716] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#3a5a7a] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-white font-karla text-lg">Loading...</p>
      </div>
    </div>
  )
}
