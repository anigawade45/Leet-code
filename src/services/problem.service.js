import { ProblemRepository, TagRepository } from '@/repositories/problem.repository'
import { UserRepository } from '@/repositories/user.repository'

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export const ProblemService = {
  async createProblem(data, authorId) {
    const slug = generateSlug(data.title)

    // Check if slug already exists
    const existing = await ProblemRepository.findBySlug(slug)
    if (existing) {
      throw new Error('Problem with this title already exists')
    }

    // Check if the author is an admin — auto-approve if so
    const author = await UserRepository.findById(authorId)
    const isAdmin = author?.role === 'ADMIN'

    const problemData = {
      title: data.title,
      slug,
      description: data.description,
      difficulty: data.difficulty,
      category: data.category || 'ALGORITHMS',
      constraints: data.constraints,
      examples: data.examples,
      starterCode: data.starterCode,
      solutionCode: data.solutionCode || {},
      createdBy: authorId,
      status: isAdmin ? 'APPROVED' : 'PENDING',
      tagIds: data.tagIds || [],
      companyIds: data.companyIds || [],
      hints: data.hints || [],
      editorialApproaches: data.editorialApproaches || [],
      ...(data.testCases && data.testCases.length > 0
        ? {
            testCases: data.testCases.map((tc) => ({
              input: tc.input,
              output: tc.output,
              isHidden: tc.isHidden || false,
            })),
          }
        : {}),
    }

    const problem = await ProblemRepository.create(problemData)
    return problem
  },

  // Regular users: only see APPROVED problems
  async getAllProblems(filters = {}) {
    return ProblemRepository.findAll({ ...filters, status: 'APPROVED' })
  },

  async getProblemBySlug(slug) {
    const problem = await ProblemRepository.findBySlug(slug)
    if (!problem) {
      throw new Error('Problem not found')
    }
    const stats = await ProblemRepository.getStats(problem.id)
    return { ...problem, stats }
  },

  async getProblemById(id) {
    if (!id) return null
    return ProblemRepository.findById(id)
  },

  async getProblemEngagement(slug, userId = null) {
    const problem = await ProblemRepository.findBySlug(slug)
    if (!problem) {
      throw new Error('Problem not found')
    }

    return ProblemRepository.getEngagement(problem.id, userId)
  },

  async setProblemReaction(slug, userId, type) {
    const problem = await ProblemRepository.findBySlug(slug)
    if (!problem) {
      throw new Error('Problem not found')
    }

    await ProblemRepository.setReaction(problem.id, userId, type)
    return ProblemRepository.getEngagement(problem.id, userId)
  },

  async touchProblemPresence(slug, userId, sessionId) {
    const problem = await ProblemRepository.findBySlug(slug)
    if (!problem) {
      throw new Error('Problem not found')
    }

    await ProblemRepository.touchPresence(problem.id, userId, sessionId)
    return ProblemRepository.getEngagement(problem.id, userId)
  },

  async updateProblem(id, data, authorId) {
    const problem = await ProblemRepository.findById(id)
    if (!problem) {
      throw new Error('Problem not found')
    }
    if (problem.createdBy !== authorId) {
      throw new Error('Not authorized to update this problem')
    }

    let slug = problem.slug
    if (data.title && data.title !== problem.title) {
      slug = generateSlug(data.title)
      const existing = await ProblemRepository.findBySlug(slug)
      if (existing && existing.id !== id) {
        throw new Error('Problem with this title already exists')
      }
    }

    const updateData = { ...data, slug }
    return ProblemRepository.update(id, updateData)
  },

  async deleteProblem(id, authorId) {
    const problem = await ProblemRepository.findById(id)
    if (!problem) {
      throw new Error('Problem not found')
    }
    const author = await UserRepository.findById(authorId)
    const isAdmin = author?.role === 'ADMIN'
    if (problem.createdBy !== authorId && !isAdmin) {
      throw new Error('Not authorized to delete this problem')
    }
    return ProblemRepository.delete(id)
  },

  // ===== Admin-only methods =====

  // Get all problems regardless of status (admin view)
  async getAllProblemsAdmin(filters = {}) {
    return ProblemRepository.findAll(filters)
  },

  // Approve a pending problem
  async approveProblem(id) {
    const problem = await ProblemRepository.findById(id)
    if (!problem) {
      throw new Error('Problem not found')
    }
    return ProblemRepository.update(id, { status: 'APPROVED' })
  },

  // Reject a pending problem
  async rejectProblem(id) {
    const problem = await ProblemRepository.findById(id)
    if (!problem) {
      throw new Error('Problem not found')
    }
    return ProblemRepository.update(id, { status: 'REJECTED' })
  },

  // Get dashboard stats
  async getStats() {
    const [problemStats, totalUsers] = await Promise.all([
      ProblemRepository.countByStatus(),
      UserRepository.countAll(),
    ])
    return {
      ...problemStats,
      totalUsers,
    }
  },

  // ===== Tags =====
  async getAllTags() {
    return TagRepository.findAll()
  },
}
