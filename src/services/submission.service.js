import { SubmissionRepository } from '@/repositories/submission.repository'

export const SubmissionService = {
  async submitCode(data) {
    return SubmissionRepository.create({
      ...data,
      status: 'PENDING',
    })
  },

  async getUserSubmissions(userId, page = 1, limit = 20) {
    return SubmissionRepository.findByUserId(userId, page, limit)
  },

  async getUserSubmissionsForProblem(userId, problemId, page = 1, limit = 20) {
    return SubmissionRepository.findByUserAndProblem(userId, problemId, page, limit)
  },

  async getSubmissionById(id) {
    return SubmissionRepository.findById(id)
  },

  async updateSubmission(id, data) {
    return SubmissionRepository.update(id, data)
  },
}
