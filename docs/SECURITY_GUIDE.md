# 🔐 Security Guide - ModelDock Studio BYOK Proxy

## ⚠️ Critical Security Issues Found

During the BYOK proxy implementation, several security vulnerabilities were identified. This guide provides step-by-step remediation instructions.

---

## 1. OAuth Client Secret Exposure (`.env.local`)

### ❌ Problem
The `.env.local` file contains real Google OAuth credentials that are tracked in git:
```env
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx  # ⚠️ EXPOSED IN GIT!
```

### ✅ Solution

#### Step 1: Revoke Compromised OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your OAuth 2.0 Client ID
3. **Delete the compromised client** (create new one later)
4. This immediately invalidates all tokens issued by that client

#### Step 2: Create New OAuth Client
1. In Google Cloud Console → APIs & Services → Credentials
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: Web application
4. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google`
5. Save the new Client ID and Secret

#### Step 3: Update `.env.local` (Local Only)
```env
# .env.local - NEVER commit this file!
GOOGLE_CLIENT_ID=new_client_id_here
GOOGLE_CLIENT_SECRET=new_secret_here
NEXTAUTH_SECRET=generate_new_secret_here
```

#### Step 4: Ensure `.gitignore` Protection
Verify `.gitignore` contains:
```gitignore
.env.local
.env*.local
```

#### Step 5: Remove from Git History
```bash
# Install BFG Repo-Cleaner
brew install bfg  # macOS
# or download from https://rtyley.github.io/bfg-repo-cleaner/

# Backup first!
cp -r .git .git.backup

# Remove sensitive data
bfg --replace-text <(echo "GOOGLE_CLIENT_SECRET=*****==REMOVED==") --no-blob-protection

# Force garbage collection
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (⚠️ WARNING: Destructive operation!)
git push origin --force --all
```

⚠️ **Important**: All team members must re-clone the repository after force push.

---

## 2. Cloudflare API Token & R2 Access Key Exposure

### ❌ Problem
Cloudflare API tokens and R2 access keys were shared in:
- Chat logs
- Deployment documentation
- Possibly committed to git

**Exposed Credentials:**
- Cloudflare API Token: `eZxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxx`
- R2 Access Key ID: `95xxxxxxxxxxxxxxxxxxxxxxxxxxxxx1`
- R2 Secret Access Key: `92xxxxxxxxxxxxxxxxxxxxxxxxxxxxx4`

### ✅ Solution

#### Step 1: Revoke Cloudflare API Token
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Find the token starting with `eZxxx...`
3. Click "Delete" or "Revoke"
4. Token is immediately invalidated

#### Step 2: Revoke R2 Access Keys
1. Go to Cloudflare Dashboard → R2 → Settings
2. Find Access Key ID: `95xxx...1`
3. Click "Delete" or "Revoke"
4. Keys are immediately invalidated

#### Step 3: Create New API Token (Minimal Permissions)
1. Cloudflare Dashboard → My Profile → API Tokens
2. Click "Create Token"
3. Use template: **Edit Cloudflare Workers**
4. Permissions:
   - Account → Cloudflare Workers Scripts → Edit
   - Account → Account Settings → Read (optional)
5. Account Resources: Include → Your Account
6. TTL: Set expiration (e.g., 6 months)
7. **Save the token immediately** (shown only once)

#### Step 4: Create New R2 Access Keys
1. Cloudflare Dashboard → R2 → Settings
2. Click "Create API Token"
3. Permissions: **Admin Read & Write** (for R2 bucket only)
4. TTL: Set expiration
5. Save Access Key ID and Secret immediately

#### Step 5: Update Worker Secrets
```bash
cd cloudflare-worker

# Set OpenRouter API Key
wrangler secret put OPENROUTER_API_KEY
# Paste your OpenRouter key when prompted

# Verify secrets are set
wrangler secret list
```

#### Step 6: Update Local Wrangler Config
**DO NOT** put secrets in `wrangler.toml`:
```toml
# wrangler.toml

# ❌ WRONG:
# [vars]
# OPENROUTER_API_KEY = "sk-or-v1-xxxxx"  # EXPOSED!

# ✅ CORRECT:
# Secrets are managed via: wrangler secret put OPENROUTER_API_KEY
```

#### Step 7: Store New Tokens Securely
```bash
# Option 1: Use environment variables (recommended)
export CLOUDFLARE_API_TOKEN="new_token_here"
export R2_ACCESS_KEY_ID="new_key_id_here"
export R2_SECRET_ACCESS_KEY="new_secret_here"

