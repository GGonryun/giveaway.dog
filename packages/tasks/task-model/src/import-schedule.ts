const MINUTE_MS = 60 * 1000;

export const MAX_IMPORT_INTERVAL_MINUTES = 24 * 60;

const MAX_IMPORT_BACK_OFF_STEPS = 16;

export const toImportIdleRuns = ({
  idleRuns = 0,
  foundNew
}: {
  idleRuns?: number;
  foundNew: boolean;
}) => (foundNew ? 0 : idleRuns + 1);

export const toImportIntervalMinutes = ({
  baseMinutes,
  idleRuns
}: {
  baseMinutes: number;
  idleRuns: number;
}) =>
  Math.min(
    baseMinutes * 2 ** Math.min(idleRuns, MAX_IMPORT_BACK_OFF_STEPS),
    MAX_IMPORT_INTERVAL_MINUTES
  );

export const toNextImportRunAt = ({
  now,
  baseMinutes,
  idleRuns,
  endDate
}: {
  now: Date;
  baseMinutes: number;
  idleRuns: number;
  endDate?: Date | null;
}) => {
  if (endDate && now >= endDate) {
    return null;
  }

  const runAt =
    now.getTime() +
    toImportIntervalMinutes({ baseMinutes, idleRuns }) * MINUTE_MS;

  return new Date(Math.min(runAt, endDate?.getTime() ?? Infinity));
};
