import { PointsClient } from './PointsClient'

export const metadata = {
  title: 'Points - LeetCode',
}

export default function PointsPage() {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#1a1a1a]">
      <PointsClient />
    </div>
  )
}
