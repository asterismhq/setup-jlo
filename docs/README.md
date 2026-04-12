# Documentation

This directory is the central documentation index for `setup-astm`.

## Migration Contract

Current migration work follows these fixed naming decisions.

- Action identity: `setup-astm`
- Installed binary name: `astm`
- Upstream repository slug default: `asterismhq/asterism`
- Product-owned environment variable prefix: `ASTM_`
- Worker branch default expected from the runtime ecosystem: `astm`

The residue scan allowlist is limited to backend-integration ownership boundaries in the companion runtime repository.

- `src/adapters/jules_client/**`
- `src/domain/ports/jules_client.rs`
- `crates/jls-api-rs/**`
- `JULES_API_KEY`

## Usage

- [Usage](usage.md): workflow examples and install modes

## Architecture

- [Architecture](architecture.md): runtime boundaries, dependency direction, cache layout, and failure invariants

## Configuration

- [Action Inputs](configuration/inputs.md): action inputs, defaults, and output values
- [Access Model](configuration/access.md): token scopes, private action access, and runtime environment overrides
