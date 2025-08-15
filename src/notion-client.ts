import { Client } from '@notionhq/client';
import { filterChatsByPattern, disconnect } from './telegram-client';

// Notion API configuration
function getNotionCredentials() {
  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

  if (!NOTION_TOKEN) {
    throw new Error('NOTION_TOKEN must be set in environment variables');
  }

  if (!NOTION_DATABASE_ID) {
    throw new Error('NOTION_DATABASE_ID must be set in environment variables');
  }

  return {
    token: NOTION_TOKEN,
    databaseId: NOTION_DATABASE_ID
  };
}

// Initialize Notion client
let notionClient: Client | null = null;

export function initializeNotionClient(): Client {
  if (notionClient) {
    return notionClient;
  }

  const { token } = getNotionCredentials();

  notionClient = new Client({
    auth: token,
  });

  return notionClient;
}

export async function getAllPages(): Promise<string[]> {
  try {
    console.log('📋 Fetching all pages from Notion database...');

    const client = initializeNotionClient();
    const { databaseId } = getNotionCredentials();

    const names: string[] = [];
    let hasMore = true;
    let startCursor: string | undefined = undefined;
    let pageCount = 0;

    // Use pagination to get ALL pages from the database
    while (hasMore) {
      pageCount++;

      const response: any = await client.databases.query({
        database_id: databaseId,
        start_cursor: startCursor,
        page_size: 100, // Maximum page size allowed by Notion
        // You can add filters here if needed
        // filter: { ... },
        // You can add sorting here if needed
        // sorts: [ ... ],
      });

      // Extract names from this page
      response.results.forEach((page: any) => {
        // Check if the page has a "Name" property
        if (page.properties && page.properties.Name) {
          const nameProperty = page.properties.Name;

          // Since Name is a title property, extract the plain text
          if (nameProperty.type === 'title' && nameProperty.title) {
            const name = nameProperty.title
              .map((titleItem: any) => titleItem.plain_text)
              .join('')
              .trim();

            if (name) {
              names.push(name);
            }
          }
        }
      });

      // Check if there are more pages
      hasMore = response.has_more;
      startCursor = response.next_cursor || undefined;
    }

    console.log(`✅ Successfully extracted ${names.length} pages.`);

    return names;

  } catch (error) {
    console.error('❌ Error fetching names from Notion:', error);
    throw error;
  }
}

export async function findNewChats(chat_substr: string): Promise<any[]> {
  try {
    // Get all names from Notion
    const notionNames = await getAllPages();

    // Get Telegram chats (using mock data for now)
    // const telegramChats = getMockTelegramChats();
    const telegramChats = await filterChatsByPattern(chat_substr);

    const newChats: any[] = [];
    const existingChats: any[] = [];

    // Check each Telegram chat against Notion names
    telegramChats.forEach(chat => {
      const chatName = chat.title.toLowerCase().trim();

      // Check if this chat name exists in Notion (case-insensitive)
      const existsInNotion = notionNames.some(notionName =>
        notionName.toLowerCase().trim() === chatName
      );

      if (existsInNotion) {
        existingChats.push(chat);
      } else {
        newChats.push(chat);
      }
    });

    console.log(`\n📊 Summary:`);
    console.log(`   • Existing chats: ${existingChats.length}`);
    console.log(`   • New chats to add: ${newChats.length}`);

    return newChats;

  } catch (error) {
    console.error('❌ Error finding new chats:', error);
    throw error;
  }
}

export async function addChatsToNotion(chats: any[]): Promise<void> {
  try {
    if (chats.length === 0) {
      console.log('📝 No new chats to add to Notion');
      return;
    }

    console.log(`📝 Adding ${chats.length} new chats to Notion database...`);

    const client = initializeNotionClient();
    const { databaseId } = getNotionCredentials();

    let successCount = 0;
    let errorCount = 0;

    // Add each chat as a new page in the database
    for (const chat of chats) {
      try {
        console.log(`   ➕ Adding: ${chat.title}`);

        // Create the page properties
        const properties: any = {
          // Name property (required - this is the title)
          Name: {
            title: [
              {
                text: {
                  content: chat.title
                }
              }
            ]
          }
        };

        // Create the new page in the database
        const response = await client.pages.create({
          parent: {
            database_id: databaseId
          },
          properties: properties
        });

        successCount++;

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`      ❌ Failed to add ${chat.title}:`, error);
        errorCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   • Successfully added: ${successCount} chats`);
    if (errorCount > 0) {
      console.log(`   • Failed to add: ${errorCount} chats`);
    }

  } catch (error) {
    console.error('❌ Error adding chats to Notion:', error);
    throw error;
  }
}

export async function addNewChatsToNotion(chat_substr: string): Promise<void> {
  try {
    // First find new chats
    const newChats = await findNewChats(chat_substr);

    if (newChats.length === 0) {
      console.log('✨ No new chats found - everything is up to date!');
      return;
    }

    // Then add them to Notion
    await addChatsToNotion(newChats);

    console.log('✅ Process complete!');

  } catch (error) {
    console.error('❌ Error in addNewChatsToNotion process:', error);
    throw error;
  } finally {
    // Always disconnect from Telegram when done
    await disconnect();
  }
}
