# Release Process

1. Determine if major, minor or patch according to semver.org.
2. `vsce package <version>` to create a `.vsix` file. This bumps the version in `package.json` commits, and tags.
3. Install `code --install-extension outline-eclipsed-<version>.vsix` packaged extension locally.
4. Smoke test the extension in VS Code to ensure it works as expected.
5. `git push --tags` to push the new tag to GitHub, run a clean build and publish.