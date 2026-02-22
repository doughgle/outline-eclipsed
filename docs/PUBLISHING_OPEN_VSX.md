# Publishing to Open VSX Registry

This guide explains how to publish the Outline Eclipsed extension to the [Open VSX Registry](https://open-vsx.org/), an open-source alternative to the Visual Studio Marketplace.

## Why Open VSX?

Open VSX Registry is important for:
- **VSCodium users** - VSCodium is a fully open-source VS Code distribution that cannot use the Microsoft Marketplace
- **Open source ecosystem** - Provides vendor-neutral distribution for VS Code extensions
- **Broader reach** - Makes your extension available to alternative VS Code distributions

## Prerequisites

Before publishing to Open VSX, ensure:
- You have completed the steps in the [Official Open VSX Documentation](https://github.com/eclipse/openvsx/wiki/Publishing-Extensions)
- You have created an Open VSX account and completed required agreements
- You have generated an access token
- You have configured the GitHub repository secret

## One-Time Setup Steps

### 1. Create an Open VSX Account

1. Visit [open-vsx.org](https://open-vsx.org/)
2. Click "Sign In" and authenticate with your GitHub account
3. Complete your profile information
4. **Important**: Sign the [Eclipse Foundation Open VSX Publisher Agreement](https://www.eclipse.org/legal/open-vsx-registry-faq/)
   - This is required for all publishers
   - There are no fees for creating an account or publishing extensions

### 2. Create Publisher Namespace

Your extension's `publisher` field in `package.json` must match your Open VSX namespace.

**Current publisher**: `douglashellinger` (as defined in package.json)

If this namespace doesn't exist:
1. Log in to open-vsx.org
2. Navigate to your user settings/publisher area
3. Create a namespace matching `douglashellinger`
4. Follow any verification steps required

Alternatively, you can create the namespace via CLI (after installing `ovsx`):
```bash
npx ovsx create-namespace douglashellinger
```

### 3. Generate Access Token

1. Log in to [open-vsx.org](https://open-vsx.org/)
2. Go to your user settings or profile
3. Look for "Access Tokens" or similar section
4. Click "Generate New Token"
5. Provide a description (e.g., "GitHub Actions - outline-eclipsed")
6. **Important**: Copy the token immediately and save it securely - it won't be shown again

### 4. Add Secret to GitHub Repository

The repository owner must add the Open VSX token as a GitHub secret:

1. Go to the repository on GitHub: https://github.com/doughgle/outline-eclipsed
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `OPEN_VSX_TOKEN`
5. Value: Paste the access token from step 3
6. Click **Add secret**

## Automated Publishing

Once the one-time setup is complete, publishing to Open VSX happens automatically via GitHub Actions.

### Trigger Conditions

The extension is published to Open VSX when:
- A git tag matching `v*` is pushed (e.g., `v0.8.3`, `v1.0.0`)
- The build and tests pass successfully on Ubuntu
- The extension is also published to VS Code Marketplace in the same workflow

### Workflow Details

The publishing workflow (`.github/workflows/ci.yml`) includes:
- **Duplicate version handling**: If the version already exists on Open VSX, the workflow continues without failing (using `skipDuplicate: true`)
- **Marketplace priority**: VS Code Marketplace publishing happens first, then Open VSX
- **Same artifact**: The same `.vsix` file is published to both registries for consistency

## Publishing Approaches Comparison

We evaluated three approaches for Open VSX publishing:

### Option 1: HaaLeo/publish-vscode-extension (SELECTED)

**Implementation**:
```yaml
- name: Publish to Open VSX Registry
  uses: HaaLeo/publish-vscode-extension@v2
  with:
    pat: ${{ secrets.OPEN_VSX_TOKEN }}
    skipDuplicate: true
```

**Pros**:
- ✅ Widely adopted and well-maintained action
- ✅ Supports both VS Code Marketplace and Open VSX
- ✅ Simple configuration
- ✅ Built-in duplicate version handling
- ✅ Good documentation and examples
- ✅ Active community support

**Cons**:
- ⚠️ Adds dependency on third-party action
- ⚠️ Requires trust in external maintainer

### Option 2: Direct CLI with ovsx

**Implementation**:
```yaml
- name: Install ovsx CLI
  run: npm install -g ovsx
- name: Publish to Open VSX
  run: ovsx publish -p ${{ secrets.OPEN_VSX_TOKEN }}
```

**Pros**:
- ✅ Direct control using official CLI
- ✅ No third-party dependencies
- ✅ Transparent command execution
- ✅ Easy to customize

**Cons**:
- ⚠️ Requires manual duplicate version handling
- ⚠️ More verbose workflow configuration
- ⚠️ Must handle packaging and error cases manually
- ⚠️ Less convenient for publishing to multiple registries

### Option 3: semantic-release-vsce

**Implementation**: Requires adopting semantic-release for full automation
```yaml
- name: Semantic Release
  run: npx semantic-release
  env:
    OVSX_PAT: ${{ secrets.OPEN_VSX_TOKEN }}
    VSCE_PAT: ${{ secrets.VSCE_PAT }}
```

**Pros**:
- ✅ Fully automated versioning and publishing
- ✅ Automatic changelog generation
- ✅ Enforces semantic versioning
- ✅ Integrates well with modern release workflows

**Cons**:
- ❌ Significant architectural change required
- ❌ Steeper learning curve
- ❌ Changes existing manual versioning workflow
- ❌ Overkill for current project needs

## Manual Publishing (if needed)

If you need to publish manually:

1. Install the Open VSX CLI:
   ```bash
   npm install -g ovsx
   ```

2. Build the extension:
   ```bash
   npm run compile
   ```

3. Package the extension:
   ```bash
   npx vsce package
   ```

4. Publish to Open VSX:
   ```bash
   ovsx publish outline-eclipsed-*.vsix -p YOUR_ACCESS_TOKEN
   ```

## Troubleshooting

### "Publisher not found" error
- Ensure the publisher namespace exists on Open VSX
- Verify it matches the `publisher` field in `package.json`

### "Version already exists" error
- Update the version in `package.json`
- Or use `skipDuplicate: true` in the GitHub Action (already configured)

### "Authentication failed" error
- Verify the `OPEN_VSX_TOKEN` secret is correctly set in GitHub
- Check that the token hasn't expired
- Regenerate the token if necessary

### Publishing succeeds but extension not visible
- **Wait for processing**: Newly published extensions may take a few minutes to appear in search results
- **Check extension page directly**: Navigate to `https://open-vsx.org/extension/<publisher>/<extension-name>` to verify the extension exists
- **Publisher agreement**: Verify the Eclipse Foundation Publisher Agreement is signed at [open-vsx.org](https://open-vsx.org/)
- **Extension metadata**: Ensure required fields are complete (license, README, icon, etc.)
- **Moderation queue**: In rare cases, extensions may require manual approval - check for emails from Open VSX team
- **Visibility status**: Log in to Open VSX and check if the extension is marked as public/visible

## Resources

- [Open VSX Registry](https://open-vsx.org/)
- [Official Publishing Guide](https://github.com/eclipse/openvsx/wiki/Publishing-Extensions)
- [Open VSX FAQ](https://www.eclipse.org/legal/open-vsx-registry-faq/)
- [ovsx CLI Documentation](https://github.com/eclipse/openvsx/tree/master/cli)
- [HaaLeo/publish-vscode-extension](https://github.com/HaaLeo/publish-vscode-extension)
- [Eclipse Foundation Publisher Agreement](https://www.eclipse.org/legal/open-vsx-registry-faq/)
