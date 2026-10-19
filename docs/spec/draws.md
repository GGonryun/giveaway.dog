# Draws

How the app picks the winners of a giveaway. A draw gives a prize to one task completion. A completion's weight is the number of entries it is worth (see `entries.md`).

- `DRAW-001` An entry with a weight of 0 or less never wins.
- `DRAW-002` When multiple wins are off, a user wins at most one prize per giveaway.
- `DRAW-003` A user who was drawn before in a giveaway, including one who was disqualified, is not drawn again when multiple wins are off.
- `DRAW-004` The number of winners of a prize never exceeds its quota.
- `DRAW-005` Every winner is one of the eligible completions of the giveaway.
- `DRAW-006` A draw for several winners returns no entry twice, and returns as many winners as it asked for, or every entry with a positive weight when there are fewer.
- `DRAW-007` Each entry is drawn with a chance in proportion to its weight.
- `DRAW-008` Every entry with a positive weight can win.
- `DRAW-009` When participants choose their prize, a winner only wins a prize that they chose.
- `DRAW-010` When multiple wins are on, a draw fills every empty slot of a prize that has an eligible completion.
- `SLOT-001` A prize has as many empty slots as its quota minus its winners, and never fewer than 0. A prize with no quota has a quota of 1.
- `RNG-001` Shuffling a list returns the same items in some order, and leaves the original list unchanged.
- `RNG-002` A random number between two bounds is an integer within both bounds.
  x
