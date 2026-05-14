# My Fitness App

React + Vite fitness tracker with Supabase, Claude AI, and Railway backend.

## Stack
- **Frontend**: React + Vite → Netlify
- **Backend**: Node.js + Express → Railway  
- **Database**: Supabase (PostgreSQL + Auth)
- **AI**: Claude API (plan generation)
- **Automation**: n8n (weekly plans, notifications)

## Setup
```bash
npm install
npm run dev         # local dev at localhost:5173
npm run build       # production build → dist/
```

## Deploy
Push to GitHub → Netlify auto-builds from `dist/` using `npm run build`

## n8n workflows
See `/n8n/README.md` for setup instructions.
