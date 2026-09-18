import crypto from 'crypto';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';
import { sendPasswordResetEmail } from '@/lib/email-service';
import { hashPassword } from './auth-custom';

export function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

export async function createPasswordResetToken(email) {
  const supabase = getSupabaseServiceClient();
  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

  // Delete any existing tokens for this email
  await supabase
    .from('password_reset_tokens')
    .delete()
    .eq('email', email);

  // Create new token
  const { error } = await supabase
    .from('password_reset_tokens')
    .insert({
      email,
      token,
      expires_at: expiresAt.toISOString(),
    });

  if (error) {
    throw new Error('Failed to create reset token');
  }

  return token;
}

export async function validateResetToken(token) {
  const supabase = getSupabaseServiceClient();

  const { data: resetToken, error } = await supabase
    .from('password_reset_tokens')
    .select('*')
    .eq('token', token)
    .eq('used', false)
    .single();

  if (error || !resetToken) {
    return null;
  }

  // Check if token has expired
  if (new Date() > new Date(resetToken.expires_at)) {
    return null;
  }

  return resetToken;
}

export async function resetPassword(token, newPassword) {
  const supabase = getSupabaseServiceClient();

  // Validate token
  const resetToken = await validateResetToken(token);
  if (!resetToken) {
    throw new Error('Invalid or expired reset token');
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update user password
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ 
      password_hash: passwordHash,
      updated_at: new Date().toISOString()
    })
    .eq('email', resetToken.email);

  if (updateError) {
    throw new Error('Failed to update password');
  }

  // Mark token as used
  await supabase
    .from('password_reset_tokens')
    .update({ used: true })
    .eq('token', token);

  return true;
}

export async function requestPasswordReset(email) {
  const supabase = getSupabaseServiceClient();

  // Check if user exists
  const { data: user, error } = await supabase
    .from('profiles')
    .select('email')
    .eq('email', email)
    .single();

  if (error || !user) {
    // Don't reveal if email exists or not for security
    return { success: true, message: 'If an account with this email exists, a password reset link has been sent.' };
  }

  try {
    const token = await createPasswordResetToken(email);
    const emailSent = await sendPasswordResetEmail(email, token);
    
    if (!emailSent) {
      throw new Error('Failed to send reset email');
    }

    return { success: true, message: 'Password reset link has been sent to your email.' };
  } catch (error) {
    console.error('Password reset request failed:', error);
    throw new Error('Failed to process password reset request');
  }
}
