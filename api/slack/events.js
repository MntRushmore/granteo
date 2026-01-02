const { App, SocketModeReceiver } = require('@slack/bolt');
const { ConsoleLogger } = require('@slack/logger');
const customLogger = new ConsoleLogger();
customLogger.setLevel('error');
const { getOrgs, sendGrant, prisma, findOrCreateUser } = require('../hcb.js');

const transactionsCommand = require('../../commands/transactions');
const orgInfoCommand = require('../../commands/orginfo');
const bankUrlCommand = require('../../commands/bank_url');
const grantsForCommand = require('../../commands/grants_for.js');
const registerLoginCommand = require('../../commands/login');

require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = [
  'SLACK_APP_TOKEN',
  'SLACK_BOT_TOKEN',
  'SLACK_SIGNING_SECRET',
  'DATABASE_URL',
  'LOGS_CHANNEL_ID'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please set these variables in your .env file');
  process.exit(1);
}

// Configure a Socket Mode receiver with extended ping/pong timeouts
const receiver = new SocketModeReceiver({
  appToken: process.env.SLACK_APP_TOKEN,
  pingInterval: 30000,
  pongTimeout: 20000
});

if (process.env.NODE_ENV === 'development') {
  console.log('🔁 Hot reload enabled (watching for file changes)');
}

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  receiver,
  logger: customLogger
});

if (process.env.NODE_ENV === 'development') {
  const logEvent = async ({ event }) => {
    console.log('📩 Incoming Slack event:', JSON.stringify(event, null, 2));
  };

  app.event('message', logEvent);
  app.event('app_mention', logEvent);
}

// Grant template commands with database persistence
app.command('/grant_template', async ({ ack, body, client }) => {
  await ack();

  try {
    const parts = body.text.trim().split(/\s+/);
    if (parts.length < 3) {
      await client.chat.postMessage({
        channel: body.user_id,
        text: '❌ Invalid format. Usage: `/grant_template <amount> <email> <organization>`\nExample: `/grant_template 100 recipient@example.com my-org-slug`'
      });
      return;
    }

    const [amount, email, organization] = parts;

    // Validate inputs
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      await client.chat.postMessage({
        channel: body.user_id,
        text: '❌ Invalid amount. Please provide a positive number.'
      });
      return;
    }

    if (!email.includes('@')) {
      await client.chat.postMessage({
        channel: body.user_id,
        text: '❌ Invalid email address.'
      });
      return;
    }

    // Get user info
    const userInfo = await client.users.info({ user: body.user_id });
    const userEmail = userInfo.user.profile.email;
    const user = await findOrCreateUser(userEmail);

    // Create template in database
    await prisma.grantTemplate.create({
      data: {
        userId: user.id,
        amount: amount,
        email: email,
        organization: organization
      }
    });

    await client.chat.postMessage({
      channel: body.user_id,
      text: `✅ Template created for ${email} with amount $${amount} from ${organization}.`
    });
  } catch (error) {
    console.error('Error creating template:', error);
    await client.chat.postMessage({
      channel: body.user_id,
      text: '❌ Failed to create template. Please try again.'
    });
  }
});

app.command('/grant_template_delete', async ({ ack, body, client }) => {
  await ack();

  try {
    // Get user info
    const userInfo = await client.users.info({ user: body.user_id });
    const userEmail = userInfo.user.profile.email;
    const user = await findOrCreateUser(userEmail);

    // Delete all templates for this user
    const result = await prisma.grantTemplate.deleteMany({
      where: { userId: user.id }
    });

    if (result.count === 0) {
      await client.chat.postMessage({
        channel: body.user_id,
        text: '⚠️ No templates found to delete.'
      });
    } else {
      await client.chat.postMessage({
        channel: body.user_id,
        text: `✅ Deleted ${result.count} template(s) successfully.`
      });
    }
  } catch (error) {
    console.error('Error deleting templates:', error);
    await client.chat.postMessage({
      channel: body.user_id,
      text: '❌ Failed to delete templates. Please try again.'
    });
  }
});

