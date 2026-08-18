# Agents Instructions

## Git Commit Workflow

Before making any git commit, follow these steps:

### 1. Verify Git Credentials

Run the following commands to check if git credentials are configured:

```bash
git config --global user.name
git config --global user.email
```

### 2. Ensure Correct Credentials

If credentials are already configured, make sure they match the correct values:

- `user.name` must be: `ausafulislam`
- `user.email` must be: `ausafdev@gmail.com`

If they don't match or are missing, set them immediately:

```bash
git config --global user.name "ausafulislam"
git config --global user.email "ausafdev@gmail.com"
```

### 3. Stage and Commit

After verifying/setting credentials, proceed with staging and committing changes.

### 4. Version Management

As changes are made, update the version in `package.json` following [Semantic Versioning](https://semver.org/):

- **Patch** (0.1.x): Bug fixes, typo corrections, minor style tweaks
- **Minor** (0.x.0): New features, new game modes, UI enhancements
- **Major** (x.0.0): Breaking changes, database schema changes, API rewrites

Check `package.json` version and bump it appropriately before committing.
