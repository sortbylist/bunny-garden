export const practiceLengths = [10, 20, 30];

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
