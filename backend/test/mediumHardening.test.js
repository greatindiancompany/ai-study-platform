import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import { stripAnswerKeys } from '../utils/answerKeys.js';
import { assertStrongPassword, sanitizeFileName } from '../utils/sanitizer.js';
import { assertRequiredSecrets, trustProxySetting } from '../utils/envGuard.js';
import { JWT_SIGN_OPTIONS, JWT_VERIFY_OPTIONS } from '../utils/jwtOptions.js';
import { isAllowedStudyUpload } from '../utils/uploadFilter.js';
import { securityHeaders } from '../middleware/securityHeaders.js';
import { generateCitation } from '../utils/citationFormatter.js';

const SECRET = 'j'.repeat(40);

function handlerNames(router, method, path) {
  const layer = router.stack.find((entry) => {
    return entry.route && entry.route.path === path && entry.route.methods[method];
  });
  assert.ok(layer, `missing ${method.toUpperCase()} ${path}`);
  return layer.route.stack.map((step) => step.handle.name);
}

test('shared quiz payloads drop answer keys', () => {
  const stripped = stripAnswerKeys([
    {
      id: 1,
      type: 'multiple_choice',
      question: 'Why?',
      options: ['A', 'B'],
      correct_answer: 'A',
      explanation: 'because',
    },
    {
      questionText: 'Explain',
      correctAnswer: 'the key',
      answerIndex: 2,
    },
  ]);
  assert.equal(stripped[0].correct_answer, undefined);
  assert.equal(stripped[0].explanation, undefined);
  assert.equal(stripped[0].question, 'Why?');
  assert.deepEqual(stripped[0].options, ['A', 'B']);
  assert.equal(stripped[1].correctAnswer, undefined);
  assert.equal(stripped[1].answerIndex, undefined);
  assert.equal(stripped[1].questionText, 'Explain');
});

test('signup passwords require a letter and a number', () => {
  assert.throws(() => assertStrongPassword('short1'), /between 8 and 72/);
  assert.throws(() => assertStrongPassword('longpassword'), /letter and a number/);
  assert.throws(() => assertStrongPassword('12345678'), /letter and a number/);
  assert.equal(assertStrongPassword('correcthorse1'), undefined);
});

test('required secrets fail closed on placeholders and missing service role', () => {
  const missing = assertRequiredSecrets({
    ANTHROPIC_API_KEY: 'sk-real',
    SUPABASE_URL: 'https://example.supabase.co',
    JWT_SECRET: SECRET,
  });
  assert.equal(missing.ok, false);
  assert.match(missing.reason, /SUPABASE_SERVICE_ROLE_KEY/);

  const placeholder = assertRequiredSecrets({
    ANTHROPIC_API_KEY: 'sk-real',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'your_supabase_service_role_key',
    JWT_SECRET: SECRET,
  });
  assert.equal(placeholder.ok, false);
  assert.match(placeholder.reason, /placeholder/i);

  const shortJwt = assertRequiredSecrets({
    ANTHROPIC_API_KEY: 'sk-real',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 's'.repeat(40),
    JWT_SECRET: 'too-short',
  });
  assert.equal(shortJwt.ok, false);

  const ok = assertRequiredSecrets({
    ANTHROPIC_API_KEY: 'sk-real',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 's'.repeat(40),
    JWT_SECRET: SECRET,
  });
  assert.equal(ok.ok, true);

  const shortServerSecret = assertRequiredSecrets({
    ANTHROPIC_API_KEY: 'sk-real',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 's'.repeat(40),
    JWT_SECRET: SECRET,
    AI_SERVER_SECRET: 'too-short',
  });
  assert.equal(shortServerSecret.ok, false);
});

test('trust proxy defaults off', () => {
  assert.equal(trustProxySetting(undefined), false);
  assert.equal(trustProxySetting(''), false);
  assert.equal(trustProxySetting('false'), false);
  assert.equal(trustProxySetting('true'), 1);
  assert.equal(trustProxySetting('2'), 2);
  assert.throws(() => trustProxySetting('99'), /1 and 5/);
});

