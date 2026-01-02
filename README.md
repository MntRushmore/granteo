# Granteo - HCB Grant Bot for Slack

Hey! My name is **Granteo**, and I can send HCB grant cards via Slack! My life's purpose is to serve You Ship, We Ship organizers, but other HQ staff can also use me!

## Features

### Grant Management
- **Send Grants** - Send HCB grant cards directly from Slack without logging into the web interface
- **Grant Templates** - Save frequently-used grant configurations for quick sending
- **Automatic Token Refresh** - Your authentication tokens are automatically refreshed when they expire
- **Grant Logging** - All grants are logged to a dedicated Slack channel and database for audit trails

### Organization Tools
- **Organization Info** - View public information about any HCB organization
- **Transactions** - See recent transactions for an organization
- **Bank URLs** - Generate public HCB page URLs

## Commands

### `/grant`
Opens the granting window. Granteo automatically finds your Slack email and connects you to HCB servers. No need to manually login - just make sure your Slack email matches your HCB account!

**Features:**
- Select from your saved templates or create a new grant
- Choose recipient email and amount
- Select which organization to send from
- Confirmation step before sending
- Automatic logging and celebration GIF on success

### `/grant_template <amount> <email> <organization>`
Create a saved template for frequently-sent grants.

**Example:**
```
/grant_template 100 participant@example.com hackclub
```

### `/grant_list_templates`
View all your saved grant templates.

### `/grant_template_delete`
Delete all your saved templates.

### `/login`
Authenticate with HCB. This connects your Slack account to your HCB account and stores your OAuth tokens securely.

### `/orginfo <slug>`
Shows public information about an HCB organization.

**Example:**
```
/orginfo hackclub
```

### `/transactions <slug>`
Shows the 5 most recent public transactions for an organization.

**Example:**
```
/transactions hackclub
```

### `/bank_url <slug>`
Generates a public HCB page URL for an organization.

## Setup

### Prerequisites
- Node.js 18 or higher
- PostgreSQL database
- Slack workspace with admin access
- HCB organization access

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/hackclub/granteo.git
cd granteo
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and fill in your values:
- `SLACK_APP_TOKEN` - Your Slack app token (starts with `xapp-`)
- `SLACK_BOT_TOKEN` - Your Slack bot token (starts with `xoxb-`)
- `SLACK_SIGNING_SECRET` - Your Slack signing secret
- `LOGS_CHANNEL_ID` - The Slack channel ID where logs will be posted
- `DATABASE_URL` - Your PostgreSQL connection string

4. **Set up the database**

Run Prisma migrations to create the database tables:
```bash
npx prisma migrate dev
```

Generate the Prisma client:
```bash
npm run prisma:generate
```

5. **Start the bot**

For development (with auto-reload):
```bash
npm run dev
```

For production:
```bash
npm start
```

## Slack App Configuration

### Required Scopes
Your Slack app needs these bot token scopes:
- `chat:write` - Send messages
- `commands` - Register slash commands
- `users:read` - Read user profile information
- `users:read.email` - Read user email addresses

### Socket Mode
This bot uses Socket Mode to receive events. Make sure Socket Mode is enabled in your Slack app settings.

### Slash Commands
Register these slash commands in your Slack app:
- `/grant`
- `/grant_template`
- `/grant_list_templates`
- `/grant_template_delete`
- `/login`
- `/orginfo`
- `/transactions`
- `/bank_url`

## Architecture

### Technology Stack
- **Node.js** - Runtime environment
- **Slack Bolt** - Slack app framework
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **Express** - Web server (for log viewer)

### Database Schema
- **User** - Stores user info and OAuth tokens
- **GrantLog** - Audit log of all grants sent
- **GrantTemplate** - User-created grant templates
- **Project** & **Automation** - (Legacy, for future features)

### Security Features
- Automatic token expiration checking and refresh
- Input validation on all grant amounts and emails
- Secure OAuth token storage in database
- Environment variable validation on startup
- Error logging to dedicated Slack channel

## Development

### Running in Development Mode
```bash
npm run dev
```

This enables:
- Hot reload on file changes
- Verbose logging of all Slack events
- Startup notifications in the logs channel

### Database Management

View database in Prisma Studio:
```bash
npm run prisma:studio
```

Create a new migration:
```bash
npx prisma migrate dev --name your_migration_name
```

### Log Viewer

A simple web interface to view grant logs is available at:
```bash
node log-server.js
```

Then visit: `http://localhost:3000/logs`

## Troubleshooting

### "Please authenticate first by running /login"
Your HCB OAuth token is missing or expired. Run `/login` to authenticate.

### "No organizations found"
Make sure:
1. Your Slack email matches your HCB account email
2. You have access to at least one HCB organization
3. You've authenticated with `/login`

### Bot not responding
1. Check that Socket Mode is enabled
2. Verify your `SLACK_APP_TOKEN` is correct
3. Check the bot is running with no errors in the console
4. Ensure the bot is invited to the channel where you're using commands

## Credits

Made by [@Rushmore](https://github.com/rushilchopra) at [@hackclub](https://github.com/hackclub)
With help from Mohammed

## License

MIT