app.command('/grant_list_templates', async ({ ack, body, client }) => {
  await ack();

  try {
    // Get user info
    const userInfo = await client.users.info({ user: body.user_id });
    const userEmail = userInfo.user.profile.email;
    const user = await findOrCreateUser(userEmail);

    // Fetch templates from database
    const templates = await prisma.grantTemplate.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    if (templates.length === 0) {
      await client.chat.postMessage({
        channel: body.user_id,
        text: '📭 No templates found. Create one with `/grant_template <amount> <email> <organization>`'
      });
      return;
    }

    const templateList = templates.map((t, index) =>
      `${index + 1}. Amount: $${t.amount}, Email: ${t.email}, Org: ${t.organization}`
    ).join('\n');

    await client.chat.postMessage({
      channel: body.user_id,
      text: `📋 *Your Grant Templates:*\n${templateList}`
    });
  } catch (error) {
    console.error('Error listing templates:', error);
    await client.chat.postMessage({
      channel: body.user_id,
      text: '❌ Failed to list templates. Please try again.'
    });
  }
});

app.command('/grant', async ({ ack, body, client }) => {
  await ack();

  try {
    const userInfo = await client.users.info({
      user: body.user_id
    });
    const userEmail = userInfo.user.profile.email;
    console.log("📧 Slack user email used to fetch DB record:", userEmail);

    const orgs = await getOrgs(userEmail);

    if (!orgs || orgs.length === 0) {
      await client.chat.postMessage({
        channel: body.user_id,
        text: "❌ No organizations found for your email. Please make sure you're associated with an organization in Hack Club Bank."
      });
      return;
    }

    // Get user's templates from database
    const user = await findOrCreateUser(userEmail);
    const templates = await prisma.grantTemplate.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5 // Limit to 5 most recent templates
    });

    const templateOptions = templates.length > 0
      ? templates.map(t => ({
          text: {
            type: 'plain_text',
            text: `$${t.amount} to ${t.email} (${t.organization})`
          },
          value: JSON.stringify({
            amount: t.amount,
            email: t.email,
            organization: t.organization
          })
        }))
      : [{
          text: { type: 'plain_text', text: 'No templates available' },
          value: 'none'
        }];

    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'grant_modal',
        title: { type: 'plain_text', text: 'Send Grant' },
        submit: { type: 'plain_text', text: 'Send' },
        close: { type: 'plain_text', text: 'Cancel' },
        blocks: [
          {
            type: 'section',
            text: { type: 'mrkdwn', text: '*Choose a template or create a new grant:*' },
          },
          {
            type: 'input',
            block_id: 'template_block',
            element: {
              type: 'static_select',
              action_id: 'template',
              placeholder: { type: 'plain_text', text: 'Select template (optional)' },
              options: templateOptions,
            },
            label: { type: 'plain_text', text: 'Template' },
            optional: true
          },
          {
            type: 'input',
            block_id: 'amount_block',
            element: {
              type: 'plain_text_input',
              action_id: 'amount',
              placeholder: {
                type: 'plain_text',
                text: 'Enter the grant amount',
              },
            },
            label: { type: 'plain_text', text: 'Grant Amount ($)' },
          },
          {
            type: 'input',
            block_id: 'email_block',
            element: {
              type: 'plain_text_input',
              action_id: 'email',
            },
            label: { type: 'plain_text', text: 'Recipients Email' },
          },
          {
            type: 'input',
            block_id: 'org_block',
            element: {
              type: 'static_select',
              action_id: 'organization',
              placeholder: { type: 'plain_text', text: 'Select your organization' },
              options: orgs,
            },
            label: { type: 'plain_text', text: 'Organization' },
          },
        ],
      },
    });
  } catch (error) {
    console.error('❌ Error opening grant modal:', error);
    await client.chat.postMessage({
      channel: body.user_id,
      text: `❌ Failed to open grant form: ${error.message}`
    });
  }
});

