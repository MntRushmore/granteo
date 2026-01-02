# Granteo Commands Quick Reference

## 💰 Grant Commands

### `/grant`
Send a grant to a recipient.

**Usage:**
```
/grant
```

**What it does:**
- Opens an interactive modal
- Shows your saved templates
- Let's you enter amount, recipient email, and organization
- Confirmation step before sending
- Logs the grant automatically
- Sends you a celebration GIF 🎉

**Requirements:**
- You must be authenticated (run `/login` first)
- Your Slack email must match your HCB email
- You must have access to at least one HCB organization

---

### `/grant_template <amount> <email> <organization>`
Save a template for frequently-sent grants.

**Usage:**
```
/grant_template 100 student@example.com hackclub
```

**Parameters:**
- `amount` - Grant amount in dollars (positive number)
- `email` - Recipient's email address
- `organization` - HCB organization slug

**Examples:**
```
/grant_template 50 participant@hackclub.com my-event
/grant_template 150 winner@example.com you-ship-we-ship
```

**Notes:**
- Templates are saved to database and persist across restarts
- Each user can have multiple templates
- Templates appear in the `/grant` modal dropdown

---

### `/grant_list_templates`
View all your saved templates.

**Usage:**
```
/grant_list_templates
```

**What it shows:**
- All your saved templates
- Amount, email, and organization for each
- Ordered by most recently created

---

### `/grant_template_delete`
Delete all your saved templates.

**Usage:**
```
/grant_template_delete
```

**Warning:**
- This deletes ALL your templates
- Cannot be undone
- You'll need to recreate them if you want them back

---

## 🔐 Authentication

### `/login`
Authenticate with Hack Club Bank.

**Usage:**
```
/login
```

**What it does:**
- Shows a button to link your account
- Opens HCB OAuth flow
- Stores your access token securely
- Tokens are automatically refreshed when they expire

**Notes:**
- You only need to do this once
- Make sure your Slack email matches your HCB email
- Required before using `/grant` command

---

## 🏢 Organization Commands

### `/orginfo <slug>`
View public information about an organization.

**Usage:**
```
/orginfo hackclub
```

**What it shows:**
- Organization name
- Slug
- Team size
- Website URL
- GitHub handle
- Twitter handle

**Examples:**
```
/orginfo hackclub
/orginfo my-event-2024
```

---

### `/transactions <slug>`
View the 5 most recent transactions for an organization.

**Usage:**
```
/transactions hackclub
```

**What it shows:**
- Transaction description
- Amount
- Date
- Limited to 5 most recent

**Examples:**
```
/transactions hackclub
/transactions you-ship-we-ship
```

**Notes:**
- Only shows public transactions
- No authentication required

---

### `/bank_url <slug>`
Generate a public HCB page URL for an organization.

**Usage:**
```
/bank_url hackclub
```

**Output:**
- Direct link to the organization's public HCB page
- Example: https://hcb.hackclub.com/hackclub

**Examples:**
```
/bank_url hackclub
/bank_url my-organization
```

---

## 🚫 Deprecated Commands

### ~~`/grant list_templates`~~
**Replaced by:** `/grant_list_templates`

Use the new command instead:
```
/grant_list_templates
```

---

### ~~`/grants_for`~~
**Status:** Not implemented yet

This command is currently disabled and will be added in a future update.

---

## 💡 Tips & Tricks

### Quick Grant Sending
1. Create templates for frequent recipients
2. Use `/grant` and select from dropdown
3. Still faster than logging into HCB!

### Checking Org Balance
```
/orginfo your-org-slug
```
Shows the current balance before sending grants.

### Template Best Practices
- Create templates for different grant amounts
- Use descriptive organization slugs
- Keep recipient emails up to date

### Troubleshooting
If a command doesn't work:
1. Make sure you've run `/login`
2. Check your Slack email matches HCB
3. Verify you have org access
4. Ask your admin for help

---

## 📱 Where to Use Commands

All commands work in:
- ✅ Direct messages with Granteo
- ✅ Public channels (if bot is invited)
- ✅ Private channels (if bot is invited)

**Note:** `/grant` results are only visible to you (ephemeral messages).

---

## 🆘 Getting Help

If you have questions or issues:
- Check the [README.md](README.md) for setup instructions
- Review the [CHANGELOG.md](CHANGELOG.md) for recent changes
- Contact @Rushmore in Slack
- File an issue on GitHub

---

## 🔒 Privacy & Security

**What Granteo stores:**
- Your Slack email (to link accounts)
- HCB OAuth tokens (encrypted in database)
- Grant templates you create
- Grant logs (for audit trail)

**What Granteo NEVER stores:**
- Your password
- Full transaction history
- Organization financial data
- Other users' information

**Where grants are logged:**
- Dedicated Slack channel (visible to admins)
- PostgreSQL database (for audit purposes)

---

## ⚡ Command Summary Table

| Command | Auth Required | Parameters | Purpose |
|---------|---------------|------------|---------|
| `/grant` | ✅ Yes | None | Send a grant |
| `/grant_template` | ✅ Yes | amount, email, org | Save template |
| `/grant_list_templates` | ✅ Yes | None | View templates |
| `/grant_template_delete` | ✅ Yes | None | Delete templates |
| `/login` | ❌ No | None | Authenticate |
| `/orginfo` | ❌ No | slug | Org information |
| `/transactions` | ❌ No | slug | Recent transactions |
| `/bank_url` | ❌ No | slug | Generate HCB URL |

---

Last updated: 2026-01-01
Version: 1.0.0
