/**
 * Billing & Subscription Module
 * Handles Stripe integration, plan management, and usage tracking
 */

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Subscription Plans Configuration
export const PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    leads_per_month: 50,
    sms_included: 50,
    users_limit: 1,
    features: ['Basic SMS responses', 'Lead tracking', 'Admin dashboard']
  },
  BASIC: {
    id: 'basic',
    name: 'Basic',
    price: 2900, // $29.00 in cents
    price_id: process.env.STRIPE_BASIC_PRICE_ID,
    leads_per_month: 200,
    sms_included: 200,
    users_limit: 3,
    features: ['Everything in Free', 'Priority SMS', 'Team collaboration', 'Export data']
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 9900, // $99.00 in cents
    price_id: process.env.STRIPE_PRO_PRICE_ID,
    leads_per_month: -1, // Unlimited
    sms_included: -1, // Unlimited
    users_limit: -1, // Unlimited
    features: ['Everything in Basic', 'Unlimited leads', 'Unlimited SMS', 'Unlimited users', 'Priority support', 'Custom integrations']
  }
};

/**
 * Create Stripe checkout session for subscription
 */
export async function createCheckoutSession(organizationId, planId, customerEmail, successUrl, cancelUrl) {
  const plan = PLANS[planId.toUpperCase()];

  if (!plan || plan.id === 'free') {
    throw new Error('Invalid plan for checkout');
  }

  const session = await stripe.checkout.sessions.create({
    customer_email: customerEmail,
    payment_method_types: ['card'],
    line_items: [
      {
        price: plan.price_id,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      organization_id: organizationId.toString(),
      plan_id: plan.id
    },
    subscription_data: {
      metadata: {
        organization_id: organizationId.toString(),
        plan_id: plan.id
      }
    }
  });

  return session;
}

/**
 * Create Stripe customer portal session for subscription management
 */
export async function createPortalSession(stripeCustomerId, returnUrl) {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Handle Stripe webhook events
 */
export async function handleWebhookEvent(event, db) {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object, db);
      break;

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object, db);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object, db);
      break;

    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object, db);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object, db);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

/**
 * Handle successful checkout
 */
async function handleCheckoutCompleted(session, db) {
  const organizationId = parseInt(session.metadata.organization_id);
  const planId = session.metadata.plan_id;
  const subscriptionId = session.subscription;
  const customerId = session.customer;

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Update organization with subscription info
  db.prepare(`
    UPDATE organizations
    SET
      plan_id = ?,
      stripe_customer_id = ?,
      stripe_subscription_id = ?,
      subscription_status = ?,
      current_period_start = ?,
      current_period_end = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    planId,
    customerId,
    subscriptionId,
    subscription.status,
    new Date(subscription.current_period_start * 1000).toISOString(),
    new Date(subscription.current_period_end * 1000).toISOString(),
    organizationId
  );

  // Reset usage for new billing period
  resetUsage(db, organizationId);

  console.log(`Subscription activated for organization ${organizationId}: ${planId}`);
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(subscription, db) {
  const organizationId = parseInt(subscription.metadata.organization_id);

  db.prepare(`
    UPDATE organizations
    SET
      subscription_status = ?,
      current_period_start = ?,
      current_period_end = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE stripe_subscription_id = ?
  `).run(
    subscription.status,
    new Date(subscription.current_period_start * 1000).toISOString(),
    new Date(subscription.current_period_end * 1000).toISOString(),
    subscription.id
  );

  console.log(`Subscription updated for organization ${organizationId}: ${subscription.status}`);
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionDeleted(subscription, db) {
  const organizationId = parseInt(subscription.metadata.organization_id);

  // Downgrade to free plan
  db.prepare(`
    UPDATE organizations
    SET
      plan_id = 'free',
      subscription_status = 'canceled',
      stripe_subscription_id = NULL,
      updated_at = CURRENT_TIMESTAMP
    WHERE stripe_subscription_id = ?
  `).run(subscription.id);

  console.log(`Subscription canceled for organization ${organizationId}, downgraded to free`);
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice, db) {
  const subscriptionId = invoice.subscription;

  if (subscriptionId) {
    db.prepare(`
      UPDATE organizations
      SET subscription_status = 'active', updated_at = CURRENT_TIMESTAMP
      WHERE stripe_subscription_id = ?
    `).run(subscriptionId);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice, db) {
  const subscriptionId = invoice.subscription;

  if (subscriptionId) {
    db.prepare(`
      UPDATE organizations
      SET subscription_status = 'past_due', updated_at = CURRENT_TIMESTAMP
      WHERE stripe_subscription_id = ?
    `).run(subscriptionId);
  }
}

/**
 * Check if organization can create more leads this month
 */
export function canCreateLead(db, organizationId) {
  const org = db.prepare(`
    SELECT plan_id, leads_this_month
    FROM organizations
    WHERE id = ?
  `).get(organizationId);

  if (!org) {
    return { allowed: false, reason: 'Organization not found' };
  }

  const plan = PLANS[org.plan_id.toUpperCase()];

  if (!plan) {
    return { allowed: false, reason: 'Invalid plan' };
  }

  // Unlimited leads for Pro plan
  if (plan.leads_per_month === -1) {
    return { allowed: true };
  }

  // Check limit
  if (org.leads_this_month >= plan.leads_per_month) {
    return {
      allowed: false,
      reason: `Monthly lead limit reached (${plan.leads_per_month}). Upgrade your plan for more leads.`,
      limit: plan.leads_per_month,
      current: org.leads_this_month
    };
  }

  return { allowed: true };
}

/**
 * Increment lead count for organization
 */
export function incrementLeadCount(db, organizationId) {
  db.prepare(`
    UPDATE organizations
    SET
      leads_this_month = leads_this_month + 1,
      leads_total = leads_total + 1,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(organizationId);
}

/**
 * Reset monthly usage counters
 */
export function resetUsage(db, organizationId) {
  db.prepare(`
    UPDATE organizations
    SET
      leads_this_month = 0,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(organizationId);
}

/**
 * Get organization's subscription info
 */
export function getSubscriptionInfo(db, organizationId) {
  const org = db.prepare(`
    SELECT
      plan_id,
      subscription_status,
      leads_this_month,
      leads_total,
      current_period_start,
      current_period_end,
      stripe_customer_id
    FROM organizations
    WHERE id = ?
  `).get(organizationId);

  if (!org) {
    return null;
  }

  const plan = PLANS[org.plan_id.toUpperCase()];

  return {
    plan: {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      features: plan.features
    },
    status: org.subscription_status || 'active',
    usage: {
      leads_this_month: org.leads_this_month || 0,
      leads_limit: plan.leads_per_month,
      leads_remaining: plan.leads_per_month === -1
        ? 'Unlimited'
        : Math.max(0, plan.leads_per_month - (org.leads_this_month || 0))
    },
    billing_period: {
      start: org.current_period_start,
      end: org.current_period_end
    },
    stripe_customer_id: org.stripe_customer_id
  };
}

/**
 * Get all available plans (for display)
 */
export function getAllPlans() {
  return Object.values(PLANS).map(plan => ({
    id: plan.id,
    name: plan.name,
    price: plan.price,
    price_formatted: plan.price === 0 ? 'Free' : `$${(plan.price / 100).toFixed(2)}/mo`,
    leads_per_month: plan.leads_per_month === -1 ? 'Unlimited' : plan.leads_per_month,
    users_limit: plan.users_limit === -1 ? 'Unlimited' : plan.users_limit,
    features: plan.features
  }));
}
