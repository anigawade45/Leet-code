import Link from 'next/link'

export function Footer() {
  return (
    <div className="mt-12 pt-8 border-t border-border/50 flex flex-wrap gap-x-6 gap-y-3 text-[13px] text-muted-foreground px-2 font-medium">
      <span>Copyright © 2026 LeetCode</span>
      <Link href="#" className="hover:text-foreground transition-colors">Help Center</Link>
      <Link href="#" className="hover:text-foreground transition-colors">Bug Bounty</Link>
      <Link href="#" className="hover:text-foreground transition-colors">Assessment</Link>
      <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
      <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
    </div>
  )
}
