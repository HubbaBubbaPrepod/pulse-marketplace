import { githubBytes } from './transport.mjs';
export class GitHubClient {
  constructor(token) {
    this.token = token;
    this.controller = new AbortController();
  }
  close() {
    this.controller.abort();
  }
  async repository(id) {
    if (!/^\d+$/.test(String(id))) throw new Error('Invalid repository id');
    const item = await this.json(`/repositories/${id}`);
    if (
      String(item.id) !== String(id) ||
      item.private ||
      item.archived ||
      !/^\d+$/.test(String(item.owner?.id))
    )
      throw new Error('Repository identity unavailable');
    const result = {
      id: String(item.id),
      ownerId: String(item.owner.id),
      ownerType: item.owner.type,
      fullName: item.full_name,
      defaultBranch: item.default_branch,
    };
    this.path(result);
    return result;
  }
  async json(path) {
    return JSON.parse(
      (
        await githubBytes(`https://api.github.com${path}`, {
          token: this.token,
          signal: this.controller.signal,
        })
      ).toString('utf8'),
    );
  }
  path(repository) {
    if (!/^[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+$/.test(repository.fullName))
      throw new Error('Invalid repository name');
    return `/repos/${repository.fullName.split('/').map(encodeURIComponent).join('/')}`;
  }
  async *repositories(start = '2008-01-01', end = new Date().toISOString().slice(0, 10)) {
    const seen = new Set();
    for (const topic of ['pulse-module', 'pulse-theme']) {
      for await (const item of this.topicRepositories(topic, start, end)) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          yield item;
        }
      }
    }
  }
  async *topicRepositories(topic, start, end) {
    const query = `topic:${topic} is:public archived:false created:${start}..${end}`;
    const prefix = `/search/repositories?q=${encodeURIComponent(query)}&per_page=100`;
    const first = await this.json(`${prefix}&page=1`);
    if (first.incomplete_results || first.total_count > 1000) {
      const a = Date.parse(start),
        b = Date.parse(end),
        midpoint = a + Math.floor((b - a) / 172800000) * 86400000;
      if (a >= b) throw new Error('GitHub search partition is incomplete');
      yield* this.topicRepositories(topic, start, new Date(midpoint).toISOString().slice(0, 10));
      yield* this.topicRepositories(
        topic,
        new Date(midpoint + 86400000).toISOString().slice(0, 10),
        end,
      );
      return;
    }
    for (let page = 1; page <= Math.max(1, Math.ceil(first.total_count / 100)); page++) {
      const data = page === 1 ? first : await this.json(`${prefix}&page=${page}`);
      if (data.incomplete_results) throw new Error('GitHub search partition is incomplete');
      for (const item of data.items || []) {
        if (
          !item.private &&
          !item.archived &&
          /^\d+$/.test(String(item.id)) &&
          /^\d+$/.test(String(item.owner?.id))
        )
          yield {
            id: String(item.id),
            ownerId: String(item.owner.id),
            ownerType: item.owner.type,
            fullName: item.full_name,
            defaultBranch: item.default_branch,
          };
      }
    }
  }
  async marker(repository, commit) {
    const path = `${this.path(repository)}/contents/pulse-marketplace.json?ref=${encodeURIComponent(commit)}`;
    const bytes = await githubBytes(`https://api.github.com${path}`, {
      token: this.token,
      signal: this.controller.signal,
      limit: 65536,
      accept: 'application/vnd.github.raw+json',
    });
    return JSON.parse(bytes.toString('utf8'));
  }
  async *releases(repository) {
    // Retain published versions independently; discovery examines only the
    // newest 100 GitHub releases instead of downloading unbounded history.
    for (let page = 1; page <= 1; page++) {
      const items = await this.json(`${this.path(repository)}/releases?per_page=100&page=${page}`);
      if (!Array.isArray(items)) throw new Error('Invalid release list');
      for (const item of items) if (!item.draft && /^\d+$/.test(String(item.id))) yield item;
      if (items.length < 100) return;
    }
  }
  async commit(repository, tag) {
    const value = await this.json(`${this.path(repository)}/commits/${encodeURIComponent(tag)}`);
    if (!/^[a-f0-9]{40}$/i.test(value.sha)) throw new Error('Invalid commit SHA');
    return value.sha;
  }
  async asset(repository, asset) {
    if (
      !/^\d+$/.test(String(asset.id)) ||
      !Number.isSafeInteger(asset.size) ||
      asset.size < 1 ||
      asset.size > 68 * 1024 * 1024
    )
      throw new Error('Invalid release asset');
    const bytes = await githubBytes(
      `https://api.github.com${this.path(repository)}/releases/assets/${asset.id}`,
      {
        token: this.token,
        signal: this.controller.signal,
        limit: 68 * 1024 * 1024,
        accept: 'application/octet-stream',
      },
    );
    if (bytes.length !== asset.size) throw new Error('Release asset size changed');
    return bytes;
  }
}
