import prisma from '@/lib/prisma'

export const BadgeService = {
  async checkAndAwardBadges(userId) {
    try {
      // Get all badges the user ALREADY has
      const existingUserBadges = await prisma.userBadge.findMany({
        where: { userId },
        select: { badgeId: true }
      })
      const existingBadgeIds = new Set(existingUserBadges.map(ub => ub.badgeId))

      // Get ALL badges from the database
      const allBadges = await prisma.badge.findMany()

      // Calculate user statistics
      // 1. Streak
      const userStreak = await prisma.userStreak.findUnique({
        where: { userId }
      })
      const maxStreak = userStreak ? Math.max(userStreak.currentStreak, userStreak.longestStreak) : 0

      // 2. Solved Problems (Unique)
      const acceptedSubmissions = await prisma.submission.findMany({
        where: { userId, status: 'ACCEPTED' },
        select: { problemId: true },
        distinct: ['problemId']
      })
      const uniqueSolvedCount = acceptedSubmissions.length
      const solvedProblemIds = acceptedSubmissions.map(s => s.problemId)

      // 3. Difficulty Breakdown
      const solvedProblems = await prisma.problem.findMany({
        where: {
          id: { in: solvedProblemIds }
        },
        select: { difficulty: true }
      })
      
      const difficultyCounts = {
        EASY: 0,
        MEDIUM: 0,
        HARD: 0
      }
      for (const p of solvedProblems) {
        difficultyCounts[p.difficulty]++
      }

      const newlyUnlocked = []

      // Evaluate Rules
      for (const badge of allBadges) {
        if (existingBadgeIds.has(badge.id)) continue

        let isEarned = false

        switch (badge.category) {
          case 'BEGINNER':
            if (badge.name === 'Welcome') isEarned = true
            if (badge.name === 'First Solve' && uniqueSolvedCount >= 1) isEarned = true
            // Explorer and First Submission logic is omitted for brevity (fallback to First Solve)
            break
            
          case 'SOLVING':
            if (uniqueSolvedCount >= badge.requirement) isEarned = true
            break
            
          case 'DIFFICULTY':
            if (badge.name.includes('Easy') && difficultyCounts.EASY >= badge.requirement) isEarned = true
            if (badge.name.includes('Medium') && difficultyCounts.MEDIUM >= badge.requirement) isEarned = true
            if (badge.name.includes('Hard') && difficultyCounts.HARD >= badge.requirement) isEarned = true
            break
            
          case 'STREAK':
            if (maxStreak >= badge.requirement) isEarned = true
            break
            
          // Advanced Company/Community logic would go here
          // We default to false for unsupported advanced badges in this simple implementation
        }

        if (isEarned) {
          // Award the badge
          await prisma.userBadge.create({
            data: {
              userId,
              badgeId: badge.id
            }
          })
          newlyUnlocked.push(badge)
          
          const { NotificationService } = await import('./notification.service.js')
          await NotificationService.addNotification(
            userId,
            'New Badge Earned!',
            `You earned the ${badge.name} badge.`,
            'success',
            `/u/${userId}` // Assume link to profile
          )
        }
      }

      return newlyUnlocked
    } catch (error) {
      console.error('Failed to evaluate badges:', error)
      return []
    }
  }
}
