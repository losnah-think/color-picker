import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { stripe } from "@/lib/stripe"
import { getPrismaClient } from "@/lib/prisma"
import Stripe from "stripe"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const prisma = getPrismaClient()
  const body = await request.text()
  const signature = (await headers()).get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error("Webhook signature verification failed:", error)
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.subscription && session.metadata?.userId) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          ) as any

          await prisma.subscription.update({
            where: {
              userId: session.metadata.userId,
            },
            data: {
              stripeSubscriptionId: subscription.id,
              stripePriceId: subscription.items.data[0]?.price.id,
              stripeCurrentPeriodEnd: new Date(
                subscription.current_period_end * 1000
              ),
              status: "ACTIVE",
              plan: getPlanFromPriceId(subscription.items.data[0]?.price.id || ""),
            },
          })
        }
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any
        
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          ) as any

          const dbSubscription = await prisma.subscription.findFirst({
            where: {
              stripeSubscriptionId: subscription.id,
            },
          })

          if (dbSubscription) {
            await prisma.subscription.update({
              where: {
                id: dbSubscription.id,
              },
              data: {
                stripeCurrentPeriodEnd: new Date(
                  subscription.current_period_end * 1000
                ),
                status: "ACTIVE",
              },
            })
          }
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as any

        const dbSubscription = await prisma.subscription.findFirst({
          where: {
            stripeSubscriptionId: subscription.id,
          },
        })

        if (dbSubscription) {
          await prisma.subscription.update({
            where: {
              id: dbSubscription.id,
            },
            data: {
              stripePriceId: subscription.items.data[0]?.price.id,
              stripeCurrentPeriodEnd: new Date(
                subscription.current_period_end * 1000
              ),
              status: subscription.status === "active" ? "ACTIVE" : "INACTIVE",
              plan: getPlanFromPriceId(subscription.items.data[0]?.price.id || ""),
            },
          })
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription

        const canceledSubscription = await prisma.subscription.findFirst({
          where: {
            stripeSubscriptionId: subscription.id,
          },
        })

        if (canceledSubscription) {
          await prisma.subscription.update({
            where: {
              id: canceledSubscription.id,
            },
            data: {
              status: "CANCELED",
              plan: "FREE",
            },
          })
        }
        break
      }
    }
  } catch (error) {
    console.error("Webhook handler error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }

  return NextResponse.json({ received: true })
}

function getPlanFromPriceId(priceId: string): "FREE" | "BASIC" | "PRO" | "ENTERPRISE" {
  if (priceId === process.env.STRIPE_BASIC_PRICE_ID) return "BASIC"
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "PRO"
  if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) return "ENTERPRISE"
  return "FREE"
}
