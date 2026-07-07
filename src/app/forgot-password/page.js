export default function ForgotPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
      <div className="p-8 bg-[#282828] rounded-xl border border-[#3e3e3e] max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-4">Reset Password</h1>
        <p className="text-[#8c8c8c] mb-6">Please contact support or the administrator to reset your password.</p>
        <a href="/login" className="text-blue-500 hover:underline">Return to Login</a>
      </div>
    </div>
  )
}
