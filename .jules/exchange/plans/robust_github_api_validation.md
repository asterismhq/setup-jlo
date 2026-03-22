---
label: "refacts"
---

## Goal

Improve boundary type integrity by implementing robust validation for external inputs (GitHub API responses) and add test coverage to ensure unexpected data structures are correctly rejected.

## Current State

- `src/adapters/github/github-git-http-username.ts`: The `isGitHubUser` type predicate casts to `Record<string, unknown>` and checks properties loosely. The branches handling `data === null`, `typeof data !== 'object'`, and `typeof obj.type !== 'string'` are untested.
- `src/adapters/github/release-asset-api.ts`: The `isReleaseMetadata` type predicate casts to `Record<string, unknown>` and iterates arrays with loose runtime checks. Branches handling unexpected non-object payloads, undefined `assets`, or array elements that are not objects are not tested.
- `tests/adapters/github-git-http-username.test.ts`: Missing coverage for the type predicate branches in `github-git-http-username.ts`. It is also not in the correct folder based on its source code path, it should be in `tests/adapters/github/`.
- `tests/adapters/github/release-asset-api.test.ts`: Missing coverage for the type predicate branches in `release-asset-api.ts`.

## Plan

1. Rename `tests/adapters/github-git-http-username.test.ts` to `tests/adapters/github/github-git-http-username.test.ts` to align with the directory structure of its source file `src/adapters/github/github-git-http-username.ts`.
2. Update the imports inside `tests/adapters/github/github-git-http-username.test.ts` due to its new location:
   - Change `import { resolveGitHubHttpUsername } from '../../src/adapters/github/github-git-http-username'` to `import { resolveGitHubHttpUsername } from '../../../src/adapters/github/github-git-http-username'`
3. Modify `isGitHubUser` in `src/adapters/github/github-git-http-username.ts` to replace manual generic `as Record<string, unknown>` type casting with safer `in` checks. Example implementation:
   ```typescript
   function isGitHubUser(data: unknown): data is { login?: string; type?: string } {
     if (typeof data !== 'object' || data === null || Array.isArray(data)) {
       return false
     }
     if ('login' in data && data.login !== undefined && typeof data.login !== 'string') {
       return false
     }
     if ('type' in data && data.type !== undefined && typeof data.type !== 'string') {
       return false
     }
     return true
   }
   ```
4. Modify `isReleaseMetadata` in `src/adapters/github/release-asset-api.ts` to replace manual generic `as Record<string, unknown>` type casting with safer `in` checks. Example implementation:
   ```typescript
   function isReleaseMetadata(data: unknown): data is { assets?: Array<{ id: number; name: string }> } {
     if (typeof data !== 'object' || data === null || Array.isArray(data)) {
       return false
     }
     if (!('assets' in data) || data.assets === undefined) {
       return true
     }
     return (
       Array.isArray(data.assets) &&
       data.assets.every((asset: unknown) => {
         if (typeof asset !== 'object' || asset === null || Array.isArray(asset)) {
           return false
         }
         return (
           'id' in asset && typeof asset.id === 'number' &&
           'name' in asset && typeof asset.name === 'string'
         )
       })
     )
   }
   ```
5. Update `tests/adapters/github/github-git-http-username.test.ts` to include missing branch coverage:
   - Test payloads with `null` data.
   - Test payloads with non-object data (e.g., a primitive string or number or Array).
   - Test payloads where `type` exists but is not a string (e.g., a number).
   - Test payloads where `login` exists but is not a string (e.g., a number).
6. Update `tests/adapters/github/release-asset-api.test.ts` to include missing branch coverage:
   - Test payloads with non-object data, Array, or `null`.
   - Test payloads where `assets` array contains items that are not objects.
   - Test payloads where `assets` array contains objects with incorrect `id` or `name` types.
7. Confirm coverage using `npm run test -- --coverage` and ensure the specific uncovered line branches reported in the coverage output are handled and 100% line coverage is achieved on the modified files.
8. Verify code changes and type safety using `npm run typecheck`.

## Acceptance Criteria

- Ensure all payloads validate properly with accurate constraints, without using unsafe type casts (`as Record<string, unknown>`).
- Unexpected strings, types, arrays, or missing parameters fail type validation in a controlled manner.
- Line and branch coverage on type assertion paths (`src/adapters/github/github-git-http-username.ts` and `src/adapters/github/release-asset-api.ts`) is brought up to 100%.
- `tests/adapters/github-git-http-username.test.ts` is moved to `tests/adapters/github/github-git-http-username.test.ts`.

## Risks

- The safer type checks might inadvertently reject valid API payloads if there is a gap in our understanding of the GitHub API response shape. The type tests could require some trial and error if the API definition slightly deviates.