test('JWT verify is pinned to HS256', () => {
  assert.deepEqual(JWT_VERIFY_OPTIONS.algorithms, ['HS256']);
  assert.equal(JWT_SIGN_OPTIONS.algorithm, 'HS256');
  assert.equal(JWT_SIGN_OPTIONS.expiresIn, '1d');

  const good = jwt.sign({ userId: 'abc' }, SECRET, JWT_SIGN_OPTIONS);
  assert.equal(jwt.verify(good, SECRET, JWT_VERIFY_OPTIONS).userId, 'abc');

  const otherAlg = jwt.sign({ userId: 'abc' }, SECRET, { algorithm: 'HS384' });
  assert.throws(() => jwt.verify(otherAlg, SECRET, JWT_VERIFY_OPTIONS));
});

test('study uploads allow only text and word documents', () => {
  assert.equal(isAllowedStudyUpload({ originalname: 'notes.txt', mimetype: 'text/plain' }), true);
  assert.equal(
    isAllowedStudyUpload({
      originalname: 'notes.docx',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }),
    true
  );
  assert.equal(isAllowedStudyUpload({ originalname: 'notes.pdf', mimetype: 'application/pdf' }), false);
  assert.equal(isAllowedStudyUpload({ originalname: 'notes.txt', mimetype: 'application/pdf' }), false);
  assert.equal(isAllowedStudyUpload({ originalname: 'notes.exe', mimetype: 'application/octet-stream' }), false);
  assert.equal(sanitizeFileName('../../etc/passwd'), 'passwd');
  assert.equal(sanitizeFileName('..'), 'file');
});

test('citation html is escaped', () => {
  const citation = generateCitation('website', 'MLA', {
    title: '<script>alert(1)</script>',
    url: 'https://example.com',
    websiteName: 'Example',
    accessDate: '1 Jan. 2026',
  });
  assert.equal(citation.includes('<script>'), false);
  assert.equal(citation.includes('&lt;script&gt;'), true);
});

test('security headers are set on API responses', async () => {
  const app = express();
  app.use(securityHeaders);
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  const server = await new Promise((resolve) => {
    const started = app.listen(0, '127.0.0.1', () => resolve(started));
  });
  try {
    const { port } = server.address();
    const res = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-frame-options'), 'DENY');
    assert.equal(res.headers.get('referrer-policy'), 'no-referrer');
    assert.equal(res.headers.get('strict-transport-security'), null);
    const body = await res.json();
    assert.equal(body.status, 'ok');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('private reads require the owning user', async () => {
  const [
    quiz,
    doubt,
    summarizer,
    studyGuides,
    flashcards,
    mindMap,
    conceptMap,
    practiceTests,
  ] = await Promise.all([
    import('../routes/quiz.js'),
    import('../routes/doubt.js'),
    import('../routes/summarizerRoutes.js'),
    import('../routes/studyGuideRoutes.js'),
    import('../routes/flashcardRoutes.js'),
    import('../routes/mindMapRoutes.js'),
    import('../routes/conceptMapRoutes.js'),
    import('../routes/practiceTestRoutes.js'),
  ]);

  const owned = [
    [quiz.default, 'get', '/:id'],
    [doubt.default, 'get', '/:id'],
    [summarizer.default, 'get', '/:id'],
    [studyGuides.default, 'get', '/:id'],
    [flashcards.default, 'get', '/deck/:id'],
    [mindMap.default, 'get', '/:id'],
    [conceptMap.default, 'get', '/:id'],
    [practiceTests.default, 'get', '/tests/:id'],
  ];

  for (const [router, method, path] of owned) {
    const names = handlerNames(router, method, path);
    assert.ok(names.includes('authenticateUser'), `${path} must require a user: ${names.join(', ')}`);
    assert.equal(names.includes('optionalAuth'), false, `${path} must not use optional auth`);
  }
});
