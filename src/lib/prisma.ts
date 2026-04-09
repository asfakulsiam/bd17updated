

import { Prisma, PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient();
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * Wraps a Prisma interactive transaction with retry logic for deadlocks.
 * @param operation The function to execute within the transaction.
 * @param options.retries Number of retries. Default is 3.
 * @param options.delay Delay between retries in ms. Default is 100.
 */
export async function withRetry<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
  options: { retries?: number; delay?: number, timeout?: number, maxWait?: number } = {}
): Promise<T> {
  const { retries = 3, delay = 100, timeout = 60000, maxWait = 60000 } = options;
  let lastError: unknown;

  for (let i = 0; i < retries; i++) {
    try {
      return await prisma.$transaction(operation, { timeout, maxWait });
    } catch (e: any) {
      lastError = e;
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2034') {
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i))); // Exponential backoff
          continue;
        }
      }
      // If it's not a deadlock error or retries are exhausted, re-throw.
      throw e;
    }
  }
  // This line should not be reachable, but is here for type safety.
  throw lastError;
}

