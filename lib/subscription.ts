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

  // 구독이 활성화되어 있는지만 확인
  // Stripe 기반 만료일 확인은 선택적
  const isValid =
    subscription.status === 'ACTIVE' &&
    (
      // Stripe 구독인 경우: 만료일 확인
      (subscription.stripeCurrentPeriodEnd && subscription.stripeCurrentPeriodEnd.getTime() > Date.now()) ||
      // 일반 구독인 경우: status만 확인
      (!subscription.stripeCurrentPeriodEnd)
    )

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
