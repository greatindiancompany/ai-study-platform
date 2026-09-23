const ANSWER_FIELDS = new Set([
  'correct_answer',
  'correctAnswer',
  'answer',
  'answers',
  'explanation',
  'accepted_answers',
  'acceptedAnswers',
  'answerIndex',
]);

export function stripAnswerKeys(value) {
  if (Array.isArray(value)) return value.map(stripAnswerKeys);
  if (!value || typeof value !== 'object') return value;
  const copy = {};
  for (const [key, entry] of Object.entries(value)) {
    if (ANSWER_FIELDS.has(key)) continue;
    copy[key] = entry;
  }
  return copy;
}
