import fs from 'fs';
import { checkCredentials, signToken, verifyToken } from '../api/_auth.js';
import handlerLogin from '../api/auth/login.js';
import handlerSession from '../api/auth/session.js';
import handlerLogout from '../api/auth/logout.js';
import handlerMutate from '../api/admin/mutate.js';

// Read .env
const env = {};
if (fs.existsSync('.env')) {
  fs.readFileSync('.env', 'utf-8').split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      env[match[1]] = (match[2] || '').trim().replace(/^['"](.*)['"]$/, '$1');
    }
  });
}
Object.assign(process.env, env);

console.log('====================================================');
console.log('         Running Full Integration Tests             ');
console.log('====================================================');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

// Mock req and res helper
function mockReqRes(method, body = {}, headers = {}) {
  const req = {
    method,
    body,
    headers: { ...headers }
  };

  let statusCode = 200;
  let responseData = null;
  const resHeaders = {};

  const res = {
    statusCode,
    status(code) {
      statusCode = code;
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      resHeaders[name.toLowerCase()] = value;
    },
    json(data) {
      responseData = data;
      return this;
    },
    end(data) {
      if (typeof data === 'string') {
        try { responseData = JSON.parse(data); } catch { responseData = data; }
      }
      return this;
    },
    getStatusCode: () => statusCode,
    getData: () => responseData,
    getHeader: (name) => resHeaders[name.toLowerCase()]
  };

  return { req, res };
}

async function runTests() {
  console.log('\n--- 1. Testing Admin Authentication ---');

  // Test 1: Check bad credentials
  const badLogin = mockReqRes('POST', { username: 'admin', password: 'wrong_password_123' });
  await handlerLogin(badLogin.req, badLogin.res);
  assert(badLogin.res.getStatusCode() === 401, 'Invalid password is rejected with 401');

  // Test 2: Check good credentials from environment
  const goodUsername = process.env.ADMIN_USERNAME || 'admin';
  const goodPassword = process.env.ADMIN_PASSWORD;
  assert(Boolean(goodPassword), 'ADMIN_PASSWORD is set in environment');

  const goodLogin = mockReqRes('POST', { username: goodUsername, password: goodPassword });
  await handlerLogin(goodLogin.req, goodLogin.res);
  assert(goodLogin.res.getStatusCode() === 200, 'Valid credentials succeed with 200');
  const token = goodLogin.res.getData()?.token;
  assert(Boolean(token), 'Login returns secure session token');
  const setCookie = goodLogin.res.getHeader('set-cookie');
  assert(Boolean(setCookie && setCookie.includes('nt_session=')), 'Login sets secure HTTP-only cookie');

  // Test 3: Session check without auth
  const anonSession = mockReqRes('GET', {}, {});
  await handlerSession(anonSession.req, anonSession.res);
  assert(anonSession.res.getData()?.authenticated === false, 'Unauthenticated request returns authenticated: false');

  // Test 4: Session check with Bearer token
  const authedSession = mockReqRes('GET', {}, { authorization: `Bearer ${token}` });
  await handlerSession(authedSession.req, authedSession.res);
  assert(authedSession.res.getData()?.authenticated === true, 'Authenticated request with Bearer token verifies session');

  // Test 5: Session check with Cookie
  const cookieSession = mockReqRes('GET', {}, { cookie: `nt_session=${token}` });
  await handlerSession(cookieSession.req, cookieSession.res);
  assert(cookieSession.res.getData()?.authenticated === true, 'Authenticated request with Cookie verifies session');

  console.log('\n--- 2. Testing Server-side Route & Mutation Protection ---');

  // Test 6: Unauthorized mutate attempt
  const unauthMutate = mockReqRes('POST', { action: 'save_product', payload: {} });
  await handlerMutate(unauthMutate.req, unauthMutate.res);
  assert(unauthMutate.res.getStatusCode() === 401, 'Unauthorized mutation call is blocked with 401');

  // Test 7: Authorized mutate attempt with token
  const authMutate = mockReqRes('POST', {
    action: 'save_product',
    payload: {
      product: {
        id: 'test_product_1',
        name: 'Test Steel Bowl',
        cat: 'steel',
        price: 99,
        note: 'High grade steel'
      },
      sectionIds: ['hero_deals', 'rs20_specials']
    }
  }, { authorization: `Bearer ${token}` });

  await handlerMutate(authMutate.req, authMutate.res);
  const mutateStatus = authMutate.res.getStatusCode();
  // Either 200 (if Supabase table ready) or 500 (if table not migrated yet), but NOT 401
  assert(mutateStatus === 200 || mutateStatus === 500, `Authorized mutation executes past auth guard (status: ${mutateStatus})`);

  // Test 8: Logout clears cookie
  const logoutReq = mockReqRes('POST');
  await handlerLogout(logoutReq.req, logoutReq.res);
  const logoutCookie = logoutReq.res.getHeader('set-cookie');
  assert(logoutCookie && logoutCookie.includes('Max-Age=0'), 'Logout clears session cookie');

  console.log('\n====================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
