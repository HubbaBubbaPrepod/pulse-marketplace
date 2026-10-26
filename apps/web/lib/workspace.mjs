export function parseRepository(input) {
  if (typeof input !== 'string' || input.length > 250) return null;
  const value = input.trim();
  try {
    const url = new URL(value.includes('://') ? value : `https://github.com/${value}`);
    if (
      url.protocol !== 'https:' ||
      url.hostname !== 'github.com' ||
      url.port ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      return null;
    const match = /^\/([a-z\d](?:[a-z\d-]{0,37}[a-z\d])?)\/([a-z\d_.-]{1,100})\/?$/i.exec(
      url.pathname,
    );
    if (!match) return null;
    const repository = match[2].replace(/\.git$/i, '');
    if (!repository || repository === '.' || repository === '..') return null;
    const name = `${match[1]}/${repository}`;
    return { key: name.toLowerCase(), name, url: `https://github.com/${name}` };
  } catch {
    return null;
  }
}
export function restoreDrafts(raw) {
  try {
    const data = JSON.parse(raw);
    if (data?.version !== 1 || !Array.isArray(data.drafts)) return [];
    const seen = new Set();
    return data.drafts.slice(0, 50).flatMap((item) => {
      const draft = parseRepository(item?.url);
      if (!draft || seen.has(draft.key)) return [];
      seen.add(draft.key);
      return [draft];
    });
  } catch {
    return [];
  }
}
export function decideRevision(revision, decision, comment) {
  if (typeof comment !== 'string' || !comment.trim() || comment.trim().length > 2000)
    return { error: 'comment' };
  const allowed =
    revision.status === 'pending'
      ? ['approved', 'rejected']
      : revision.status === 'approved'
        ? ['withdrawn']
        : [];
  if (!allowed.includes(decision)) return { error: 'transition' };
  if (
    decision === 'approved' &&
    (!revision.checks?.length || revision.checks.some((check) => !check.passed))
  )
    return { error: 'checks' };
  return {
    revision: {
      ...revision,
      status: decision,
      history: [...revision.history, { decision, comment: comment.trim() }],
    },
  };
}

export function canApproveRevision(actor, row) {
  return (
    row.status === 'pending' &&
    row.validation_passed === true &&
    (actor.role === 'administrator' ||
      (actor.role === 'moderator' &&
        Boolean(actor.githubId) &&
        actor.githubId !== row.source_owner_id))
  );
}
