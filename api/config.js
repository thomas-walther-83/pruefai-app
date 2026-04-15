export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    supabaseUrl:      process.env.SUPABASE_URL              || '',
    supabaseKey:      process.env.SUPABASE_ANON_KEY         || '',
    serviceRoleKey:   process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    schoolName:       process.env.SCHOOL_NAME               || '',
  });
}
