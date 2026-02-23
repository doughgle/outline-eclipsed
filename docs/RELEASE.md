# Release Process

## Local pre-release testing (before tagging)

1. Determine bump type per [semver.org](https://semver.org): `patch` (bug fix), `minor` (new feature), `major` (breaking change).
2. Bump the version in `package.json` only — no commit or tag yet:
   ```
   npm version [patch|minor|major] --no-git-tag-version
   ```
3. Build the candidate package:
   ```
   npm run package
   ```
4. Install and smoke test locally:
   ```
   code --install-extension outline-eclipsed-$(npm pkg get version | tr -d '"').vsix
   ```
5. If unsatisfied: revert the version bump, fix the issue, and repeat from step 2.
   ```
   git checkout package.json
   ```

## Tagging and publishing

6. When satisfied, commit and tag:
   ```
   git add package.json
   git commit -m "chore: bump to vX.Y.Z"
   git tag vX.Y.Z
   git push --follow-tags
   ```
7. The Release workflow picks up the tag, builds `outline-eclipsed-<version>.vsix` on Ubuntu, and publishes it to both VS Code Marketplace and Open VSX Registry.

## Re-publishing to a single registry (without a new tag)

Use `workflow_dispatch` to target one registry manually:
```
gh workflow run release.yml --ref vX.Y.Z -f registry=ovsx
```
Valid values for `registry`: `both`, `marketplace`, `ovsx`.
