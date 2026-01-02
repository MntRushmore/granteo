const { PrismaClient } = require('../generated/prisma/client.js');
const prisma = new PrismaClient();

// Ensure a user record exists (create if missing)
async function findOrCreateUser(email) {
  const normalizedEmail = email.toLowerCase();
  return await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: {},
    create: { email: normalizedEmail }
  });
}

// Check if token is expired and needs refresh
function isTokenExpired(expiresAt) {
  if (!expiresAt) return false;
  const expiryDate = new Date(expiresAt);
  const now = new Date();
  // Consider expired if less than 5 minutes remaining
  return expiryDate.getTime() - now.getTime() < 5 * 60 * 1000;
}

// Refresh access token using refresh token
async function refreshAccessToken(user) {
  if (!user.refresh_token) {
    throw new Error('No refresh token available. Please re-authenticate with /login');
  }

  try {
    const res = await fetch('https://hcb.hackclub.com/api/v4/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: user.refresh_token
      })
    });

    if (!res.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await res.json();

    // Update user with new tokens
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        access_token: data.access_token,
        expires_at: data.expires_at,
        refresh_token: data.refresh_token || user.refresh_token
      }
    });

    return updatedUser;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw new Error('Token refresh failed. Please re-authenticate with /login');
  }
}

// Get valid access token (refresh if needed)
async function getValidAccessToken(user) {
  if (!user.access_token) {
    throw new Error('Please authenticate first by running /login');
  }

  if (isTokenExpired(user.expires_at)) {
    console.log('Token expired, refreshing...');
    const refreshedUser = await refreshAccessToken(user);
    return refreshedUser.access_token;
  }

  return user.access_token;
}

async function sendGrant(organization, amount, note, email, recipient) {
  // Validate inputs
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new Error('Invalid grant amount. Must be a positive number.');
  }
  if (!recipient || !recipient.includes('@')) {
    throw new Error('Invalid recipient email address.');
  }

  const user = await findOrCreateUser(email);
  const accessToken = await getValidAccessToken(user);

  const res = await fetch(`https://hcb.hackclub.com/api/v4/organizations/${organization}/card_grants`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: recipient,
      amount_cents: Math.round(parsedAmount * 100),
      note: note || ''
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error sending grant: ${res.statusText} - ${errorText}`);
  }

  const data = await res.json();

  // Log the grant to database
  try {
    await prisma.grantLog.create({
      data: {
        email,
        org: organization,
        amount: Math.round(parsedAmount * 100),
        recipient
      }
    });
  } catch (logError) {
    console.error('Failed to log grant:', logError);
    // Don't fail the grant if logging fails
  }

  return data;
}

async function getOrgs(email) {
  const user = await findOrCreateUser(email);
  const accessToken = await getValidAccessToken(user);

  console.log("Fetched user from DB:", user.email);

  const res = await fetch("https://hcb.hackclub.com/api/v4/user/organizations", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error fetching organizations: ${res.statusText} - ${errorText}`);
  }
  const data = await res.json();
  const formattedOrgs = data.map(org => ({
    text: { type: 'plain_text', text: org.name },
    value: org.slug
  }));
  return formattedOrgs;
}

async function getOrgInfo(email, orgSlug) {
  const user = await findOrCreateUser(email);
  const accessToken = await getValidAccessToken(user);

  const res = await fetch(`https://hcb.hackclub.com/api/v4/organizations/${orgSlug}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error fetching organization info: ${res.statusText} - ${errorText}`);
  }

  const data = await res.json();
  return {
    name: data.name,
    slug: data.slug,
    balance: `$${(data.balance_cents / 100).toFixed(2)}`,
    address: data.address,
    active_cardholders: data.users?.length || 0
  };
}

module.exports = { sendGrant, getOrgs, getOrgInfo, findOrCreateUser, prisma };

// Made by @Rushmore at @hackclub
// With help by Mohammed