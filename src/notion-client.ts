import { Client } from '@notionhq/client';
import { filterChatsByPattern, disconnect } from './telegram-client';

interface Page {
  id: string;
  name: string;
  status?: string;
  allNetworks?: string[];
  owner?: string;
  priority?: string;
  pipeline?: string;
  lastEditedTime?: string;
}

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

export async function getAllPages(): Promise<Page[]> {
  try {
      const client = initializeNotionClient();
      const { databaseId } = getNotionCredentials();
  
      const pages: Page[] = [];
      let hasMore = true;
      let startCursor: string | undefined = undefined;
      let pageCount = 0;
      let loadingDots = '...';
  
      // Use pagination to get ALL pages from the database
      while (hasMore) {
        pageCount++;
        
        // Update loading message with dots (single line)
        process.stdout.write(`\r📋 Fetching all pages from Notion database${loadingDots}${' '.repeat(3)}`);
  
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
            const pageId = page.id;
    
            // Since Name is a title property, extract the plain text
            if (nameProperty.type === 'title' && nameProperty.title) {
              const name = nameProperty.title
                .map((titleItem: any) => titleItem.plain_text)
                .join('')
                .trim();
  
              if (name) {
                const pageData: Page = {
                  id: pageId,
                  name: name,
                  status: page.properties.Status?.select?.name,
                  allNetworks: page.properties['All Networks']?.multi_select?.map((item: any) => item.name) || [],
                  owner: page.properties.Owner?.rich_text?.[0]?.plain_text || page.properties.Owner?.people?.[0]?.name,
                  priority: page.properties.Priority?.select?.name,
                  pipeline: page.properties.Pipeline?.select?.name,
                };
                
                pages.push(pageData);
              }
            }
          }
        });
  
        // Check if there are more pages
        hasMore = response.has_more;
        startCursor = response.next_cursor || undefined;

        loadingDots += '.';
      }
      
      console.log(`\n✅ Successfully extracted ${pages.length} pages.`);
  
      return pages;
  
    } catch (error) {
      console.error('❌ Error fetching names from Notion:', error);
      throw error;
    }
}

export async function findNewChats(chat_substr: string): Promise<any[]> {
  try {
    // Get all names from Notion
    const notionPages = await getAllPages();
    const notionNames = notionPages.map(page => page.name);

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





//Delete duplicates funtions ------------------------------------------------------------





export const getAllDuplicates = (allPages: Page[]): Page[] => {
  const duplicates: Page[] = [];
  const seen = new Map<string, Page>();
  
  for (const page of allPages) {
      if (seen.has(page.name)) {
          const existingPage = seen.get(page.name)!;
          const {worsePage, betterPage} = comparePages(existingPage, page);
          duplicates.push(worsePage);
          seen.set(page.name, betterPage);
      } else {
          seen.set(page.name, page);
      }
  }
  
  return duplicates;
};

// Function to count non-empty properties
export const countFilledProperties = (page: Page): number => {
  let count = 0;
  if (page.name) count++;
  if (page.status) count++;
  if (page.allNetworks && page.allNetworks.length > 0) count++;
  if (page.owner) count++;
  if (page.priority) count++;
  if (page.pipeline) count++;
  return count;
};

// Function to compare two pages and determine which has more information
export const comparePages = (page1: Page, page2: Page): {worsePage: Page, betterPage: Page} => {
  const filled1 = countFilledProperties(page1);
  const filled2 = countFilledProperties(page2);

  if (filled1 !== filled2) {
      if (filled1 < filled2) {
          return {worsePage: page1, betterPage: page2};
      } else {
          return {worsePage: page2, betterPage: page1};
      }
  }

  if (!page1.owner || !page2.owner && page1.owner !== page2.owner) {
      if (!page1.owner) return {worsePage: page1, betterPage: page2};
      if (!page2.owner) return {worsePage: page2, betterPage: page1};
  }

  if (page1.status !== page2.status) {
      if (page1.status === "New Leads") return {worsePage: page1, betterPage: page2};
      if (page2.status === "New Leads") return {worsePage: page2, betterPage: page1};
  }

  const networks1 = page1.allNetworks?.length || 0;
  const networks2 = page2.allNetworks?.length || 0;
  
  if (networks1 !== networks2) {
      if (networks1 < networks2) {
          return {worsePage: page1, betterPage: page2};
      } else {
          return {worsePage: page2, betterPage: page1};
      }
  }

  return {worsePage: page1, betterPage: page2};
};

export const deleteDuplicates = async (duplicates: Page[]): Promise<boolean> => {
  try {
      const client = initializeNotionClient();
      
      console.log(`🗑️ Starting to archive ${duplicates.length} duplicate pages...`);
      
      // Process deletions sequentially to avoid rate limiting
      let numberDeleted = 0;
      for (let i = 0; i < duplicates.length; i++) {
          const duplicate = duplicates[i];
          
          try {
              await client.pages.update({
                  page_id: duplicate.id,
                  archived: true
              });
              
              console.log(`✅ [${i + 1}/${duplicates.length}] Archived: ${duplicate.name} (${duplicate.id})`);
              numberDeleted++;

              // Add small delay to avoid rate limiting (100ms between each deletion)
              if (i < duplicates.length - 1) {
                  await new Promise(resolve => setTimeout(resolve, 100));
              }
              
          } catch (pageError) {
              console.error(`❌ Failed to archive page ${duplicate.name} (${duplicate.id}):`, pageError);
          }
      }

      console.log(`\n🎉 Successfully removed ${numberDeleted}/${duplicates.length} duplicate pages.`);
      return true;
      
  } catch (error) {
      console.error(`❌ Error during duplicate deletion process:`, error);
      return false;
  }
};