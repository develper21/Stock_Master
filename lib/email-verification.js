import crypto from 'crypto';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';
import { sendVerificationEmail } from './email-service';

export function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

export async function createEmailVerificationToken(email) {
  const supabase = getSupabaseServiceClient();
  const token = generateVerificationToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

  // Delete any existing tokens for this email
  await supabase
    .from('email_verification_tokens')
    .delete()
    .eq('email', email);

  // Create new token
  const { error } = await supabase
    .from('email_verification_tokens')
    .insert({
      email,
      token,
      expires_at: expiresAt.toISOString(),
    });

  if (error) {
    throw new Error('Failed to create verification token');
  }

  return token;
}

export async function validateVerificationToken(token) {
  const supabase = getSupabaseServiceClient();

  const { data: verificationToken, error } = await supabase
    .from('email_verification_tokens')
    .select('*')
    .eq('token', token)
    .eq('used', false)
    .single();

  if (error || !verificationToken) {
    return null;
  }

  // Check if token has expired
  if (new Date() > new Date(verificationToken.expires_at)) {
    return null;
  }

  return verificationToken;
}

export async function verifyEmail(token) {
  const supabase = getSupabaseServiceClient();

  // Validate token
  const verificationToken = await validateVerificationToken(token);
  if (!verificationToken) {
    throw new Error('Invalid or expired verification token');
  }

  // Update user's email verification status
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ 
      email_verified: true,
      updated_at: new Date().toISOString()
    })
    .eq('email', verificationToken.email);

  if (updateError) {
    throw new Error('Failed to verify email');
  }

  // Mark token as used
  await supabase
    .from('email_verification_tokens')
    .update({ used: true })
    .eq('token', token);

  return true;
}

export async function sendEmailVerification(email) {
  const supabase = getSupabaseServiceClient();

  // Check if user exists
  const { data: user, error } = await supabase
    .from('profiles')
    .select('email, email_verified')
    .eq('email', email)
    .single();

  if (error || !user) {
    // Don't reveal if email exists or not for security
    return { success: true, message: 'If an account with this email exists, a verification email has been sent.' };
  }

  if (user.email_verified) {
    return { success: true, message: 'Email is already verified.' };
  }

  try {
    const token = await createEmailVerificationToken(email);
    const emailSent = await sendVerificationEmail(email, token);
    
    if (!emailSent) {
      throw new Error('Failed to send verification email');
    }

    return { success: true, message: 'Verification email has been sent to your email address.' };
  } catch (error) {
    console.error('Email verification request failed:', error);
    throw new Error('Failed to process email verification request');
  }
}
