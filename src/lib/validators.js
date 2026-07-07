import { z } from 'zod'

export const registerSchema = z
  .object({
    username: z.string().trim().min(3, 'Username must be at least 3 characters').max(20, 'Username must be at most 20 characters').regex(/^\S+$/, 'Username cannot contain spaces'),
    email: z.string().trim().toLowerCase().email('Invalid email address'),
    password: z.string().min(8, 'Must be at least 8 characters').max(128, 'Password must be at most 128 characters').regex(/[A-Z]/, 'Must contain uppercase').regex(/[a-z]/, 'Must contain lowercase').regex(/[0-9]/, 'Must contain number').regex(/[!@#$%^&*]/, 'Must contain special character'),
    confirmPassword: z.string().min(8, 'Must be at least 8 characters').max(128),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Username or email is required').max(50, 'Identifier is too long'),
  password: z.string().min(1, 'Password is required').max(128, 'Password is too long'),
})

export const problemSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  category: z.enum(['ALGORITHMS', 'DATABASE', 'SHELL', 'CONCURRENCY', 'JAVASCRIPT', 'PANDAS']).optional(),
  constraints: z.string().optional(),
  timeLimit: z.number().positive().default(2000),
  memoryLimit: z.number().positive().default(256),
  starterCode: z.record(z.string()).optional(),
  solutionCode: z.record(z.string()).optional(),
  examples: z.array(z.object({
    input: z.string().optional(),
    output: z.string().optional(),
    explanation: z.string().optional(),
    image: z.string().optional(),
    img: z.string().optional(),
  })).optional(),
  hints: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
  companyIds: z.array(z.string()).optional(),
  editorialApproaches: z.array(z.object({
    title: z.string().optional(),
    algorithm: z.string().optional(),
    implementation: z.string().optional(),
    timeComplexity: z.string().optional(),
    spaceComplexity: z.string().optional(),
  })).optional(),
  testCases: z.array(z.object({
    input: z.string().min(1, 'Input is required'),
    output: z.string().min(1, 'Output is required'),
    isHidden: z.boolean().default(false)
  })).min(1, 'At least one test case is required')
})

export const contestSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED']).optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'MIXED']).optional(),
  registrationOpens: z.string().datetime().nullable().optional(),
  registrationCloses: z.string().datetime().nullable().optional(),
  maxParticipants: z.number().int().positive().nullable().optional(),
  problemIds: z.array(z.string()).min(1, 'At least one problem is required'),
  showLiveLeaderboard: z.boolean().optional(),
  freezeLeaderboard: z.boolean().optional(),
  allowPractice: z.boolean().optional(),
  showEditorial: z.boolean().optional(),
  allowLateRegistration: z.boolean().optional(),
  enableDiscussion: z.boolean().optional()
})

export const submissionSchema = z.object({
  problemId: z.string().uuid('Invalid problem ID'),
  language: z.string().min(1, 'Language is required'),
  code: z.string().min(1, 'Code is required'),
  contestId: z.string().uuid().optional(),
  customTestCases: z.array(z.object({
    input: z.string(),
    expected: z.string().optional()
  })).optional()
})

export const discussionSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  content: z.string().min(1, 'Content is required')
})

export const replySchema = z.object({
  content: z.string().min(1, 'Content is required')
})

export const executeSchema = z.object({
  language: z.string().min(1, 'Language is required'),
  code: z.string().min(1, 'Code is required').max(20000, 'Code is too long'),
  problemId: z.string().uuid('Invalid problem ID').optional(),
  input: z.string().max(5000, 'Input is too long').optional(),
  customTestCases: z.array(z.object({
    input: z.string().max(5000, 'Custom input is too long'),
    expected: z.string().max(5000, 'Expected output is too long').optional()
  })).optional(),
})
