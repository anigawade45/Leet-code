import prisma from '@/lib/prisma'

export const PointValues = {
  DAILY_CHECKIN: 1,
  THIRTY_DAY_STREAK: 30,
  DAILY_CHALLENGE: 10,
  CONTEST_PARTICIPATION: 5,
  WEEKLY_BIWEEKLY_CONTESTS: 35,
  TEST_CASE_CONTRIBUTION: 100,
  PROBLEM_ACCEPTED: 1000
}

/**
 * Awards LeetCoins to a user and logs the transaction.
 * @param {string} userId - The user's ID
 * @param {string} title - The description of the points transaction
 * @param {number} amount - The amount of LeetCoins to award
 */
export async function awardPoints(userId, title, amount) {
  try {
    // We use a transaction to ensure both operations succeed or fail together
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { leetCoins: { increment: amount } }
      }),
      prisma.pointsTransaction.create({
        data: {
          userId,
          title,
          amount
        }
      })
    ])
    return { success: true }
  } catch (error) {
    console.error('Failed to award points:', error)
    return { success: false, error }
  }
}
