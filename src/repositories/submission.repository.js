import prisma from '@/lib/prisma'

export const SubmissionRepository = {
  async create(data) {
    return prisma.submission.create({ data })
  },

  async findByUserId(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit
    const where = { userId }
    const [data, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: { problem: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.submission.count({ where })
    ])

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrevious: page > 1
      }
    }
  },

  async findByUserAndProblem(userId, problemId, page = 1, limit = 20) {
    const skip = (page - 1) * limit
    const where = { userId, problemId }
    const [data, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.submission.count({ where })
    ])

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrevious: page > 1
      }
    }
  },

  async findById(id) {
    return prisma.submission.findUnique({
      where: { id },
      include: {
        problem: { include: { testCases: { where: { isHidden: false } } } },
        user: true,
      },
    })
  },

  async update(id, data) {
    return prisma.submission.update({ where: { id }, data })
  },
}
