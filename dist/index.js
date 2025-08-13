#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const dotenv = __importStar(require("dotenv"));
const telegram_client_1 = require("./telegram-client");
// Load environment variables
dotenv.config();
const program = new commander_1.Command();
program
    .name('telegram-scraper')
    .description('CLI tool to scrape Telegram chat information from folders')
    .version('1.0.0');
program
    .command('login')
    .description('Login to Telegram')
    .action(async () => {
    try {
        console.log('Starting Telegram login process...');
        await (0, telegram_client_1.loginToTelegram)();
        console.log('Login successful!');
    }
    catch (error) {
        console.error('Login failed:', error);
        process.exit(1);
    }
});
program
    .command('scrape')
    .description('Scrape chat information from a specific folder')
    .argument('<folder>', 'Name of the folder to scrape')
    .action(async (folder) => {
    try {
        console.log(`Scraping chats from folder: ${folder}`);
        // TODO: Implement folder scraping functionality
        console.log('Folder scraping not yet implemented');
    }
    catch (error) {
        console.error('Scraping failed:', error);
        process.exit(1);
    }
});
program.parse();
//# sourceMappingURL=index.js.map