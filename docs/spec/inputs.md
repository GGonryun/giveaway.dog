# Inputs

How the app reads values that people type or paste.

## X post URLs

- `TWEET-001` The id of a post is read from any valid X post URL.
- `TWEET-002` Reading a post id from any string returns either no id or ASCII digits, and never fails.
- `TWEET-003` Every way the app reads a post id agrees on any string.
- `TWEET-004` Reading a post id from a value that is not a string never fails.

## Audience table

- `USERS-001` Reading the query string of the audience table never fails.
- `USERS-002` The audience table always reads a query that the participant search accepts.
- `USERS-003` The audience table uses its defaults when the query string has no key that it knows.
- `USERS-004` A valid query of the audience table is the same after it goes through the query string.
- `USERS-005` The audience table reads only the first value of a repeated key.
