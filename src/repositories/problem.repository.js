import prisma from '@/lib/prisma'

const PROBLEM_INCLUDES = {
  author: { select: { id: true, username: true } },
  tags: {
    include: { tag: { select: { id: true, name: true } } },
  },
  companies: {
    include: { company: { select: { id: true, name: true } } },
  },
  editorial: true,
  _count: { select: { submissions: true } },
  submissions: { select: { status: true, userId: true } }
}

export const ProblemRepository = {
  async create(data) {
    const { testCases, tagIds, companyIds, editorialApproaches, hints, ...problemData } = data
    return prisma.problem.create({
      data: {
        ...problemData,
        hints: hints || [],
        ...(testCases && testCases.length > 0
          ? { testCases: { create: testCases } }
          : {}),
        ...(tagIds && tagIds.length > 0
          ? { tags: { create: tagIds.map((tagId) => ({ tagId })) } }
          : {}),
        ...(companyIds && companyIds.length > 0
          ? { companies: { create: companyIds.map((companyId) => ({ companyId })) } }
          : {}),
        ...(editorialApproaches && editorialApproaches.length > 0
          ? { editorial: { create: { approaches: editorialApproaches } } }
          : {}),
      },
      include: {
        author: { select: { id: true, username: true } },
        testCases: true,
        tags: { include: { tag: { select: { id: true, name: true } } } },
        companies: { include: { company: { select: { id: true, name: true } } } },
        editorial: true,
      },
    })
  },

  async findAll(filters = {}) {
    const { 
      status, 
      difficulty, difficultyOp, 
      category,
      tagIds, tagsOp,
      companyIds, companiesOp, 
      search, 
      matchType = 'all',
      sortBy = 'problemNumber', sortOrder = 'asc' 
    } = filters

    const baseWhere = {}
    if (status) baseWhere.status = status
    if (category) baseWhere.category = category.toUpperCase()
    if (search) baseWhere.title = { contains: search, mode: 'insensitive' }

    const conditions = []

    if (difficulty) {
      if (difficultyOp === 'is_not') {
        conditions.push({ difficulty: { not: difficulty } })
      } else {
        conditions.push({ difficulty })
      }
    }

    if (tagIds && tagIds.length > 0) {
      if (tagsOp === 'is_not') {
        conditions.push({ tags: { none: { tagId: { in: tagIds } } } })
      } else {
        conditions.push({ tags: { some: { tagId: { in: tagIds } } } })
      }
    }

    if (companyIds && companyIds.length > 0) {
      if (companiesOp === 'is_not') {
        conditions.push({ companies: { none: { companyId: { in: companyIds } } } })
      } else {
        conditions.push({ companies: { some: { companyId: { in: companyIds } } } })
      }
    }

    const where = { ...baseWhere }
    if (conditions.length > 0) {
      if (matchType === 'any') {
        where.OR = conditions
      } else {
        where.AND = conditions
      }
    }

    const orderBy = (() => {
      if (sortBy === 'submissions') return { submissions: { _count: sortOrder } }
      if (sortBy === 'difficulty') {
        // Map difficulty to sortable order: EASY < MEDIUM < HARD
        return { difficulty: sortOrder }
      }
      if (sortBy === 'createdAt') return { createdAt: sortOrder }
      return { problemNumber: sortOrder }
    })()

    const page = filters.page ? parseInt(filters.page, 10) : 1
    const limit = filters.limit ? parseInt(filters.limit, 10) : 20
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      prisma.problem.findMany({
        where,
        include: PROBLEM_INCLUDES,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.problem.count({ where })
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
    return prisma.problem.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, username: true } },
        testCases: true,
        tags: { include: { tag: { select: { id: true, name: true } } } },
        editorial: true,
      },
    })
  },

  async findBySlug(slug) {
    return prisma.problem.findUnique({
      where: { slug },
      include: {
        author: { select: { id: true, username: true } },
        testCases: true,
        tags: { include: { tag: { select: { id: true, name: true } } } },
        companies: { include: { company: { select: { id: true, name: true } } } },
        editorial: true,
        _count: { select: { discussions: { where: { parentId: null } } } }
      },
    })
  },
  async getStats(problemId) {
    const [total, accepted] = await prisma.$transaction([
      prisma.submission.count({ where: { problemId } }),
      prisma.submission.count({ where: { problemId, status: 'ACCEPTED' } })
    ])
    return { total, accepted }
  },

  async getEngagement(problemId, userId = null) {
    const activeSince = new Date(Date.now() - 60 * 1000)
    const [likes, dislikes, activePresence, viewerReaction] = await prisma.$transaction([
      prisma.problemReaction.count({ where: { problemId, type: 'LIKE' } }),
      prisma.problemReaction.count({ where: { problemId, type: 'DISLIKE' } }),
      prisma.problemPresence.groupBy({
        by: ['userId'],
        where: {
          problemId,
          lastSeenAt: { gte: activeSince },
        },
      }),
      userId
        ? prisma.problemReaction.findUnique({
            where: { userId_problemId: { userId, problemId } },
            select: { type: true },
          })
        : prisma.problemReaction.findFirst({
            where: { id: 'non-existent' },
            select: { type: true }
          }),
    ])

    return {
      likes,
      dislikes,
      currentSolving: activePresence.length,
      userReaction: viewerReaction?.type || null,
    }
  },

  async setReaction(problemId, userId, type) {
    const existing = await prisma.problemReaction.findUnique({
      where: { userId_problemId: { userId, problemId } },
      select: { type: true },
    })

    if (existing?.type === type) {
      await prisma.problemReaction.delete({
        where: { userId_problemId: { userId, problemId } },
      })
      return null
    }

    const reaction = await prisma.problemReaction.upsert({
      where: { userId_problemId: { userId, problemId } },
      create: { userId, problemId, type },
      update: { type },
      select: { type: true },
    })

    return reaction.type
  },

  async touchPresence(problemId, userId, sessionId) {
    await prisma.problemPresence.upsert({
      where: {
        userId_problemId_sessionId: {
          userId,
          problemId,
          sessionId,
        },
      },
      create: {
        userId,
        problemId,
        sessionId,
        lastSeenAt: new Date(),
      },
      update: {
        lastSeenAt: new Date(),
      },
    })
  },

  async update(id, data) {
    const { tagIds, companyIds, testCases, editorialApproaches, hints, ...rest } = data
    const updatePayload = {}

    if (rest.title !== undefined) updatePayload.title = rest.title
    if (rest.slug !== undefined) updatePayload.slug = rest.slug
    if (rest.description !== undefined) updatePayload.description = rest.description
    if (rest.difficulty !== undefined) updatePayload.difficulty = rest.difficulty
    if (rest.category !== undefined) updatePayload.category = rest.category
    if (rest.constraints !== undefined) updatePayload.constraints = rest.constraints
    if (rest.examples !== undefined) updatePayload.examples = rest.examples
    if (rest.starterCode !== undefined) updatePayload.starterCode = rest.starterCode
    if (rest.solutionCode !== undefined) updatePayload.solutionCode = rest.solutionCode
    if (rest.status !== undefined) updatePayload.status = rest.status
    if (rest.createdBy !== undefined) updatePayload.createdBy = rest.createdBy
    if (hints !== undefined) updatePayload.hints = hints

    return prisma.$transaction(async (tx) => {
      if (testCases) {
        await tx.testCase.deleteMany({ where: { problemId: id } })
      }

      if (tagIds !== undefined) {
        await tx.problemTag.deleteMany({ where: { problemId: id } })
      }

      if (companyIds !== undefined) {
        await tx.problemCompany.deleteMany({ where: { problemId: id } })
      }

      return tx.problem.update({
        where: { id },
        data: {
          ...updatePayload,
          ...(testCases && testCases.length > 0
            ? {
                testCases: {
                  create: testCases.map((tc) => ({
                    input: tc.input,
                    output: tc.output,
                    isHidden: tc.isHidden || false,
                  })),
                },
              }
            : {}),
          ...(tagIds && tagIds.length > 0
            ? { tags: { create: tagIds.map((tagId) => ({ tagId })) } }
            : {}),
          ...(companyIds && companyIds.length > 0
            ? { companies: { create: companyIds.map((companyId) => ({ companyId })) } }
            : {}),
          ...(editorialApproaches
            ? { editorial: { upsert: { create: { approaches: editorialApproaches }, update: { approaches: editorialApproaches } } } }
            : {}),
        },
        include: {
          author: { select: { id: true, username: true } },
          testCases: true,
          tags: { include: { tag: { select: { id: true, name: true } } } },
          companies: { include: { company: { select: { id: true, name: true } } } },
          editorial: true,
        },
      })
    }, { timeout: 10000 })
  },

  async delete(id) {
    return prisma.$transaction([
      prisma.problemTag.deleteMany({ where: { problemId: id } }),
      prisma.testCase.deleteMany({ where: { problemId: id } }),
      prisma.submission.deleteMany({ where: { problemId: id } }),
      prisma.problem.delete({ where: { id } }),
    ])
  },

  async countByStatus() {
    const [total, pending, approved, rejected] = await Promise.all([
      prisma.problem.count(),
      prisma.problem.count({ where: { status: 'PENDING' } }),
      prisma.problem.count({ where: { status: 'APPROVED' } }),
      prisma.problem.count({ where: { status: 'REJECTED' } }),
    ])
    return { total, pending, approved, rejected }
  },
}

export const TagRepository = {
  async findAll() {
    return prisma.tag.findMany({
      include: {
        _count: { select: { problems: true } },
      },
      orderBy: { problems: { _count: 'desc' } },
    })
  },

  async findById(id) {
    return prisma.tag.findUnique({ where: { id } })
  },

  async findOrCreateMany(names) {
    const tags = []
    for (const name of names) {
      const tag = await prisma.tag.upsert({
        where: { name },
        create: { name },
        update: {},
      })
      tags.push(tag)
    }
    return tags
  },
}
