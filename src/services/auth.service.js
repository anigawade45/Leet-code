import { UserRepository } from '@/repositories/user.repository'
import { hashPassword, comparePassword } from '@/lib/auth'
import { generateToken, verifyToken } from '@/lib/jwt'
import { v4 as uuidv4 } from 'uuid'
import { EmailService } from './email.service'

export const AuthService = {
  async register(data) {
    const existingUser = await UserRepository.findByEmail(data.email)
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    const existingUsername = await UserRepository.findByUsername(data.username)
    if (existingUsername) {
      throw new Error('Username already taken')
    }

    const verificationToken = uuidv4()
    const hashedPassword = await hashPassword(data.password)
    const user = await UserRepository.create({
      ...data,
      password: hashedPassword,
      verificationToken,
      isVerified: false,
    })

    // Send verification email asynchronously
    EmailService.sendVerificationEmail(user.email, verificationToken).catch((err) => {
      console.error('Failed to send verification email during registration', err)
    })

    // We do NOT generate a JWT token yet because the user needs to verify
    return { user, message: 'Registration successful. Please check your email to verify your account.' }
  },

  async login(emailOrUsername, password) {
    let user = await UserRepository.findByEmail(emailOrUsername)
    if (!user) {
      user = await UserRepository.findByUsername(emailOrUsername)
    }

    if (!user) {
      throw new Error('Invalid credentials')
    }

    const isPasswordValid = await comparePassword(password, user.password)
    if (!isPasswordValid) {
      throw new Error('Invalid credentials')
    }

    if (!user.isVerified) {
      throw new Error('Please verify your email before logging in.')
    }

    const token = generateToken({ userId: user.id, email: user.email, role: user.role })
    return { user, token }
  },

  async verifyEmail(token) {
    const user = await UserRepository.findByVerificationToken(token)
    if (!user) {
      throw new Error('Invalid or expired verification token')
    }

    await UserRepository.update(user.id, {
      isVerified: true,
      verificationToken: null,
    })

    return { success: true }
  },

  async verifyToken(token) {
    const payload = verifyToken(token)
    if (!payload) {
      return null
    }

    const user = await UserRepository.findById(payload.userId)
    return user
  },
}
