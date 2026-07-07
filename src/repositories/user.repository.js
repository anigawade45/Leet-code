import prisma from '@/lib/prisma'

export const UserRepository = {
  async create(data) {
    return prisma.user.create({ data })
  },

  async findByEmail(email) {
    return prisma.user.findUnique({ 
      where: { email },
      include: { userStreak: true }
    })
  },

  async findById(id) {
    return prisma.user.findUnique({ 
      where: { id },
      include: { userStreak: true }
    })
  },

  async findByUsername(username) {
    return prisma.user.findUnique({ 
      where: { username },
      include: { userStreak: true }
    })
  },

  async countAll() {
    return prisma.user.count()
  },

  async findByVerificationToken(token) {
    return prisma.user.findUnique({
      where: { verificationToken: token },
    })
  },

  async update(id, data) {
    return prisma.user.update({
      where: { id },
      data,
    })
  },
}
