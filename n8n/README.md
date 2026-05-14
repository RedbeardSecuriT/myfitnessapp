# n8n Workflow Setup Guide

## What these workflows do

| Workflow | Schedule | Purpose |
|----------|----------|---------|
| `sunday-plan-generation.json` | Every Sunday 8am | Generates personalized weekly plan for all users via Claude API |
| `streak-notifications.json` | Every Monday 9am | Checks weekly performance, sends congrats or nudges |

---

## Setup steps

### 1. Install n8n
```bash
npm install -g n8n
# or with Docker:
docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
```

### 2. Open n8n dashboard
Go to `http://localhost:5678`

### 3. Set up Postgres credential
- Settings → Credentials → New → Postgres
- Name: `Supabase Postgres`
- Host: `db.qzbhlymownmhbljliqdj.supabase.co`
- Port: `5432`
- Database: `postgres`
- User: `postgres`
- Password: `[your Supabase DB password from Settings → Database]`
- SSL: Require

### 4. Import workflows
- Workflows → Import from File
- Import `sunday-plan-generation.json`
- Import `streak-notifications.json`
- Activate both

### 5. Test manually
- Open `sunday-plan-generation` workflow
- Click "Execute Workflow" to test
- Check Supabase `generated_plans` table for new rows

---

## Notifications table (create in Supabase)
```sql
create table public.notifications (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users not null,
  type       text not null,
  message    text not null,
  read       boolean default false,
  created_at timestamptz default now()
);
alter table public.notifications enable row level security;
create policy "Users own notifications" on public.notifications
  for all using (auth.uid() = user_id);
grant select, insert, update, delete on public.notifications to authenticated;
grant select, insert, update, delete on public.notifications to service_role;
```

---

## Environment variables needed on Railway
These should already be set:
- `ANTHROPIC_API_KEY` — your Claude API key
- `SUPABASE_URL` — https://qzbhlymownmhbljliqdj.supabase.co
- `SUPABASE_SERVICE_KEY` — service role key from Supabase Settings → API

---

## Extending workflows
To add email/push notifications, add a node after "Log notification":
- **Email**: Use `n8n-nodes-base.emailSend` with SMTP credentials
- **Push (Expo)**: Use HTTP Request to `https://exp.host/--/api/v2/push/send`
- **WhatsApp**: Use HTTP Request to WhatsApp Business API
- **Telegram**: Use `n8n-nodes-base.telegram`
