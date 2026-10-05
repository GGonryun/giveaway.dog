## Twitch

### Authorizing the Bot to the App

Request the correct permissions from Twitch as the bot user:

```bash
https://id.twitch.tv/oauth2/authorize?client_id=TWITCH_CLIENT_ID&redirect_uri=http://localhost:3000/api/twitch/callback&response_type=code&scope=user:write:chat%20user:read:chat%20user:bot%20chat:read%20chat:edit%20channel:bot
```

Exchange the authorization code for an access token:

```bash
curl -X POST 'https://id.twitch.tv/oauth2/token' \
  -d 'client_id=TWITCH_CLIENT_ID' \
  -d 'client_secret=TWITCH_CLIENT_SECRET' \
  -d 'code=AUTH_CODE_FROM_RESPONSE' \
  -d 'grant_type=authorization_code' \
  -d 'redirect_uri=http://localhost:3000/api/twitch/callback'
```

### Getting Twitch User ID

Getting User Auth Token

```bash
https://id.twitch.tv/oauth2/authorize?client_id=TWITCH_CLIENT_ID&redirect_uri=http://localhost:3000/api/twitch/callback&response_type=token&scope='user:read:chat user:bot'
```

After authorizing, you will be redirected to the redirect_uri with the access token in the URL fragment. Extract the access token from the URL.
Use the access token to get the user ID:

```bash
curl -X GET "https://api.twitch.tv/helix/users?login=TWITCH_BOT_USERNAME" \
-H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
-H "Client-Id: TWITCH_CLIENT_ID"
```

Your data will look like this:

```json
{
  "data": [
    {
      "id": "1430741885",
      "login": "giveawaydog",
      "display_name": "GiveawayDog",
      "type": "",
      "broadcaster_type": "",
      "description": "",
      "profile_image_url": "https://static-cdn.jtvnw.net/jtv_user_pictures/33d6ab73-b3ee-49b6-9e8e-74bd6bafcb6a-profile_image-300x300.png",
      "offline_image_url": "",
      "view_count": 0,
      "created_at": "2026-01-22T06:38:58Z"
    }
  ]
}
```

## Discord

### Managing Discord Application Commands

Discord supports two types of slash commands:

- **Guild Commands**: Instantly available in specific servers (for testing/development)
- **Global Commands**: Available in all servers where the bot is installed (can take up to 1 hour to propagate)

**When to use which:**

- Use guild commands for development and testing
- Use global commands for production deployment

---

**Environment Variables**

```
DISCORD_BOT_TOKEN=
DISCORD_BOT_APPLICATION_ID=1461273011201118360
DISCORD_BOT_GUILD_ID=1425715950988034130
```

### Global Commands (Production)

#### Create a Global Command

```bash
curl -X POST "https://discord.com/api/v10/applications/$DISCORD_BOT_APPLICATION_ID/commands" \
-H "Authorization: Bot $DISCORD_BOT_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "name": "connect",
  "description": "Connect this Discord server to Giveaway Dog",
  "type": 1,
  "options": [
    {
      "name": "key",
      "description": "Your Giveaway Dog connection key",
      "type": 3,
      "required": true
    }
  ]
}'
```

##### Saved Commands

```JSON
{"id":"1462676123593871556","application_id":"1400366638649446450","version":"1462676123593871557","default_member_permissions":null,"type":1,"name":"connect","name_localizations":null,"description":"Connect this Discord server to Giveaway Dog","description_localizations":null,"dm_permission":true,"contexts":null,"integration_types":[0,1],"options":[{"type":3,"name":"key","name_localizations":null,"description":"Your Giveaway Dog connection key","description_localizations":null,"required":true}],"nsfw":false}
```

**Note:** Global commands can take up to 1 hour to appear in all servers.

#### List Global Commands

```bash
curl -X GET "https://discord.com/api/v10/applications/$DISCORD_BOT_APPLICATION_ID/commands" \
-H "Authorization: Bot $DISCORD_BOT_TOKEN"
```

#### Update a Global Command

```bash
curl -X PATCH "https://discord.com/api/v10/applications/$DISCORD_BOT_APPLICATION_ID/commands/$COMMAND_ID" \
-H "Authorization: Bot $DISCORD_BOT_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "name": "connect",
  "description": "Connect this Discord server to Giveaway Dog (updated)",
  "type": 1,
  "options": [
    {
      "name": "key",
      "description": "Your Giveaway Dog connection key",
      "type": 3,
      "required": true
    }
  ]
}'
```

#### Delete a Global Command

```bash
curl -X DELETE "https://discord.com/api/v10/applications/$DISCORD_BOT_APPLICATION_ID/commands/$COMMAND_ID" \
-H "Authorization: Bot $DISCORD_BOT_TOKEN"
```

#### Bulk Overwrite Global Commands

This replaces all existing global commands with the ones provided:

```bash
curl -X PUT "https://discord.com/api/v10/applications/$DISCORD_BOT_APPLICATION_ID/commands" \
-H "Authorization: Bot $DISCORD_BOT_TOKEN" \
-H "Content-Type: application/json" \
-d '[
  {
    "name": "connect",
    "description": "Connect this Discord server to Giveaway Dog",
    "type": 1,
    "options": [
      {
        "name": "key",
        "description": "Your Giveaway Dog connection key",
        "type": 3,
        "required": true
      }
    ]
  },
  {
    "name": "ping",
    "description": "Check if the bot is responding",
    "type": 1
  }
]'
```

---

### Guild Commands (Development/Testing)

#### Create a Guild Command

```bash
curl -X POST "https://discord.com/api/v10/applications/$DISCORD_BOT_APPLICATION_ID/guilds/$DISCORD_BOT_GUILD_ID/commands" \
-H "Authorization: Bot $DISCORD_BOT_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "name": "connect",
  "description": "Connect this Discord server to Giveaway Dog",
  "type": 1,
  "options": [
    {
      "name": "key",
      "description": "Your Giveaway Dog connection key",
      "type": 3,
      "required": true
    }
  ]
}'
```

#### List Guild Commands

```bash
curl -X GET "https://discord.com/api/v10/applications/$DISCORD_BOT_APPLICATION_ID/guilds/$DISCORD_BOT_GUILD_ID/commands" \
-H "Authorization: Bot $DISCORD_BOT_TOKEN"
```

#### Delete a Guild Command

```bash
curl -X DELETE "https://discord.com/api/v10/applications/$DISCORD_BOT_APPLICATION_ID/guilds/$DISCORD_BOT_GUILD_ID/commands/$COMMAND_ID" \
-H "Authorization: Bot $DISCORD_BOT_TOKEN"
```
