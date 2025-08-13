# Telegram Scraper CLI

A command-line tool to scrape chat information from Telegram folders.

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

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   Then edit `.env` and add your API credentials:
   ```
   TELEGRAM_API_ID=your_api_id_here
   TELEGRAM_API_HASH=your_api_hash_here
   ```

## Usage

### Login to Telegram
```bash
npm run dev -- login
```

### Scrape chats from a folder
```bash
npm run dev -- scrape "Folder Name"
```

## Development

- Build: `npm run build`
- Run in development mode: `npm run dev`
- Watch for changes: `npm run watch`

## Notes

- The first time you run the login command, you'll need to provide your phone number and the verification code sent to you
- If you have 2FA enabled, you'll also need to provide your password
- After successful login, save the session string for future use
