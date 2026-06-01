# GitHub Actions Workflows

These workflow files are ready to activate. To enable CI/CD:

1. Create the `.github/workflows/` directory in your repo root
2. Copy `ci.yml` and `deploy.yml` into it
3. Add the required secrets in GitHub → Settings → Secrets → Actions:

| Secret | Description |
|--------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Pages permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
| `VITE_SENTRY_DSN` | Sentry DSN for error tracking (optional) |

> **Note:** Moving the workflow files requires a GitHub PAT with the `workflow` scope.
> You can also do it directly in the GitHub web UI by creating the files there.
