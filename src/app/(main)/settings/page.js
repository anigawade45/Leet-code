import { SettingsClient } from './SettingsClient'

export const metadata = {
  title: 'Settings - LeetCode',
}

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <SettingsClient />
    </div>
  )
}
