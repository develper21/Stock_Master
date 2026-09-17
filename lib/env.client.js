const requiredClientEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

for (const [key, value] of Object.entries(requiredClientEnv)) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const clientEnv = {
  supabaseUrl: requiredClientEnv.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: requiredClientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};
