import crypto from 'crypto';

// In Vercel or local dev, process.env has these variables
const getEnv = () => ({
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin_national_2026',
  secret: process.env.ADMIN_SESSION_SECRET || 'national_trader_secure_session_secret_2026',
  supabaseUrl: process.env.VITE_SUPABASE_URL || 'https://mwzzrtlajtnmramuboho.supabase.co',
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  anonKey: process.env.VITE_SUPABASE_ANON_KEY || ''
});

export function signToken(username) {
  const { secret } = getEnv();
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days
  const data = `${username}:${expiresAt}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return `${data}:${sig}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split(':');
  if (parts.length !== 3) return null;
  const [username, expiresStr, sig] = parts;
  const expiresAt = Number(expiresStr);
  if (!username || isNaN(expiresAt) || expiresAt < Date.now()) return null;

  const { secret, username: expectedUsername } = getEnv();
  if (username !== expectedUsername) return null;

  const expectedSig = crypto.createHmac('sha256', secret).update(`${username}:${expiresStr}`).digest('hex');
  if (crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
    return { username, expiresAt };
  }
  return null;
}

export function getSessionFromRequest(req) {
  // Check Authorization header first
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const session = verifyToken(token);
    if (session) return session;
  }

  // Check Cookie header
  const cookieHeader = req.headers['cookie'] || req.headers['Cookie'];
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [k, ...v] = c.trim().split('=');
        return [k, decodeURIComponent(v.join('='))];
      })
    );
    if (cookies['nt_session']) {
      const session = verifyToken(cookies['nt_session']);
      if (session) return session;
    }
  }

  return null;
}

export function checkCredentials(user, pass) {
  const { username, password } = getEnv();
  if (!user || !pass) return false;
  return user === username && pass === password;
}

export function getSupabaseConfig() {
  return getEnv();
}
