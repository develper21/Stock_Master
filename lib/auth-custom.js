import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export async function hashPassword(password) {
  return await bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function authenticateUser(loginId, password) {
  const supabase = getSupabaseServiceClient();

  // Find user by login_id
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('login_id', loginId)
    .single();

  if (error || !profile) {
    throw new Error('Invalid credentials');
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, profile.password_hash);
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  // Check email verification
  if (!profile.email_verified) {
    throw new Error('Please verify your email address before logging in. Check your inbox for the verification email.');
  }

  // Generate JWT token
  const token = generateToken({
    id: profile.id,
    login_id: profile.login_id,
    email: profile.email,
    role: profile.role,
    default_warehouse_id: profile.default_warehouse_id,
    email_verified: profile.email_verified
  });

  return {
    user: {
      id: profile.id,
      login_id: profile.login_id,
      full_name: profile.full_name,
      email: profile.email,
      role: profile.role,
      default_warehouse_id: profile.default_warehouse_id,
      email_verified: profile.email_verified
    },
    token
  };
}

export async function createUser(userData) {
  const supabase = getSupabaseServiceClient();

  // Hash password
  const passwordHash = await hashPassword(userData.password);

  // Create user in profiles table
  const { data: profile, error } = await supabase
    .from('profiles')
    .insert({
      login_id: userData.login_id,
      full_name: userData.full_name,
      email: userData.email,
      phone: userData.phone,
      password_hash: passwordHash,
      role: userData.role || 'warehouse_staff',
      default_warehouse_id: userData.default_warehouse_id
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return profile;
}

export async function getUserById(userId) {
  const supabase = getSupabaseServiceClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, login_id, full_name, email, role, default_warehouse_id, email_verified, is_active')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    return null;
  }

  return profile;
}
