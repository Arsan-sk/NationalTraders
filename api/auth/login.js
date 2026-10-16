import { checkCredentials, signToken } from '../_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse body if not parsed
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const { username, password } = body || {};

  if (!checkCredentials(username, password)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = signToken(username);
  const isSecure = process.env.NODE_ENV === 'production';
  const cookieStr = `nt_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}${isSecure ? '; Secure' : ''}`;

  res.setHeader('Set-Cookie', cookieStr);
  return res.status(200).json({
    ok: true,
    token,
    username
  });
}
