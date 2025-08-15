#!/usr/bin/env node

import { Command } from 'commander';
import * as dotenv from 'dotenv';
import { addNewChatsToNotion } from './notion-client';

// Load environment variables
dotenv.config();

const program = new Command();

program
  .name('tg')
  .description('CLI tool to sync Telegram chats to Notion database')
  .version('1.0.0');

program
  .command("update-notion")
  .description("Find new Telegram chats and add them to Notion database")
  .argument('<chat_substr>', 'Substring to search for in telegram chat names (case insensitive)')
  .action(async (chat_substr) => {
    try {
      console.log('⚠️  WARNING: Use this tool at your own risk! The author\'s Telegram account was frozen after using this tool.');
      console.log('Starting process to add new chats to Notion...');
      await addNewChatsToNotion(chat_substr);
    } catch (error) {
      console.error('Add new chats process failed:', error);
      process.exit(1);
    }
  });

program.parse();
