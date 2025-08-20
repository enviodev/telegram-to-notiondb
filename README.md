# Telegram to Notion Sync Tool

A CLI tool that automatically syncs Telegram chats to a Notion database. It finds all Telegram chats containing a specific substring (case-insensitive) and adds any new ones that aren't already in your Notion database.

## ⚠️ WARNING

**Use this tool at your own risk!** The author's Telegram account was frozen after using this tool. Telegram may flag automated access to their API as suspicious activity. Consider:
- Using this tool sparingly
- Adding delays between runs
- Monitoring your account for any warnings

## What it does

1. **Scans Telegram**: Searches through all your Telegram chats for those containing a specific substring (interactively prompted)
2. **Compares with Notion**: Checks which of these chats already exist in your Notion database
3. **Syncs new chats**: Automatically adds any new Telegram chats to your Notion database
4. **Removes duplicates**: Can clean up duplicate pages in your Notion database, keeping the one with more information

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Get Telegram API credentials:**
   - Go to [https://my.telegram.org/](https://my.telegram.org/)
   - Log in with your phone number
   - Go to "API development tools"
   - Create a new application
   - Copy the `api_id` and `api_hash`

3. **Get Notion credentials:**
   - **Integration Token**: Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
     - Click "New integration"
     - Give it a name (e.g., "Telegram Sync Tool")
     - Select the workspace where your database is located
     - Click "Submit"
     - Copy the "Internal Integration Token" (this is your `NOTION_TOKEN`)
   
   - **Database ID**: 
     - Open your Notion database in the browser
     - Look at the URL: `https://www.notion.so/workspace-name/DATABASE_ID?v=...`
     - Copy the `DATABASE_ID` part (it's a long string of letters/numbers)
     - Or right-click on the database title → "Copy link" and extract the ID from the URL

4. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   Then edit `.env` and add your credentials:
   ```
   TELEGRAM_API_ID=your_api_id_here
   TELEGRAM_API_HASH=your_api_hash_here
   NOTION_TOKEN=your_notion_integration_token
   NOTION_DATABASE_ID=your_notion_database_id
   # Leave TELEGRAM_SESSION_STRING empty for first run
   TELEGRAM_SESSION_STRING=
   ```

## Usage

### Sync Telegram Chats to Notion

Run the sync command (no arguments needed):
```bash
npm run update-notion
```

The tool will interactively prompt you for the search substring:
```
Enter substring to filter telegram chats by: python
```

This will:
- Authenticate with Telegram (if needed)
- Find all chats containing the specified substring in the name (case-insensitive)
- Check which ones are already in your Notion database
- Add any new ones automatically
- Automatically disconnect from Telegram when done

### Delete Duplicate Pages from Notion

Clean up duplicate pages in your Notion database:
```bash
npm run delete-duplicates
```

**How duplicate removal works:**
- Finds pages with the same name in your Notion database
- Compares them based on:
  - Number of filled properties (more is better)
  - Owner information (pages with owners are preferred)
  - Status (pages with "New Leads" status are preferred)
  - Network information (more networks is better)
- **Keeps the page with more information**
- Archives (soft deletes) the duplicate with less information
- Processes pages sequentially to avoid rate limiting

## First-time Setup

**IMPORTANT**: The first time you run this tool:

1. **Leave `TELEGRAM_SESSION_STRING` empty** in your `.env` file
2. Run the command - it will prompt you for your phone number and verification code
3. **Copy the session string** that gets printed to the console
4. **Add it to your `.env` file** as `TELEGRAM_SESSION_STRING=your_session_string_here`
5. **Future runs will use this session** and won't require re-authentication

## Available Commands

### Main Commands
- **`npm run update-notion`** - Sync Telegram chats to Notion (interactive)
- **`npm run delete-duplicates`** - Delete duplicate pages from Notion database

### Development Commands
- **`npm run build`** - Build the project
- **`npm run dev`** - Run in development mode
- **`npm run watch`** - Watch for changes

## Notes

- The first time you run the tool, you'll need to provide your phone number and verification code
- If you have 2FA enabled, you'll also need to provide your password
- After successful login, save the session string for future use
- The tool interactively prompts for search substrings
- The tool automatically disconnects from Telegram when the sync is complete
- Duplicate removal is safe and only archives pages (doesn't permanently delete them)
