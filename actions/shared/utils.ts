// Shared utilities for server actions

export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

export const generateRandomInRange = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const simulateNetworkDelay = async (n?: number): Promise<void> => {
  if (n) return await delay(n);
  await delay(generateRandomInRange(50, 200));
};
