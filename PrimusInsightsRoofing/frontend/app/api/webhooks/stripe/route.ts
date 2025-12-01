// PRIMUS HOME PRO - Stripe Webhook Handler
// Syncs subscription status from Stripe events

import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/billing/stripe'
import { prisma } from '@/lib/db/prisma'
import type Stripe from 'stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('Stripe-Signature')

  if (!signature) {
    return new NextResponse('Missing Stripe signature', { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return new NextResponse('Webhook Error', { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (!session?.metadata?.userId) {
          console.error('Missing userId in session metadata')
          return new NextResponse('User ID missing', { status: 400 })
        }

        // Retrieve subscription details
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        ) as Stripe.Subscription

        // Get the first subscription item's current_period_end
        const currentPeriodEnd = subscription.items.data[0]?.current_period_end

        // Update user with subscription info
        await prisma.user.update({
          where: { id: session.metadata.userId },
          data: {
            stripeCustomer: session.customer as string,
            subscriptionPlan: session.metadata.planId,
            subscriptionStatus: subscription.status,
            subscriptionCurrentEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
          },
        })

        console.log(`✓ Subscription activated for user ${session.metadata.userId}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata.userId

        if (!userId) {
          console.error('Missing userId in subscription metadata')
          break
        }

        // Get the first subscription item's current_period_end
        const currentPeriodEnd = subscription.items.data[0]?.current_period_end

        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: subscription.status,
            subscriptionCurrentEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
          },
        })

        console.log(`✓ Subscription updated for user ${userId}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata.userId

        if (!userId) {
          console.error('Missing userId in subscription metadata')
          break
        }

        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionPlan: 'free',
            subscriptionStatus: 'canceled',
            subscriptionCurrentEnd: null,
          },
        })

        console.log(`✓ Subscription canceled for user ${userId}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new NextResponse('Webhook handler failed', { status: 500 })
  }
}
