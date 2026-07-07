import prisma from '@/lib/prisma'

export const StreakService = {
  async updateStreak(userId, problemId) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if this problem is today's daily challenge
    const dailyChallenge = await prisma.dailyChallenge.findUnique({
      where: { date: today }
    })

    // If it's not today's daily challenge, do not update streak
    if (!dailyChallenge || dailyChallenge.problemId !== problemId) {
      return
    }

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const userStreak = await prisma.userStreak.findUnique({
      where: { userId }
    })

    if (!userStreak) {
      // First time solving a problem
      return prisma.userStreak.create({
        data: {
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastSolved: new Date()
        }
      })
    }

    const lastSolved = new Date(userStreak.lastSolved)
    lastSolved.setHours(0, 0, 0, 0)

    if (lastSolved.getTime() === today.getTime()) {
      // Already solved a problem today, do nothing
      return userStreak
    }

    let newCurrentStreak = 1
    if (lastSolved.getTime() === yesterday.getTime()) {
      // Solved yesterday, increment streak
      newCurrentStreak = userStreak.currentStreak + 1
    }

    const newLongestStreak = Math.max(userStreak.longestStreak, newCurrentStreak)

    const updatedStreak = await prisma.userStreak.update({
      where: { userId },
      data: {
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastSolved: new Date()
      }
    })

    if (newCurrentStreak > 0 && newCurrentStreak % 7 === 0) {
      const { NotificationService } = await import('./notification.service.js')
      await NotificationService.addNotification(
        userId,
        'Streak Milestone!',
        `You've reached a ${newCurrentStreak}-day streak! Keep the fire burning 🔥`,
        'success',
        `/u/${userId}`
      )
    }

    return updatedStreak
  }
}
