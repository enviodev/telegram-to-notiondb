# Telegram to Notion Sync Tool

A CLI tool that automatically syncs Telegram chats to a Notion database. It finds all Telegram chats containing a specific substring (case-insensitive) and adds any new ones that aren't already in your Notion database.

## ⚠️ WARNING

**Use this tool at your own risk!** The author's Telegram account was frozen after using this tool. Telegram may flag automated access to their API as suspicious activity. Consider:
- Using this tool sparingly
- Adding delays between runs
- Monitoring your account for any warnings

## What it does

1. **Scans Telegram**: Searches through all your Telegram chats for those containing a specific substring (provided as a command line argument)
2. **Compares with Notion**: Checks which of these chats already exist in your Notion database
3. **Syncs new chats**: Automatically adds any new Telegram chats to your Notion database

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

Run the sync command with a substring to search for:
```bash
npm run dev -- update-notion "your-search-term"
```

Examples:
```bash
npm run dev -- update-notion "work"
npm run dev -- update-notion "friday"
```

This will:
- Authenticate with Telegram (if needed)
- Find all chats containing the specified substring in the name (case-insensitive)
- Check which ones are already in your Notion database
- Add any new ones automatically
- Automatically disconnect from Telegram when done

## First-time Setup

**IMPORTANT**: The first time you run this tool:

1. **Leave `TELEGRAM_SESSION_STRING` empty** in your `.env` file
2. Run the command - it will prompt you for your phone number and verification code
3. **Copy the session string** that gets printed to the console
4. **Add it to your `.env` file** as `TELEGRAM_SESSION_STRING=your_session_string_here`
5. **Future runs will use this session** and won't require re-authentication

## Development

- Build: `npm run build`
- Run in development mode: `npm run dev`
- Watch for changes: `npm run watch`

## Notes

- The first time you run the tool, you'll need to provide your phone number and verification code
- If you have 2FA enabled, you'll also need to provide your password
- After successful login, save the session string for future use
- The tool accepts a search substring as a command line argument
- The tool automatically disconnects from Telegram when the sync is complete
