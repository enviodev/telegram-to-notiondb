#!/usr/bin/env node

import { Command } from 'commander';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import * as dotenv from 'dotenv';
import { loginToTelegram } from './telegram-client';

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
  .command('scrape')
  .description('Scrape chat information from a specific folder')
  .argument('<folder>', 'Name of the folder to scrape')
  .action(async (folder: string) => {
    try {
      console.log(`Scraping chats from folder: ${folder}`);
      // TODO: Implement folder scraping functionality
      console.log('Folder scraping not yet implemented');
    } catch (error) {
      console.error('Scraping failed:', error);
      process.exit(1);
    }
  });

program.parse();
