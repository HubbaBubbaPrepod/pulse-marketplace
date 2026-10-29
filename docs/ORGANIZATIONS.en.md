# Organization publishing

An organization explicitly delegates publication in the default branch's `pulse-marketplace.json`:

```json
{
  "schemaVersion": 1,
  "moduleId": "example",
  "packageAsset": "module.json",
  "publishers": ["12345678"]
}
```

Use up to 20 unique numeric GitHub user ID strings from the official profile API, not usernames. Add `kind: "theme"` for themes. One marker identifies one module or theme. Publishers sign in with their own GitHub identities. The organization controls the marker; a package's author string is not proof of repository authority.

Discovery refreshes delegation from the default branch. Removing an ID or marker revokes access on the next scan; workspace access rejects delegation older than 35 minutes without successful refresh. GitHub failures close delegated workspace access without removing published packages. Manual repository submission reads the marker directly from GitHub.

Every version still requires validation and review. Each revision records its original publishers. A moderator listed in the original or current delegation cannot approve that version. Administrators retain the previously documented explicit self-approval exception with comments and audit. Delegation does not grant a Marketplace role or expand OAuth scopes.

[Русский](ORGANIZATIONS.md)
