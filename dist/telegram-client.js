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
exports.loginToTelegram = loginToTelegram;
exports.getClient = getClient;
exports.disconnect = disconnect;
const telegram_1 = require("telegram");
const sessions_1 = require("telegram/sessions");
const readline = __importStar(require("readline"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// You'll need to get these from https://my.telegram.org/
function getApiCredentials() {
    const API_ID = process.env.TELEGRAM_API_ID;
    const API_HASH = process.env.TELEGRAM_API_HASH;
    if (!API_ID || !API_HASH) {
        throw new Error('TELEGRAM_API_ID and TELEGRAM_API_HASH must be set in environment variables');
    }
    return {
        apiId: parseInt(API_ID),
        apiHash: API_HASH
    };
}
function getSessionString() {
    return process.env.TELEGRAM_SESSION_STRING || null;
}
function updateEnvFile(newSessionString) {
    try {
        const envPath = path.join(process.cwd(), '.env');
        // Read the current .env file
        let envContent = '';
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }
        // Check if TELEGRAM_SESSION_STRING already exists
        if (envContent.includes('TELEGRAM_SESSION_STRING=')) {
            // Update existing session string
            envContent = envContent.replace(/TELEGRAM_SESSION_STRING=.*/g, `TELEGRAM_SESSION_STRING=${newSessionString}`);
        }
        else {
            // Add new session string
            envContent += `\nTELEGRAM_SESSION_STRING=${newSessionString}`;
        }
        // Write back to .env file
        fs.writeFileSync(envPath, envContent);
        console.log('✅ Session string automatically updated in .env file!');
    }
    catch (error) {
        console.log('⚠️  Could not automatically update .env file:', error);
        console.log('Please manually update your .env file with the session string above.');
    }
}
async function startWithAuthentication() {
    await client.start({
        phoneNumber: async () => {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            return new Promise((resolve) => {
                rl.question('Please enter your phone number (including country code): ', (phone) => {
                    rl.close();
                    resolve(phone);
                });
            });
        },
        password: async () => {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            return new Promise((resolve) => {
                rl.question('Please enter your 2FA password (if enabled): ', (password) => {
                    rl.close();
                    resolve(password);
                });
            });
        },
        phoneCode: async () => {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            return new Promise((resolve) => {
                rl.question('Please enter the code you received: ', (code) => {
                    rl.close();
                    resolve(code);
                });
            });
        },
        onError: (err) => console.log(err),
    });
}
let client = null;
async function loginToTelegram() {
    try {
        const { apiId, apiHash } = getApiCredentials();
        const sessionString = getSessionString();
        console.log(sessionString ? 'Found existing session, attempting to restore...' : 'No existing session found, starting fresh login...');
        // Create a new client instance
        client = new telegram_1.TelegramClient(new sessions_1.StringSession(sessionString || ''), // Use existing session or empty string for new session
        apiId, apiHash, {
            connectionRetries: 5,
        });
        // Start the client
        if (sessionString) {
            // Try to connect with existing session
            try {
                await client.connect();
                console.log('Successfully connected with existing session!');
            }
            catch (error) {
                console.log('Existing session expired, starting fresh login...');
                // Fall back to full authentication flow
                await startWithAuthentication();
            }
        }
        else {
            // No existing session, start full authentication flow
            await startWithAuthentication();
        }
        console.log('Successfully connected to Telegram!');
        // Save the session string for future use
        if (client.session) {
            const newSessionString = client.session.save();
            if (typeof newSessionString === 'string') {
                console.log('Session string:', newSessionString);
                console.log('🔄 Automatically updating .env file with new session string...');
                // Automatically update the .env file
                updateEnvFile(newSessionString);
            }
        }
    }
    catch (error) {
        console.error('Error during login:', error);
        throw error;
    }
}
function getClient() {
    return client;
}
async function disconnect() {
    if (client) {
        await client.disconnect();
        client = null;
    }
}
//# sourceMappingURL=telegram-client.js.map