import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const client = createPrismaClient();
    if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
    return client;
  }
  return globalForPrisma.prisma;
}

// Lazy proxy: constructing the real client (and reading DATABASE_URL) is
// deferred to first actual query. Next.js imports every route module during
// `next build` to collect page config, without calling the handlers — if
// this threw at module scope, a missing DATABASE_URL in the build
// environment would fail the entire build even though no route ran.
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getPrismaClient(), prop, receiver);
  },
});
