import { vi, type Mock } from 'vitest';
import { Prisma, type PrismaClient } from '@prisma/client';

const PRISMA_METHODS = [
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'create',
  'createMany',
  'createManyAndReturn',
  'update',
  'updateMany',
  'updateManyAndReturn',
  'upsert',
  'delete',
  'deleteMany',
  'count',
  'aggregate',
  'groupBy'
] as const;

const CLIENT_METHODS = [
  '$transaction',
  '$queryRaw',
  '$queryRawUnsafe',
  '$executeRaw',
  '$executeRawUnsafe',
  '$connect',
  '$disconnect'
] as const;

export type PrismaMethod = (typeof PRISMA_METHODS)[number];

export type PrismaModelMock = Record<PrismaMethod, Mock>;

export type PrismaModelKey = Uncapitalize<Prisma.ModelName>;

export type PrismaMock = Record<PrismaModelKey, PrismaModelMock> &
  Record<(typeof CLIENT_METHODS)[number], Mock>;

const toModelKey = (name: string) =>
  (name.charAt(0).toLowerCase() + name.slice(1)) as PrismaModelKey;

const applyDefaults = (mock: PrismaMock) => {
  mock.$transaction.mockImplementation(async (arg: unknown) => {
    if (typeof arg === 'function') {
      return arg(mock);
    }
    if (Array.isArray(arg)) {
      return Promise.all(arg);
    }
    throw new Error('Unsupported $transaction argument in prisma mock');
  });
};

export const createPrismaMock = (): PrismaMock => {
  const mock = {} as PrismaMock;
  for (const name of Object.values(Prisma.ModelName)) {
    const model = {} as PrismaModelMock;
    for (const method of PRISMA_METHODS) {
      model[method] = vi.fn();
    }
    mock[toModelKey(name)] = model;
  }
  for (const method of CLIENT_METHODS) {
    mock[method] = vi.fn();
  }
  applyDefaults(mock);
  return mock;
};

export const resetPrismaMock = (mock: PrismaMock) => {
  for (const name of Object.values(Prisma.ModelName)) {
    const model = mock[toModelKey(name)];
    for (const method of PRISMA_METHODS) {
      model[method].mockReset();
    }
  }
  for (const method of CLIENT_METHODS) {
    mock[method].mockReset();
  }
  applyDefaults(mock);
};

export const prismaMock = createPrismaMock();

export const asPrismaClient = (mock: PrismaMock = prismaMock) =>
  mock as unknown as PrismaClient;

export const knownRequestError = (code: string, message = 'Prisma error') =>
  new Prisma.PrismaClientKnownRequestError(message, {
    code,
    clientVersion: 'test'
  });
