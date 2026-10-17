# Module packages v2

The validator now accepts schema/protocol2 packages alongside existing v1. Discovery markers remain schema1: they identify a repository/module and asset; the downloaded asset declares its module protocol. Discovery and moderation never execute native artifacts, grant access or automatically publish a revision.

A v2 package declares1–16 Agent/Monitor components, per-component fields, artifacts, required capabilities, interval/manual/event declarations and optional declarative views/actions. The catalog preserves sanitized component metadata, advertised runtimes/capabilities/triggers, exact package SHA-256 and source provenance. Executable content is absent from metadata responses. Existing v1 snapshots remain unchanged.

Validation rejects duplicate/null/unknown members, case-alias component IDs, incorrect artifact hashes/platforms, invalid triggers/defaults, and metadata exceeding the Monitor2 MiB persisted-reader bound. Artifact limits remain16 MiB each,48 MiB total and68 MiB request. The package validator does not imply host compatibility: current development Monitor supports interval/manual, while event delivery remains a later stage. Old Monitor/Agent builds must not be told that v2 is supported.

A published version still needs the existing independent moderation workflow. A v2 GitHub release does not approve itself. Manual JSON installation remains possible without marketplace connectivity. Native code is privileged and not sandboxed; approval/hash verification are not guarantees of safety.