# Add to ~/.zshrc or ~/.bashrc for persistence
echo 'export CLOUDFLARE_API_TOKEN="new_token_here"' >> ~/.zshrc

# Option 2: Use a password manager (1Password, LastPass, Bitwarden)
```

---

## 3. `wrangler.toml` Security Best Practices

### ✅ Correct Configuration
```toml
# wrangler.toml

name = "modeldock-byok-proxy"
main = "src/index.js"
compatibility_date = "2024-11-01"
workers_dev = true
account_id = "081a9810680543ee912eb54ae15876a3"

[[r2_buckets]]
binding = "MODEL_CACHE"
bucket_name = "modeldock-models-cache"

[vars]
CACHE_TTL_HOURS = 6

# ⚠️ SECURITY: NEVER PUT SECRETS IN VARS!
# Secrets must be set via: wrangler secret put SECRET_NAME
#
# Example:
#   wrangler secret put OPENROUTER_API_KEY
#
# vars vs secrets:
#   - vars: Non-sensitive config (TTL, feature flags)
#   - secrets: API keys, passwords, tokens
```

---

## 4. Git History Cleanup Checklist

### Check for Exposed Secrets in Git History
```bash
# Search for potential secrets
git log -p | grep -i "secret\|password\|api.key\|token"

# Check specific files
git log -p -- .env.local wrangler.toml

# Find commits with large deletions (might indicate cleanup attempts)
git log --all --oneline --stat | grep -B 3 "Deletion"
```

### If Secrets Found
1. Use BFG Repo-Cleaner (see Step 5 in OAuth section)
2. Alternative: `git filter-repo` (more powerful)
```bash
# Install git-filter-repo
brew install git-filter-repo  # macOS

# Remove file from all history
git filter-repo --path .env.local --invert-paths

# Remove specific strings
git filter-repo --replace-text <(echo "GOOGLE_CLIENT_SECRET=*****==REMOVED==")
```

---

## 5. Future Prevention Strategies

### Pre-commit Hooks
Install `pre-commit` to prevent secret commits:

```bash
# Install pre-commit
pip install pre-commit

# Create .pre-commit-config.yaml
cat > .pre-commit-config.yaml <<EOF
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
        exclude: package.lock.json
EOF

# Initialize
pre-commit install
pre-commit run --all-files
```

### Secret Scanning Tools
```bash
# TruffleHog - Scan for secrets in git history
docker run --rm -v "$(pwd):/repo" trufflesecurity/trufflehog:latest git file:///repo

# GitGuardian - Free for public repos
# Sign up at https://www.gitguardian.com/
```

### Environment Variable Management
```bash
# Use direnv for automatic environment loading
brew install direnv

# Create .envrc (gitignored)
cat > .envrc <<EOF
export CLOUDFLARE_API_TOKEN="your_token_here"
export OPENROUTER_API_KEY="your_key_here"
EOF

# Allow direnv
direnv allow

# Add to .gitignore
echo ".envrc" >> .gitignore
```

---

## 6. Security Checklist

### Before Each Deployment
- [ ] No secrets in `.env` files committed to git
- [ ] All API keys set via `wrangler secret put`
- [ ] `.gitignore` includes `.env.local`, `.env*.local`
- [ ] Pre-commit hooks installed and running
- [ ] OAuth credentials are latest (not compromised)
- [ ] Cloudflare tokens have minimal required permissions
- [ ] Cloudflare tokens have expiration dates set

### After Security Incident
- [ ] Revoke all compromised credentials immediately
- [ ] Generate new credentials with minimal permissions
- [ ] Update all deployment pipelines with new credentials
- [ ] Clean git history if secrets were committed
- [ ] Force push cleaned repository
- [ ] Notify all team members to re-clone
- [ ] Monitor for unauthorized API usage
- [ ] Review access logs for suspicious activity

---

## 7. Additional Resources

- [Cloudflare Workers Security Best Practices](https://developers.cloudflare.com/workers/platform/security/)
- [Google OAuth 2.0 Security Guidelines](https://developers.google.com/identity/protocols/oauth2/security-best-practices)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)

---

## Contact

For security concerns, please create a private issue or contact the maintainers directly.

**DO NOT** post actual API keys, tokens, or secrets in public issues!
