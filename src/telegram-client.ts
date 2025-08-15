import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import * as readline from 'readline';

// You'll need to get these from https://my.telegram.org/
function getApiCredentials() {
  const API_ID = process.env.TELEGRAM_API_ID;
  const API_HASH = process.env.TELEGRAM_API_HASH;

  if (!API_ID || !API_HASH) {
    throw new Error('TELEGRAM_API_ID and TELEGRAM_API_HASH must be set in environment variables');
  }

  return {
    apiId: parseInt(API_ID),
    apiHash: API_HASH
  };
}

function getSessionString(): string | null {
  return process.env.TELEGRAM_SESSION_STRING || null;
}

async function startWithAuthentication(): Promise<void> {
  await client!.start({
    phoneNumber: async () => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      return new Promise<string>((resolve) => {
        rl.question('Please enter your phone number (including country code): ', (phone) => {
          rl.close();
          resolve(phone);
        });
      });
    },
    password: async () => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      return new Promise<string>((resolve) => {
        rl.question('Please enter your 2FA password (if enabled): ', (password) => {
          rl.close();
          resolve(password);
        });
      });
    },
    phoneCode: async () => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      return new Promise<string>((resolve) => {
        rl.question('Please enter the code you received: ', (code) => {
          rl.close();
          resolve(code);
        });
      });
    },
    onError: (err) => console.log(err),
  });
}

let client: TelegramClient | null = null;

export async function loginToTelegram(): Promise<void> {
  try {
    const { apiId, apiHash } = getApiCredentials();
    const sessionString = getSessionString();

    console.log(sessionString ? 'Found existing session, attempting to restore...' : 'No existing session found, starting fresh login...');

    // Create a new client instance
    client = new TelegramClient(
      new StringSession(sessionString || ''), // Use existing session or empty string for new session
      apiId,
      apiHash,
      {
        connectionRetries: 5,
      }
    );

    // Start the client
    if (sessionString) {
      // Try to connect with existing session
      try {
        await client.connect();
        console.log('Successfully connected with existing session!');
      } catch (error) {
        console.log('Existing session expired, starting fresh login...');
        // Fall back to full authentication flow
        await startWithAuthentication();
      }
    } else {
      // No existing session, start full authentication flow
      await startWithAuthentication();
    }

    console.log('Successfully connected to Telegram!');

    // Save the session string for future use
    if (client.session) {
      const newSessionString = client.session.save();
      if (typeof newSessionString === 'string') {
        console.log('Session string:', newSessionString);
        console.log('Save this session string to your .env file as TELEGRAM_SESSION_STRING for future use!');
        console.log('Example: TELEGRAM_SESSION_STRING=' + newSessionString);
      }
    }

  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
}

export function getClient(): TelegramClient | null {
  return client;
}

export async function disconnect(): Promise<void> {
  if (client) {
    await client.disconnect();
    client = null;
  }
}

export async function filterChatsByPattern(pattern: string): Promise<any[]> {

  await loginToTelegram();

  if (!client) {
    throw new Error('Not connected to Telegram. Please login first.');
  }

  try {
    console.log(`🔍 Filtering chats by pattern: "${pattern}"`);

    // Get all dialogs (chats) - no limit
    const dialogs = await client.getDialogs();

    // Sanitize the pattern (lowercase, trim whitespace)
    const sanitizedPattern = pattern.toLowerCase().trim();

    // Filter chats that match the pattern
    const matchingChats = dialogs.filter(dialog => {
      const entity = dialog.entity;
      if (!entity) return false;

      let title = '';
      if ('title' in entity) {
        title = entity.title || '';
      } else if ('firstName' in entity) {
        title = (entity.firstName || '') + ' ' + (entity.lastName || '');
      } else if ('username' in entity) {
        title = entity.username || '';
      }

      // Check if the sanitized title contains the sanitized pattern
      return title.toLowerCase().includes(sanitizedPattern);
    });

    if (matchingChats.length === 0) {
      console.log(`❌ No chats found matching pattern: "${pattern}"`);
      console.log('💡 Available chat names:');
      dialogs.slice(0, 10).forEach((dialog, index) => {
        const entity = dialog.entity;
        if (entity) {
          let title = '';
          if ('title' in entity) {
            title = entity.title || `Chat ${index + 1}`;
          } else if ('firstName' in entity) {
            title = (entity.firstName || '') + ' ' + (entity.lastName || '');
          } else if ('username' in entity) {
            title = entity.username || `Chat ${index + 1}`;
          }
          console.log(`  • ${title}`);
        }
      });
      if (dialogs.length > 10) {
        console.log(`  ... and ${dialogs.length - 10} more chats`);
      }
      return [];
    }

    console.log(`✅ Found ${matchingChats.length} chats matching "${pattern}"`);

    // Transform the data into a clean array format
    const chatData = matchingChats.map(dialog => {
      const entity = dialog.entity;
      if (!entity) return null;

      let title = '';
      let username = '';
      let id = entity.id;
      let type = entity.className || 'Unknown';

      // Extract title and username
      if ('title' in entity) {
        title = entity.title || 'Unknown Title';
      } else if ('firstName' in entity) {
        title = (entity.firstName || '') + ' ' + (entity.lastName || '').trim();
        username = entity.username || '';
      } else if ('username' in entity) {
        title = entity.username || 'Unknown Username';
        username = entity.username || '';
      }

      // Get additional details if available
      let memberCount = 'N/A';
      let description = 'N/A';

      try {
        if ('participantsCount' in entity && entity.participantsCount) {
          memberCount = String(entity.participantsCount);
        }
        if ('about' in entity && entity.about) {
          description = String(entity.about);
        }
      } catch (error) {
        // Some entities might not have these properties
      }

      return {
        title,
        username,
        id,
        type,
        memberCount,
        description
      };
    }).filter(chat => chat !== null); // Remove any null entries

    return chatData;

  } catch (error) {
    console.error('❌ Error filtering chats:', error);
    throw error;
  }
}
