# Changelog

All notable changes to Granteo will be documented in this file.

## [1.0.0] - 2026-01-01

### 🎉 Major Refactor & Bug Fixes

This release represents a comprehensive review and refactoring of the entire codebase to fix critical bugs, improve security, and add new features.

### ✅ Fixed

#### Critical Bugs
- **Fixed duplicate /grant command registration** - Removed conflicting command handler that was causing failures
- **Fixed sendGrant return value bug** - Now properly returns data from the fetch response instead of undefined
- **Fixed missing grantLog table** - Added GrantLog model to Prisma schema for audit logging
- **Fixed token expiration handling** - Now automatically checks and refreshes expired OAuth tokens
- **Fixed template persistence** - Templates are now stored in database instead of in-memory (which breaks on serverless)

#### Security Issues
- **Added input validation** - Grant amounts and email addresses are now validated before processing
- **Fixed hardcoded channel IDs** - Moved to environment variables for better configuration
- **Added environment variable validation** - Bot now checks for required env vars on startup and exits gracefully if missing
- **Updated all dependencies** - Fixed npm audit vulnerabilities (0 vulnerabilities remaining)
- **Improved error handling** - Better error messages with more context for debugging

#### Code Quality
- **Removed duplicate code** - Cleaned up unused variables (pendingGrants, grantCounts, grantTemplates object)
- **Removed easter egg** - Removed production code that listened to all messages for "shut up"
- **Fixed typos** - Corrected "reciever" to "receiver" throughout the schema
- **Fixed Prisma version mismatch** - Aligned @prisma/client and prisma to 6.8.2
- **Moved Vercel to devDependencies** - More appropriate dependency categorization
- **Removed daily check-in** - Non-functional on serverless platforms

### 🚀 Added

#### New Features
- **Database-persisted grant templates** - Templates are now saved to PostgreSQL and survive restarts
- **Automatic grant logging** - All grants are automatically logged to the GrantLog table
- **Token refresh logic** - Access tokens are automatically refreshed when they expire (5min buffer)
- **Better error messages** - More descriptive error messages with HCB API error details
- **Template validation** - Input validation on template creation with helpful error messages

#### New Commands
- `/grant_list_templates` - View all your saved templates (previously `/grant list_templates`)
- All template commands now use database storage

#### Developer Experience
- **Environment variable validation** - Startup checks ensure all required config is present
- **Better logging** - Clearer console output with emoji indicators
- **package.json improvements** - Added name, version, description, author, license, repository, engines
- **New npm scripts** - Added `start`, `prisma:generate`, `prisma:migrate`, `prisma:studio`
- **.env.example file** - Template for required environment variables
- **Comprehensive README** - Complete documentation with setup instructions
- **Express dependency** - Added for log server functionality

### 🗃️ Database Changes

#### New Models
- `GrantLog` - Stores audit trail of all grants sent
  - Fields: id, email, org, amount, recipient, createdAt

- `GrantTemplate` - Stores user-created grant templates
  - Fields: id, userId, amount, email, organization, createdAt, updatedAt
  - Includes relation to User model
  - Cascading delete on user removal

#### Schema Changes
- Renamed `recieverName` → `receiverName` in Automation model
- Renamed `recieverEmail` → `receiverEmail` in Automation model
- Renamed `recieverId` → `receiverId` in Automation model
- Added `templates` relation to User model

### 🔧 Configuration Changes

#### New Environment Variables Required
- `LOGS_CHANNEL_ID` - Slack channel for grant logs and bot status messages

#### Updated Environment Variables
- `DATABASE_URL` - Now validated on startup

### 📦 Dependencies

#### Updated
- `@prisma/client`: 6.6.0 → 6.8.2
- `prisma`: 6.6.0 → 6.8.2
- Various transitive dependencies updated via `npm audit fix`

#### Added
- `express`: ^4.21.2 (for log server)

#### Removed
- `vercel`: Moved to devDependencies

### 🔄 Breaking Changes

⚠️ **Migration Required**

You must run database migrations to add the new tables:

```bash
npx prisma migrate dev --name add_grant_log_and_templates
```

⚠️ **Environment Variables**

You must add `LOGS_CHANNEL_ID` to your `.env` file:

```bash
LOGS_CHANNEL_ID=C0123456789
```

⚠️ **Template Storage**

Old in-memory templates will be lost. Users need to recreate templates using `/grant_template`.

⚠️ **Command Changes**

- `/grant list_templates` is now `/grant_list_templates`

### 📝 Notes

#### Socket Mode vs Serverless
This bot uses Socket Mode which requires a persistent WebSocket connection. It will NOT work on serverless platforms like Vercel. Deploy to:
- Railway
- Render
- Fly.io
- Any VPS or long-running server

To use on serverless, you would need to switch from Socket Mode to Slack's Events API with HTTP endpoints.

#### Migration Instructions

1. Pull the latest code
2. Run `npm install` to update dependencies
3. Add `LOGS_CHANNEL_ID` to your `.env` file
4. Run `npx prisma migrate dev` to update the database
5. Run `npx prisma generate` to regenerate the Prisma client
6. Restart the bot

### 👏 Credits

Review and refactoring by Claude Code on 2026-01-01
Original code by [@Rushmore](https://github.com/rushilchopra) at [@hackclub](https://github.com/hackclub)

---

## Previous Versions

No formal versioning was used before 1.0.0.
