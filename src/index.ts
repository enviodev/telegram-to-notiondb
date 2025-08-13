#!/usr/bin/env node

import { Command } from 'commander';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import * as dotenv from 'dotenv';
import { loginToTelegram, listAllFolders, scrapeFolder } from './telegram-client';

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
      await listAllFolders();
      console.log('Chat discovery complete!');
    } catch (error) {
      console.error('Chat discovery failed:', error);
      process.exit(1);
    }
  });

program
  .command('scrape')
  .description('Scrape chat information from a specific folder')
  .argument('<folder>', 'Name of folder to scrape')
  .action(async (folder: string) => {
    try {
      console.log(`Starting folder scraping for: "${folder}"`);
      // First ensure we're logged in
      await loginToTelegram();
      // Then scrape the specified folder
      await scrapeFolder(folder);
      console.log('Folder scraping complete!');
    } catch (error) {
      console.error('Scraping failed:', error);
      process.exit(1);
    }
  });

program.parse();
