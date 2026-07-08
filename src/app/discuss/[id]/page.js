export default function DiscussThreadPage({ params }) {
  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-[#1a1a1a]">
      <div className="p-10 bg-[#282828] rounded-xl border border-[#3e3e3e] max-w-2xl w-full text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Discussion Thread #{params.id}</h1>
        <p className="text-[#8c8c8c] text-lg mb-8">This thread is currently unavailable or under construction.</p>
        <a href="/discuss" className="text-blue-500 hover:underline">Return to Discussions</a>
      </div>
    </div>
  )
}
