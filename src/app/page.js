'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/navbar/Navbar'
import { AuthenticatedDashboard } from '@/components/dashboard/AuthenticatedDashboard'
import { useAuth } from '@/hooks/useAuth'
import FullPageLoader from '@/components/common/FullPageLoader'

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) return <FullPageLoader />

  if (user) {
    return (
      <>
        <Navbar />
        <AuthenticatedDashboard />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-background text-white">
      <Navbar />
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          {/* Left Side: Home Image */}
          <div className="flex-1 w-full">
            <div className="relative w-full max-w-[600px]">
              <Image
                src="/home.png"
                alt="LeetCode Home Illustration"
                width={600}
                height={500}
                className="w-full h-auto rounded-3xl shadow-2xl"
                priority
              />
            </div>
          </div>

          {/* Right Side: Text Content */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight" style={{ fontFamily: 'Typo Round, sans-serif' }}>
              A New Way to Learn
            </h1>
            <p className="text-lg text-[#9da0a5] mb-8 max-w-xl mx-auto md:mx-0">
              LeetCode is the best platform to help you enhance your skills, expand your knowledge and prepare for technical interviews.
            </p>
            <Link
              href="/register"
              className="inline-block px-8 py-3 bg-[#2a9d8f] hover:bg-[#238678] rounded-full text-white font-medium transition-all transform hover:scale-105"
            >
              Create Account →
            </Link>
          </div>
        </div>
      </section>

      {/* Start Exploring Section */}
      <section className="bg-[#212121] py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Typo Round, sans-serif' }}>
                Start Exploring
              </h2>
              <p className="text-lg text-[#9da0a5] mb-8 max-w-xl mx-auto md:mx-0">
                Explore is a well-organized tool that helps you get the most out of LeetCode by providing structure to guide your progress towards the next step in your programming career.
              </p>
              <Link
                href="/explore"
                className="inline-block px-8 py-3 bg-[#2a9d8f] hover:bg-[#238678] rounded-full text-white font-medium transition-all transform hover:scale-105"
              >
                Get Started
              </Link>
            </div>
            <div className="flex-1">
              {/* Placeholder for Explore image */}
              <div className="bg-[#282c34] rounded-3xl p-12 shadow-2xl flex items-center justify-center min-h-[300px]">
                <div className="text-6xl">🔍</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Questions, Community & Contests Section */}
      <section className="bg-background py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-12">
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Typo Round, sans-serif' }}>
                Questions, Community & Contests
              </h2>
              <p className="text-lg text-[#9da0a5] mb-8 max-w-xl mx-auto md:mx-0">
                Over 4200 questions for you to practice. Come and join one of the largest tech communities with hundreds of thousands of active users and participate in our contests to challenge yourself and earn rewards.
              </p>
              <Link
                href="/problems"
                className="inline-block px-8 py-3 bg-[#2a9d8f] hover:bg-[#238678] rounded-full text-white font-medium transition-all transform hover:scale-105"
              >
                View Questions
              </Link>
            </div>
            <div className="flex-1">
              {/* Placeholder for Questions image */}
              <div className="bg-[#282c34] rounded-3xl p-12 shadow-2xl flex items-center justify-center min-h-[300px]">
                <div className="text-6xl">💻</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Companies & Candidates Section */}
      <section className="bg-[#212121] py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Typo Round, sans-serif' }}>
                Companies & Candidates
              </h2>
              <p className="text-lg text-[#9da0a5] mb-8 max-w-xl mx-auto md:mx-0">
                Not only does LeetCode prepare candidates for technical interviews, we also help companies identify top technical talent. From sponsoring contests to providing online assessments and training, we offer numerous services to businesses.
              </p>
              <Link
                href="/business"
                className="inline-block px-8 py-3 bg-[#2a9d8f] hover:bg-[#238678] rounded-full text-white font-medium transition-all transform hover:scale-105"
              >
                Business Opportunities
              </Link>
            </div>
            <div className="flex-1">
              {/* Placeholder for Companies image */}
              <div className="bg-[#282c34] rounded-3xl p-12 shadow-2xl flex items-center justify-center min-h-[300px]">
                <div className="text-6xl">🏢</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Section */}
      <section className="bg-background py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-12">
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Typo Round, sans-serif' }}>
                Developer
              </h2>
              <p className="text-lg text-[#9da0a5] mb-8 max-w-xl mx-auto md:mx-0">
                We now support 14 popular coding languages. At our core, LeetCode is about developers. Our powerful development tools such as Playground help you test, debug and even write your own projects online.
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                {['JavaScript', 'Python', 'Java', 'C++', 'Go', 'Rust'].map((lang, i) => (
                  <div key={i} className="px-4 py-2 bg-[#282c34] border border-border rounded-lg">
                    {lang}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1">
              {/* Placeholder for Developer image */}
              <div className="bg-[#282c34] rounded-3xl p-12 shadow-2xl flex items-center justify-center min-h-[300px]">
                <div className="text-6xl">👨‍💻</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-[#282c34] border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="text-lg text-[#9da0a5] mb-4">Made with ❤️ in SF</div>
            <p className="text-[#9da0a5] mb-8 max-w-2xl mx-auto">
              At LeetCode, our mission is to help you improve yourself and land your dream job. We have a sizable repository of interview resources for many companies. In the past few years, our users have landed jobs at top companies around the world.
            </p>
            <p className="text-[#9da0a5] mb-8">
              If you are passionate about tackling some of the most interesting problems around, we would love to hear from you.
            </p>
            <Link
              href="/careers"
              className="inline-block px-8 py-3 bg-[#2a9d8f] hover:bg-[#238678] rounded-full text-white font-medium transition-all transform hover:scale-105"
            >
              Join Our Team
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
