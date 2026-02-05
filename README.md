# HEAL'EM - Vercel Deployment Instructions

This repository is a Vite + React TypeScript app. To deploy to Vercel, follow either the GitHub integration flow or use the Vercel CLI.

Required environment variables (set these in the Vercel project settings or via the CLI):

- VITE_GEMINI_API_KEY - Your Google Gemini API key (used by `services/geminiService.ts`).

Optional (if you want to keep credentials out of code):
- Firebase credentials are currently embedded in `services/firebaseService.ts`. For production, extract these into env vars and update the file.

Quick steps (Git integration):

1. Push this repository to GitHub.
2. Go to https://vercel.com and import the GitHub repo.
3. During import, set the Environment Variable `VITE_GEMINI_API_KEY`.
4. Build & Deploy. Vercel will run `npm run build` and serve the static `dist` folder.

Using Vercel CLI:

1. Install the CLI: `npm i -g vercel`
2. Run `vercel` in the project root and follow prompts.
3. When asked, set the environment variable `VITE_GEMINI_API_KEY`.

Notes & limitations:
- I cannot deploy to your Vercel account on your behalf because I don't have access to your credentials.
- Firestore configuration is currently hard-coded in `services/firebaseService.ts`; consider migrating config values to environment variables for safety.

If you want, I can prepare a single commit branch with these changes, and provide the exact commands to push and deploy with the Vercel CLI. If you'd like me to continue, tell me whether you want CLI instructions or GitHub integration instructions next.
