# Production database compute (#652)

The production Postgres database is the Neon project `giveaway-dog-db` (`restless-recipe-80234614`, branch `main`, compute `ep-dark-morning-adgdmvmo`). Neon bills the time the compute runs, multiplied by its size in compute units (CU). This file records what kept it running in October 2026, and the changes that cut the cost, ranked by saving.

## Measurements (2026-10-01 to 2026-10-28)

| Metric                        | Value                                                                                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Active time                   | 2,404,803 s (668 h) of 2,418,000 s: the compute ran 99.5% of the period                                               |
| Compute time                  | 1,285,006 CU-s (357 CU-h), so 0.53 CU on average                                                                      |
| Compute size                  | 0.25 CU minimum, 0.5 CU maximum (the project default allows 8 CU), suspend after 300 s                                |
| Data transfer                 | 34.8 GB                                                                                                               |
| Storage                       | 1.43 GB, of which `TwitterPickerUser` is 1.06 GB (2.57 million rows)                                                  |
| Suspends                      | None from August until 2026-10-27. On 2026-10-28, 30 wakes and 1 h 30 min suspended in 24 h                           |
| Applied production migrations | Up to `20260407073024`. `20261019000000`, `20261026000000`, `20261028000000` and `20261028120000` are not applied yet |

At $0.14 per CU-hour (Launch plan), 357 CU-h cost about $50 for 28 days. The cost has two factors: how long the compute runs, and how many CU it uses while it runs. A compute that stayed at 0.25 CU for the same time would cost about $23.

## What keeps it busy

- **Full table scans**: Postgres does not index foreign keys, and the schema had no index on the columns that the app filters by. In `pg_stat_user_tables`, `TaskCompletion` (393,000 rows) had 68,520 sequential scans that read 9.5 billion rows, `UserQuality` (67,000 rows) 35,245 scans and no index scan, `Account` 22,055 scans, `Participant` (80,000 rows) 13,776 scans, `TwitterPickerUser` (2.57 million rows, 1 GB) 9,630 scans and `TwitterPickerDraw` 4,987 scans. One lookup of the completions of a participant took 46 ms and read 9,000 pages (70 MB). These scans keep the compute above 0.25 CU and make each request hold it longer
- **Real traffic**: entrants submit tasks on the giveaway pages (`POST /browse/<id>`) through the day, and each request reaches Postgres. Between the visits, the compute suspends only after 5 minutes without a query
- **Recurring task jobs**: 3 X and Bluesky import jobs scan their posts every 1.5 to 2.5 hours, so the cron reads Postgres about 12 times a day. These runs are due. Between them, the Redis schedule of `/api/jobs/process` (`@giveaway/jobs/schedule`) skips Postgres
- **Missing migrations**: `20261028120000` adds the unique index on `TwitterPickerUser(pickerId, userId)`. Production does not have it, so each read of the users of a picker scans the whole 1 GB table

## Ranked changes

| Rank | Change                                                                                                                                           | Estimated saving                                   | Where                 |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- | --------------------- |
| 1    | Index the foreign keys that the app filters by (migration `20261029000000`)                                                                      | Most of the CU above 0.25: up to $25 a month       | This pull request     |
| 2    | Apply the 5 pending migrations to production (`prisma:migrate:production`), which adds the `TwitterPickerUser` index                             | The scans of the 1 GB table, part of rank 1        | #685 (by hand)        |
| 3    | Serve the giveaway page and its task list from the Next.js cache or Redis for visitors, and read Postgres only for the entrant's own completions | Fewer wakes between entries                        | #686                  |
| 4    | Lengthen the interval of the recurring import jobs while a giveaway has no new entries, or run them only when someone opens the giveaway         | Up to 12 wakes (1 h at 0.25 CU) a day: about $1.30 | #687                  |
| 5    | Lower the suspend timeout from 300 s to the minimum that the plan allows, and keep the maximum at 0.5 CU                                         | Each wake runs for less time                       | Neon console, no code |
| 6    | Delete the `TwitterPickerUser` rows of old pickers, or move them to Redis with a TTL                                                             | Storage, and the cost of each scan that is left    | #688                  |

## Public list pages

`/browse`, `/history` and `/winners` exported `revalidate = 60`, which had no effect: the root layout reads the CSP nonce with `headers()`, so every page renders on each request, and the pages read Postgres through Prisma, not `fetch`. Their lists come from the `.cache()` of their procedures, with their own revalidate times (300 s for `/browse` and its hosts, 3600 s for `/history` and `/winners`) and the tags that the writes expire (#559). The exports are removed. A visitor who is not signed in reaches Postgres on these pages only when a cache entry expires. A signed-in visitor of `/browse` also reads their own participations (`getPublicSweepstakesParticipation`), which is not cached

## Progress (2026-10-29 20:27 UTC)

| Metric                            | Since the measurement above (about 20 h 45 min)                                  |
| --------------------------------- | -------------------------------------------------------------------------------- |
| Active time                       | 67,932 s of about 74,800 s: the compute ran about 91% of the time (99.5% before) |
| Compute time                      | 24,175 CU-s, so 0.36 CU on average (0.53 before)                                 |
| Applied production migrations     | Still up to `20260407073024`: the indexes of #689 are not in production yet      |
| Month to date (2026-10-01 to now) | 1,309,181 CU-s (364 CU-h), about $51                                             |

The `Production migrations` job of CI fails on every push to `main` since it was added, because the `PRODUCTION_POSTGRES_URL_NON_POOLING` secret of the `production-database` environment is not set. So `Checks` fails on `main`, no commit gets the production domains, and the migrations of rank 1 and 2 wait. Setting the secret and re-running the failed jobs of the last run on `main` applies them (#685)

## After the changes

Check the Neon project again a week after the migrations reach production: the average CU (compute time divided by active time) should fall toward 0.25, and `pg_stat_user_tables` should show index scans instead of sequential scans on the tables above.
