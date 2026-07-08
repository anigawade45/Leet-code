export const metadata = {
  title: 'Premium - LeetCode',
}

export default function PremiumPage() {
  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-[#1a1a1a]">
      <div className="p-10 bg-[#282828] rounded-xl border border-[#3e3e3e] max-w-2xl w-full text-center">
        <h1 className="text-3xl font-bold text-[#ffa116] mb-4">LeetCode Premium</h1>
        <p className="text-[#8c8c8c] text-lg mb-8">Unlock exclusive problems, video solutions, and company-specific question banks!</p>
        <button className="bg-[#ffa116] text-black font-semibold px-8 py-3 rounded-lg hover:bg-[#ffb03a] transition-colors">
          Subscribe Now
        </button>
      </div>
    </div>
  )
}
