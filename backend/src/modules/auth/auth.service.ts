// ============================================================================
// modules/auth/auth.service.ts  — BA owns
// Business logic: register, login (bcrypt + JWT), me
// ============================================================================

import bcrypt from 'bcryptjs';
import prisma from '../../lib/prisma';
import { signToken } from '../../lib/jwt';
import { ConflictError, ValidationError, NotFoundError } from '../../middleware/error';

type Role = 'FLEET_MANAGER' | 'DRIVER' | 'SAFETY_OFFICER' | 'FINANCIAL_ANALYST';

// ---- Register ----
export async function register(data: {
  email: string;
  password: string;
  name: string;
  role: Role;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new ConflictError('Email already registered');

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      role: data.role,
    },
  });

  const token = signToken({ userId: user.id, role: user.role });
  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}

// ---- Login ----
export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ValidationError('Invalid credentials');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new ValidationError('Invalid credentials');

  const token = signToken({ userId: user.id, role: user.role });
  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}

// ---- Me ----
export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  if (!user) throw new NotFoundError('User not found');
  return user;
}
