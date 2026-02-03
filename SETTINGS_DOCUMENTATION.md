# Settings Feature - API Key Management

## Overview

The Settings page allows users to securely manage their Gemini API keys. This feature ensures that API keys are encrypted before storage and never exposed to the client.

## Features

### 1. **Secure Storage**

- API keys are encrypted using AES-256-CBC encryption before being stored in the database
- Keys are never stored in plain text
- Keys are never sent to the client (only masked versions are displayed)

### 2. **User Interface**

- **Add API Key**: Users can add their Gemini API key through a password-masked input field
- **Update API Key**: Existing keys can be updated
- **Remove API Key**: Users can remove their stored API key
- **Masked Display**: Stored keys are displayed in a masked format (e.g., `AIza••••••••••••wKQ`)

### 3. **Security Features**

- Server-side encryption/decryption only
- JWT token-based authentication required
- Clear security disclaimers and usage instructions
- Link to obtain API key from Google AI Studio

## Setup

### Environment Variables

Add the following to your `.env.local` file:

```bash
ENCRYPTION_KEY=your-32-character-secret-key!!
```

**Important**: In production, use a strong, randomly generated 32-character key.

### Generating a Secure Encryption Key

You can generate a secure key using Node.js:

```javascript
const crypto = require("crypto");
console.log(crypto.randomBytes(16).toString("hex")); // Generates 32-char hex string
```

## API Endpoints

### GET `/api/settings/api-key`

Check if user has an API key stored.

**Response:**

```json
{
  "hasKey": true,
  "maskedKey": "AIza••••••••••••wKQ"
}
```

### POST `/api/settings/api-key`

Save or update user's API key.

**Request:**

```json
{
  "apiKey": "AIzaSyBravYKxsdT_KQS4ggHaRTiRr7ZnzLFwKQ"
}
```

**Response:**

```json
{
  "success": true,
  "message": "API key saved successfully",
  "maskedKey": "AIza••••••••••••wKQ"
}
```

### DELETE `/api/settings/api-key`

Remove user's API key.

**Response:**

```json
{
  "success": true,
  "message": "API key removed successfully"
}
```

## User Flow

1. **Access Settings**: Click on user profile → Settings
2. **Add API Key**:
   - Click "Settings" in the user menu
   - Enter Gemini API key in the password field
   - Click "Save"
3. **Update API Key**:
   - Click "Update" button
   - Enter new API key
   - Click "Save"
4. **Remove API Key**:
   - Click "Remove" button
   - Confirm deletion

## Security Considerations

1. **Encryption**: All API keys are encrypted using AES-256-CBC before storage
2. **No Client Exposure**: Decrypted keys are never sent to the client
3. **JWT Authentication**: All endpoints require valid JWT token in Authorization header
4. **Masked Display**: Only masked versions are shown in the UI
5. **HTTPS Required**: Always use HTTPS in production

## Database Schema

The `User` model includes an optional `apiKey` field:

```typescript
interface IUser {
  _id: string;
  email: string;
  password: string;
  name: string;
  bio?: string;
  banner?: string;
  avatar?: string;
  apiKey?: string; // Encrypted API key
  createdAt: Date;
}
```

## Components

### SettingsModal

- **Location**: `components/SettingsModal.tsx`
- **Props**:
  - `isOpen: boolean` - Controls modal visibility
  - `onClose: () => void` - Callback when modal is closed

### Styling

- **Location**: `components/SettingsModal.css`
- Follows the app's glassmorphism design system
- Includes animations and responsive feedback

## Usage in AppShell

```tsx
const [isSettingsOpen, setIsSettingsOpen] = useState(false);

// In user menu
<div onClick={() => setIsSettingsOpen(true)}>
  <Icons.Settings size={16} />
  <span>Settings</span>
</div>

// Render modal
<SettingsModal
  isOpen={isSettingsOpen}
  onClose={() => setIsSettingsOpen(false)}
/>
```

## Future Enhancements

1. Support for multiple API providers (OpenAI, Anthropic, etc.)
2. API usage tracking and limits
3. API key rotation reminders
4. Multiple API keys per user
5. Team/organization-level API key management
