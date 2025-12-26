import { getPrismaClient } from './prisma'

export async function checkSubscription(userId: string) {
  if (!userId) {
    return false
  }

  const prisma = getPrismaClient()
  const subscription = await prisma.subscription.findUnique({
    where: {
      userId,
    },
  })

  if (!subscription) {
    return false
  }

  // 구독이 활성화되어 있고, 만료일이 지나지 않았는지 확인
  const isValid =
    subscription.status === 'ACTIVE' &&
    subscription.stripeCurrentPeriodEnd &&
    subscription.stripeCurrentPeriodEnd.getTime() > Date.now()

  return isValid
}

export async function getUserSubscription(userId: string) {
  if (!userId) {
    return null
  }

  const prisma = getPrismaClient()
  const subscription = await prisma.subscription.findUnique({
    where: {
      userId,
    },
  })

  return subscription
}