app.view('grant_modal', async ({ ack, view }) => {
  await ack({
    response_action: 'update',
    view: {
      type: 'modal',
      callback_id: 'confirm_grant_modal',
      title: { type: 'plain_text', text: 'Confirm Grant' },
      submit: { type: 'plain_text', text: 'Confirm' },
      close: { type: 'plain_text', text: 'Cancel' },
      private_metadata: JSON.stringify(view.state.values),
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `You're about to send *$${view.state.values.amount_block.amount.value}* to *${view.state.values.email_block.email.value}* from *${view.state.values.org_block.organization.selected_option.text.text}*.`
          }
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: 'Are you sure you want to proceed?' }
        }
      ]
    }
  });
});

app.view('confirm_grant_modal', async ({ ack, body, view, client }) => {
  await ack();

  const values = JSON.parse(view.private_metadata);
  const amount = values.amount_block.amount.value;
  const email = values.email_block.email.value;
  const organization = values.org_block.organization.selected_option.value;

  const userInfo = await client.users.info({
    user: body.user.id
  });
  const userEmail = userInfo.user.profile.email;
  console.log("📧 Slack user email in confirmation step:", userEmail);
  console.log("Confirmed grant to", email, "for", amount, "from", organization);

  try {
    await sendGrant(
      organization,
      amount,
      `Grant for ${email}`,
      userEmail,
      email
    );

    await client.chat.postMessage({
      channel: body.user.id,
      text: `✅ Grant successfully sent to ${email} for $${amount}`
    });

    // Log grant info to logs channel
    try {
      await client.chat.postMessage({
        channel: process.env.LOGS_CHANNEL_ID,
        text: `:money_with_wings: *Grant Sent*\n• To: ${email}\n• Amount: $${amount}\n• Org: ${organization}\n• Sent by: <@${body.user.id}>`
      });
    } catch (err) {
      console.error('❌ Logging grant failed:', err);
    }

    const gifs = [
      'https://media.giphy.com/media/l0MYB8Ory7Hqefo9a/giphy.gif',
      'https://media.giphy.com/media/xT9IgIc0lryrxvqVGM/giphy.gif',
      'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif'
    ];
    const gif = gifs[Math.floor(Math.random() * gifs.length)];
    await client.chat.postMessage({
      channel: body.user.id,
      text: `🎉 Here's a celebration gif for your grant:\n${gif}`
    });
  } catch (error) {
    console.error('❌ Failed to send grant:', error);

    await client.chat.postMessage({
      channel: body.user.id,
      text: `❌ Something went wrong when trying to send the grant: ${error.message}`
    });

    await client.chat.postMessage({
      channel: process.env.LOGS_CHANNEL_ID,
      text: `:rotating_light: *Grant failed*\n• User: <@${body.user.id}>\n• Email: ${email}\n• Amount: $${amount}\n• Org: ${organization}\n• Error: \`${error.message || error}\``
    });
  }
});

// Register other commands
app.command('/transactions', transactionsCommand);
app.command('/orginfo', orgInfoCommand);
app.command('/bank_url', bankUrlCommand);
app.command('/grants_for', grantsForCommand);

// Register the /login command
registerLoginCommand(app);

module.exports = app;

(async () => {
  try {
    await app.start(process.env.PORT || 3030);
    console.log('⚡️ Slack HCB Bot is running on port', process.env.PORT || 3030);
    if (process.env.NODE_ENV === 'development') {
      await app.client.chat.postMessage({
        channel: process.env.LOGS_CHANNEL_ID,
        text: '✅ Granteo bot has started and is online.',
      });
    }
  } catch (error) {
    console.error('Failed to start Slack HCB Bot:', error);
    process.exit(1);
  }
})();

process.on('SIGINT', async () => {
  console.log('👋 Shutting down Slack HCB Bot (SIGINT)');
  await app.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('👋 Shutting down Slack HCB Bot (SIGTERM)');
  await app.stop();
  process.exit(0);
});

process.on('uncaughtException', async (error) => {
  console.error('❌ Uncaught Exception:', error);
  await app.stop();
  process.exit(1);
});