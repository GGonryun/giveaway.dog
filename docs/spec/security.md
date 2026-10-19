# Security

What the app accepts from requests that it does not trust: the cron routes, the webhooks of Discord and Twitch, the image uploads and the HTML that hosts write.

## Cron routes

- `CRON-001` A cron route accepts a request only when its `Authorization` header is exactly `Bearer <CRON_SECRET>`.
- `CRON-002` A cron route accepts a request with the exact secret.
- `CRON-003` A cron route refuses a header that differs from the expected one by one character.
- `CRON-004` A cron route refuses every request when `CRON_SECRET` is not set or is empty.

## Discord

- `DISCORD-001` The Discord webhook refuses a request without a valid signature as unauthorized, and never with another error.
- `DISCORD-002` The Discord webhook refuses any body other than the one that was signed.
- `DISCORD-003` The Discord webhook refuses any signature other than the one for the body and the timestamp.
- `DISCORD-004` The Discord webhook refuses a correctly signed request when a signature header is missing.
- `DISCORD-005` The Discord webhook refuses every request when its public key is malformed.
- `DISCORD-006` A correctly signed body is either a known interaction or a validation error.
- `DISCORD-101` The Discord interactions route answers 401 to a request without a valid signature.
- `DISCORD-201` Any JSON either fails validation or parses to an interaction that the handler routes.
- `DISCORD-202` A parsed interaction parses again to the same value.
- `DISCORD-203` Extra keys do not change how an interaction parses.

## Twitch

- `TWITCH-001` The Twitch webhook accepts a fresh, correctly signed JSON message and returns its body.
- `TWITCH-002` The Twitch webhook refuses any body other than the one that was signed.
- `TWITCH-003` The Twitch webhook refuses any signature other than the expected one.
- `TWITCH-004` The Twitch webhook refuses a correctly signed message when a required header is missing.
- `TWITCH-005` The Twitch webhook refuses a request without a valid signature as unauthorized, and never with another error.
- `TWITCH-006` The Twitch webhook refuses a correctly signed message whose timestamp is not fresh.
- `TWITCH-007` The Twitch webhook refuses a correctly signed body that is not JSON as a bad request.
- `TWITCH-101` The Twitch webhook route answers 401 to a request without a valid signature.
- `TWITCH-102` The Twitch webhook route answers 401 to a changed body or signature, and never a 5xx.
- `TWITCH-103` The Twitch webhook route answers 400 to a correctly signed body that is not JSON.

## Uploads

- `UPLOAD-001` The upload route answers any request body with 200 or a 4xx, and never a 5xx.
- `UPLOAD-002` An upload token allows only the allowed image types and the maximum size, whatever the path.
- `UPLOAD-003` The upload route answers a request without a session with a 4xx, and a token request without a session with 401.
- `UPLOAD-004` The upload route never moderates, stores or deletes a blob for a completed upload with a wrong signature.

## HTML

- `HTML-001` Sanitizing HTML never fails, and keeps only the allowed tags, attributes and URL schemes.
- `HTML-002` Sanitizing sanitized HTML changes nothing.
- `HTML-003` Converting HTML to Markdown never fails, and emits no raw HTML outside code.
- `HTML-004` Converting HTML to Markdown never emits a link to a `javascript:`, `vbscript:` or `data:` URL.
- `HTML-005` A giveaway page runs no script from the HTML that a host wrote in its description, its terms or a task description.
