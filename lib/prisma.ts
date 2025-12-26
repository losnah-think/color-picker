import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const getPrismaClient = (): PrismaClient => {
  if (!globalForPrisma.prisma) {
    // 환경 변수 로깅 (프로덕션 디버깅용)
    if (process.env.NODE_ENV === 'production') {
      console.log('Database URLs in production:', {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasDirectUrl: !!process.env.DATABASE_DIRECT_URL,
        databaseUrlStart: process.env.DATABASE_URL?.substring(0, 50),
        directUrlStart: process.env.DATABASE_DIRECT_URL?.substring(0, 50),
      })
    }

    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'warn', 'error'] 
        : ['error'],
      errorFormat: 'pretty',
    })
  }
  return globalForPrisma.prisma
}

export { getPrismaClient as prisma }
