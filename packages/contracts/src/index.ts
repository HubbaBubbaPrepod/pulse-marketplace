export type Platform = 'linux-amd64' | 'linux-arm64' | 'windows-amd64';
export type RevisionStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';
export type Role = 'author' | 'moderator' | 'administrator';
export interface ValidationIssue {
  path: string;
  code: string;
}
export interface DiscoveryMarker {
  schemaVersion: 1;
  moduleId: string;
  packageAsset: string;
}
export interface Actor {
  id: string;
  displayName: string;
  role: Role;
  githubId: string | null;
}
export interface SessionInfo {
  user: Actor | null;
  csrfToken: string | null;
}
export interface CatalogModule {
  executionRuntimes?: Array<'native' | 'wasip1'>;
  schemaVersion?: 1 | 2;
  runtimes?: Array<'agent' | 'monitor'>;
  capabilities?: string[];
  triggers?: Array<'manual' | 'interval' | 'event'>;
  owner: string;
  id: string;
  name: string;
  description: string;
  version: string;
  sha256: string;
  size: number;
  platforms: Platform[];
  permissions: string[];
  sourceUrl: string;
  reviewedAt: string;
}
export interface CatalogPage {
  items: CatalogModule[];
  nextCursor: string | null;
  revision: string;
}
export interface ReviewRevision {
  id: string;
  repository_id: string;
  source_owner_id: string;
  owner: string;
  module_id: string;
  version: string;
  sha256: string;
  status: RevisionStatus;
  validation_passed: boolean;
  commit_sha: string;
  source_url: string;
}
export interface AuthCapabilities {
  github: boolean;
  google: boolean;
  email: boolean;
  emailRegistration: boolean;
  passwordReset: boolean;
}
