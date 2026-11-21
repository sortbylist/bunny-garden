export const practiceLengths = [10, 20, 30];

export function switchPracticeRound(state, scope, length, create, restart = false) {
  const rounds = state.rounds ||= {};
  const key = `${scope}:${length}`;
  const existing = rounds[key];
  const round = !restart && existing ? existing : create();
  if (!round) return false;
  rounds[key] = round;
  state.round = round;
  state.view = 'quiz';
  return true;
}

export function restorePracticeRounds(state, saved, normalizeRound, poolSize) {
  for (const [key, value] of Object.entries(saved.rounds || {})) {
    const length = Number(key.split(':').at(-1));
    if (!practiceLengths.includes(length) || key !== `${value?.scope}:${length}` || value.questions?.length > length) continue;
    const round = normalizeRound(value);
    if (round) state.rounds[key] = round;
  }
  if (!state.round) return;
  const { scope, questions } = state.round;
  const available = poolSize(scope);
  const expected = Math.min(state.practiceLength, available);
  if (!saved.rounds && scope !== 'review' && questions.length !== expected) {
    const original = practiceLengths.find(length => Math.min(length, available) === questions.length);
    if (original) state.practiceLength = original;
  }
  if (questions.length <= state.practiceLength) state.rounds[`${scope}:${state.practiceLength}`] = state.round;
}

export function selectPractice(pool, categories, length, seenIds, randomize) {
  const count = Math.min(length, pool.length);
  const validIds = new Set(pool.map(item => item.id));
  const seen = new Set(seenIds.filter(id => validIds.has(id)));
  if (seen.size === pool.length) seen.clear();
  const shuffled = randomize(pool);
  const freshFirst = [...shuffled.filter(item => !seen.has(item.id)), ...shuffled.filter(item => seen.has(item.id))];
  const representatives = randomize(categories.map(category => freshFirst.find(item => item.category === category)).filter(Boolean))
    .sort((left, right) => Number(seen.has(left.id)) - Number(seen.has(right.id)))
    .slice(0, count);
  const selected = randomize([...representatives, ...freshFirst.filter(item => !representatives.includes(item)).slice(0, Math.max(0, count - representatives.length))].slice(0, count));
  return { questions: selected, seenIds: [...new Set([...seenIds.filter(id => !validIds.has(id)), ...seen, ...selected.map(item => item.id)])] };
}
