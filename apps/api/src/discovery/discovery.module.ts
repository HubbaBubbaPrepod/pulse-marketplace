import { Module } from '@nestjs/common';
import { Discovery, GITHUB_CLIENT } from './discovery.service.js';
import { GitHubClient } from './github-client.mjs';
@Module({
  providers: [
    Discovery,
    { provide: GITHUB_CLIENT, useFactory: () => new GitHubClient(process.env.GITHUB_READ_TOKEN) },
  ],
  exports: [Discovery, GITHUB_CLIENT],
})
export class DiscoveryModule {}
