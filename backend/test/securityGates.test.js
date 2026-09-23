import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';

process.env.SUPABASE_URL ||= 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY ||= 'test-anon-key';
process.env.JWT_SECRET ||= 'j'.repeat(40);
process.env.ANTHROPIC_API_KEY ||= 'test-anthropic-key';

const SECRET = `test-only-server-secret-${'s'.repeat(24)}`;
const USER_ID = '11111111-1111-4111-8111-111111111111';
const GROUP_A = '22222222-2222-4222-8222-222222222222';
const GROUP_B = '33333333-3333-4333-8333-333333333333';

async function listen(app) {
  const server = await new Promise((resolve) => {
    const started = app.listen(0, '127.0.0.1', () => resolve(started));
  });
  const { port } = server.address();
  return {
    port,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

async function request(app, { method = 'POST', path = '/', headers = {}, body } = {}) {
  const server = await listen(app);
  try {
    const res = await fetch(`http://127.0.0.1:${server.port}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let parsed = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }
    return { status: res.status, body: parsed };
  } finally {
    await server.close();
  }
}

function handlerNames(router, method, path) {
  const layer = router.stack.find((entry) => {
    return entry.route && entry.route.path === path && entry.route.methods[method];
  });
  assert.ok(layer, `missing ${method.toUpperCase()} ${path}`);
  return layer.route.stack.map((step) => step.handle.name);
}

test('AI gate fails closed without a user or a valid server secret', async () => {
  const { requireUserOrServerSecret } = await import('../middleware/requireUserOrServerSecret.js');
  const { AI_SERVER_SECRET_HEADER } = await import('../middleware/serverSecret.js');

  let called = false;
  const app = express();
  app.post('/spend', requireUserOrServerSecret, (req, res) => {
    called = true;
    res.json({ ok: true, access: req.aiAccess });
  });

  delete process.env.AI_SERVER_SECRET;
  const missing = await request(app, { path: '/spend' });
  assert.equal(missing.status, 401);
  assert.equal(missing.body.error, 'No authorization token provided');
  assert.equal(called, false);

  process.env.AI_SERVER_SECRET = 'too-short';
  const shortConfigured = await request(app, {
    path: '/spend',
    headers: { [AI_SERVER_SECRET_HEADER]: 'too-short' },
  });
  assert.equal(shortConfigured.status, 401);
  assert.equal(called, false);

  process.env.AI_SERVER_SECRET = SECRET;
  const wrong = await request(app, {
    path: '/spend',
    headers: { [AI_SERVER_SECRET_HEADER]: `${SECRET}x` },
  });
  assert.equal(wrong.status, 401);
  assert.equal(called, false);

  const badToken = await request(app, {
    path: '/spend',
    headers: { authorization: 'Bearer not-a-jwt' },
  });
  assert.equal(badToken.status, 401);
  assert.equal(badToken.body.error, 'Invalid token');
  assert.equal(called, false);

  const secretOverridesBadToken = await request(app, {
    path: '/spend',
    headers: {
      authorization: 'Bearer not-a-jwt',
      [AI_SERVER_SECRET_HEADER]: SECRET,
    },
  });
  assert.equal(secretOverridesBadToken.status, 200);
  assert.equal(secretOverridesBadToken.body.access, 'server-secret');
  assert.equal(called, true);

  called = false;
  const secretOnly = await request(app, {
    path: '/spend',
    headers: { [AI_SERVER_SECRET_HEADER]: SECRET },
  });
  assert.equal(secretOnly.status, 200);
  assert.equal(secretOnly.body.access, 'server-secret');
  assert.equal(called, true);
});

test('signed-in clients cannot self-award XP or badges', async () => {
  const { denyWithoutServerSecret, AI_SERVER_SECRET_HEADER } = await import('../middleware/serverSecret.js');
  process.env.AI_SERVER_SECRET = SECRET;

  const app = express();
  app.use(express.json());
  app.post('/award', (req, res) => {
    if (denyWithoutServerSecret(req, res, 'XP cannot be self-awarded')) return;
    res.json({ awarded: true });
  });

  const blocked = await request(app, { path: '/award', body: { delta: 100000 } });
  assert.equal(blocked.status, 403);
  assert.equal(blocked.body.error, 'XP cannot be self-awarded');

  const allowed = await request(app, {
    path: '/award',
    headers: { [AI_SERVER_SECRET_HEADER]: SECRET },
    body: { delta: 5 },
  });
  assert.equal(allowed.status, 200);
  assert.equal(allowed.body.awarded, true);
});

test('shared resource lists stay inside the caller membership', async () => {
  const { buildResourceListScope } = await import('../controllers/socialController.js');

  const unscoped = buildResourceListScope({
    userId: USER_ID,
    groupId: null,
    memberGroupIds: [GROUP_A],
  });
  assert.equal(unscoped.mode, 'own-or-groups');
  assert.deepEqual(unscoped.groupIds, [GROUP_A]);
  assert.equal(unscoped.groupIds.includes(GROUP_B), false);

  const ownOnly = buildResourceListScope({
    userId: USER_ID,
    groupId: null,
    memberGroupIds: [],
  });
  assert.equal(ownOnly.mode, 'own');

  const outsider = buildResourceListScope({
    userId: USER_ID,
    groupId: GROUP_B,
    memberGroupIds: [GROUP_A],
  });
  assert.equal(outsider.errorStatus, 403);

  const member = buildResourceListScope({
    userId: USER_ID,
    groupId: GROUP_A.toUpperCase(),
    memberGroupIds: [GROUP_A],
  });
  assert.equal(member.mode, 'group');

  const badGroup = buildResourceListScope({
    userId: USER_ID,
    groupId: 'not-a-uuid',
    memberGroupIds: [GROUP_A],
  });
  assert.equal(badGroup.errorStatus, 400);
});

test('Anthropic routes require the fail-closed gate before the handler', async () => {
  const [
    quiz,
    doubt,
    summarizer,
    studyGuides,
    flashcards,
    mathSolver,
    mindMap,
    conceptMap,
    practiceTests,
    worksheets,
    cornell,
  ] = await Promise.all([
    import('../routes/quiz.js'),
    import('../routes/doubt.js'),
    import('../routes/summarizerRoutes.js'),
    import('../routes/studyGuideRoutes.js'),
    import('../routes/flashcardRoutes.js'),
    import('../routes/mathSolverRoutes.js'),
    import('../routes/mindMapRoutes.js'),
    import('../routes/conceptMapRoutes.js'),
    import('../routes/practiceTestRoutes.js'),
    import('../routes/worksheetRoutes.js'),
    import('../routes/cornellNotes.js'),
  ]);

  const gated = [
    [quiz.default, 'post', '/generate', 'createQuiz'],
    [quiz.default, 'post', '/submit', 'submitQuiz'],
    [quiz.default, 'post', '/shared/:shareToken/submit', 'submitSharedQuiz'],
    [doubt.default, 'post', '/upload-image', 'uploadAndExtractImage'],
    [doubt.default, 'post', '/solve', 'solveDoubt'],
    [summarizer.default, 'post', '/generate', 'generateSummary'],
    [studyGuides.default, 'post', '/generate', 'generateStudyGuide'],
    [flashcards.default, 'post', '/generate', 'generateFlashcards'],
    [mathSolver.default, 'post', '/solve', 'solveMathProblem'],
    [mindMap.default, 'post', '/generate', 'generateMindMap'],
    [conceptMap.default, 'post', '/generate', 'generateConceptMap'],
    [practiceTests.default, 'post', '/generate', 'generateQuestions'],
    [worksheets.default, 'post', '/generate', 'generateWorksheet'],
    [cornell.default, 'post', '/generate', 'generateNotes'],
  ];

  for (const [router, method, path, handlerName] of gated) {
    const names = handlerNames(router, method, path);
    const gateAt = names.indexOf('requireUserOrServerSecret');
    const handlerAt = names.indexOf(handlerName);
    assert.ok(gateAt >= 0, `${path} is missing the gate: ${names.join(', ')}`);
    assert.ok(handlerAt > gateAt, `${path} gate must run before ${handlerName}: ${names.join(', ')}`);
  }

  delete process.env.AI_SERVER_SECRET;
  const app = express();
  app.use(express.json());
  app.use('/api/quiz', quiz.default);
  app.use('/api/doubt', doubt.default);
  app.use('/api/worksheets', worksheets.default);

  const generate = await request(app, { path: '/api/quiz/generate', body: { sourceName: 'Topic' } });
  assert.equal(generate.status, 401);

  const submit = await request(app, { path: '/api/quiz/submit', body: {} });
  assert.equal(submit.status, 401);

  const solve = await request(app, { path: '/api/doubt/solve', body: { question_text: 'Explain gravity now' } });
  assert.equal(solve.status, 401);

  const worksheet = await request(app, { path: '/api/worksheets/generate', body: { topic: 'Cells' } });
  assert.equal(worksheet.status, 401);
});
