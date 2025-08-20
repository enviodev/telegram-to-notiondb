#!/usr/bin/env node

import { Command } from 'commander';
import * as dotenv from 'dotenv';
import { addNewChatsToNotion, getAllPages, getAllDuplicates, deleteDuplicates } from './notion-client';

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
  .action(async () => {
    try {
      // Import readline for user input
      const readline = require('readline');
      
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      // Prompt user for substring (keep asking until valid input)
      let chat_substr = '';
      while (!chat_substr) {
        chat_substr = await new Promise<string>((resolve) => {
          rl.question('Enter substring to filter telegram chats by: ', (answer: string) => {
            resolve(answer.trim());
          });
        });
        
        if (!chat_substr) {
          console.log('❌ Please enter a valid substring to search for.');
        }
      }
      
      rl.close();
      
      console.log('⚠️  WARNING: Use this tool at your own risk! The author\'s Telegram account was frozen after using this tool.');
      console.log('Starting process to add new chats to Notion...');
      await addNewChatsToNotion(chat_substr);
    } catch (error) {
      console.error('Add new chats process failed:', error);
      process.exit(1);
    }
  });

program
  .command("delete-duplicates")
  .description("Delete duplicate pages from Notion database.")
  .action(async () => {
    try {
      const allPages = await getAllPages();
      const duplicates = getAllDuplicates(allPages);
      await deleteDuplicates(duplicates);
    } catch (error) {
      console.error('Error deleting duplicates: ', error);
      process.exit(1);
    }
  });

program.parse();
