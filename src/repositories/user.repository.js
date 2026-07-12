import prisma from '@/lib/prisma'

// Fields safe to return to the application layer for authenticated operations.
// Password is only fetched when explicitly needed for credential verification.
const USER_SAFE_SELECT = {
  id: true,
  username: true,
  email: true,
  avatar: true,
  role: true,
  isVerified: true,
  verificationToken: true,
  usernameUpdatedAt: true,
  hideFollowingList: true,
  hideFollowerList: true,
  leetCoins: true,
  createdAt: true,
  updatedAt: true,
}

export const UserRepository = {
  async create(data) {
    return prisma.user.create({ data })
  },

  /**
   * Find by email — includes password for credential verification only.
   * Do NOT spread this result into API responses.
   */
  async findByEmailWithPassword(email) {
    return prisma.user.findUnique({
      where: { email },
      include: { userStreak: true },
    })
  },

  /**
   * Find by username — includes password for credential verification only.
   * Do NOT spread this result into API responses.
   */
  async findByUsernameWithPassword(username) {
    return prisma.user.findUnique({
      where: { username },
      include: { userStreak: true },
    })
  },

  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      select: { ...USER_SAFE_SELECT, userStreak: true },
    })
  },

  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: { ...USER_SAFE_SELECT, userStreak: true },
    })
  },

  async findByUsername(username) {
    return prisma.user.findUnique({
      where: { username },
      select: { ...USER_SAFE_SELECT, userStreak: true },
    })
  },

  async countAll() {
    return prisma.user.count()
  },

  async findByVerificationToken(token) {
    return prisma.user.findUnique({
      where: { verificationToken: token },
      select: { ...USER_SAFE_SELECT },
    })
  },

  async update(id, data) {
    return prisma.user.update({
      where: { id },
      data,
    })
  },
}
