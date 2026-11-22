export const publishedReviewDecisions = {
  'pinyin/words/huihui-word-白云': {
    status: 'approved', sha256: '7ea8e0236bf36da9abe47e2a4fda8f662f0f69eff7a9249d2990361669d91d33',
  },
  'pinyin/words/huihui-word-小草': {
    status: 'approved', sha256: '589278cc0053c1e255073186589f59c24d75b66c84d6f0318ddad1d12a6feb36',
  },
  'pinyin/words/huihui-word-画画': {
    status: 'approved', sha256: '0570c67b7f339b5ca7ed0cdf920c13eb9df7b7a30def32ab9299788acb842977',
  },
};

export function publishedReviewDecision(row) {
  const decision = publishedReviewDecisions[row.id];
  if (!decision?.sha256 || decision.sha256 === row.audio[0]?.clips[0]?.sha256) return decision;
}
