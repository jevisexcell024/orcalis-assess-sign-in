Google OAuth setup for Orcalis Assess

Overview
- The app uses Supabase OAuth to sign users in via `supabase.auth.signInWithOAuth({ provider: 'google' })`.
- The client triggers an OAuth redirect and Supabase will return the user to the configured `redirectTo` URL. In our code the redirect is set to `window.location.origin + '/dashboard'`.

Steps to enable Google OAuth

1. In your Supabase project dashboard:
   - Go to `Authentication` → `Providers` → enable `Google`.
   - Set the `Redirect URLs` to include both your local dev origin and production origin, for example:
     - `http://localhost:5173/dashboard`
     - `https://your-production-domain.com/dashboard`
   - Save the provider configuration and note any OAuth client IDs/secrets if shown.

2. In your local environment, create a `.env` file based on `.env.example` and set:

```bash
VITE_SUPABASE_URL=https://mjwdhjwgacggvontvgex.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_tRRjIgCNHpMaeuj3K0nUyw_Ur6Hr51r
VITE_ADMIN_EMAILS=jevisexcell024@gmail.com
```

3. Ensure your Supabase project's OAuth redirect matches the `redirectTo` used by the app. We use `window.location.origin + '/dashboard'` so add `/dashboard` to your allowed Redirect URLs.

4. Test the flow locally:

```bash
# install deps (if needed)
npm install
# run dev server
npm run dev
```

- Open the app and click "Google Workspace" on the sign-in page.
- Complete the Google consent; Supabase will redirect back to `/dashboard`.

Notes and troubleshooting
- If the page returns without a session, confirm `VITE_SUPABASE_PUBLISHABLE_KEY` and `VITE_SUPABASE_URL` are correct.
- For SSR session reads, Supabase uses client-side storage; in SSR contexts the `getSession()` helper calls `supabase.auth.getSession()` which reads the session client-side. If you need server-cookie-based SSR sessions, implement a server-side token exchange.
- Make sure the OAuth client in the Google Cloud Console allows the redirect URLs you configured in Supabase.

If you'd like, I can:
- Add a dedicated `/auth/callback` route and use a server-side endpoint to exchange tokens.
- Add UX improvements like a loading state while OAuth completes.
