#!/usr/bin/env node

import { Command } from 'commander';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import * as dotenv from 'dotenv';
import { loginToTelegram, listAllChats, filterChatsByPattern } from './telegram-client';
import { getAllPages, findNewChats, addNewChatsToNotion } from './notion-client';

// Load environment variables
dotenv.config();

const program = new Command();

program
  .name('tg')
  .description('CLI tool to scrape Telegram chat information from folders')
  .version('1.0.0');

program
  .command('login')
  .description('Login to Telegram')
  .action(async () => {
    try {
      console.log('Starting Telegram login process...');
      await loginToTelegram();
      console.log('Login successful!');
    } catch (error) {
      console.error('Login failed:', error);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all available chats and folders')
  .action(async () => {
    try {
      console.log('Starting chat discovery...');
      // First ensure we're logged in
      await loginToTelegram();
      // Then list the chats
      await listAllChats();
      console.log('Chat discovery complete!');
    } catch (error) {
      console.error('Chat discovery failed:', error);
      process.exit(1);
    }
  });

program
  .command('filter')
  .description('Filter chats by name pattern (e.g., "envio" or "hemi")')
  .argument('<pattern>', 'Pattern to search for in chat names')
  .action(async (pattern: string) => {
    try {
      console.log(`Starting chat filtering for pattern: "${pattern}"`);
      // First ensure we're logged in
      await loginToTelegram();
      // Then filter chats by the pattern
      const filteredChats = await filterChatsByPattern(pattern);
      
      if (filteredChats.length > 0) {
        console.log('\n📋 Filtered Chat Results:');
        filteredChats.forEach((chat, index) => {
          console.log(`\n${index + 1}. 📱 ${chat.title}`);
          console.log(`   Type: ${chat.type}`);
          console.log(`   ID: ${chat.id}`);
          if (chat.username) {
            console.log(`   Username: @${chat.username}`);
          }
          console.log(`   Members: ${chat.memberCount}`);
          console.log(`   Description: ${chat.description}`);
        });
        
        console.log(`\n✅ Found ${filteredChats.length} chats matching "${pattern}"`);
      }
      
      console.log('Chat filtering complete!');
    } catch (error) {
      console.error('Filtering failed:', error);
      process.exit(1);
    }
  });

program
  .command("get-names")
  .description("Get all names from Notion database")
  .action(async () => {
    try {
      const allNames = await getAllPages();
      console.log(JSON.stringify(allNames, null, 2));
    } catch (error) {
      console.error('Name extraction failed:', error);
      process.exit(1);
    }
  });

program
  .command("find-new")
  .description("Find new Telegram chats that are not in Notion database")
  .action(async () => {
    try {
      console.log('Starting new chat discovery...');
      const newChats = await findNewChats();
      console.log(`\n🎯 Found ${newChats.length} new chats to add to Notion`);
      console.log('New chat discovery complete!');
    } catch (error) {
      console.error('New chat discovery failed:', error);
      process.exit(1);
    }
  });

program
  .command("update-notion")
  .description("Find new Telegram chats and add them to Notion database")
  .action(async () => {
    try {
      console.log('Starting process to add new chats to Notion...');
      await addNewChatsToNotion();
    } catch (error) {
      console.error('Add new chats process failed:', error);
      process.exit(1);
    }
  });

program.parse();
