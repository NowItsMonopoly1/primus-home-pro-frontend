// PRIMUS HOME PRO - Settings Page
// User account and app configuration

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { User, Bell, Shield, Palette, Building, Mail } from 'lucide-react'
import Link from 'next/link'

export default async function SettingsPage() {
  const { userId: clerkUserId } = await auth()

  if (!clerkUserId) {
    redirect('/sign-in')
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
  })

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <section className="mx-auto max-w-4xl space-y-8 p-6 md:p-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your account and application preferences
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle>Profile</CardTitle>
          </div>
          <CardDescription>
            Your personal information and account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input defaultValue={user.name || ''} placeholder="Your name" disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input defaultValue={user.email} type="email" disabled />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Profile information is managed through Clerk. Click the user menu to update.
          </p>
        </CardContent>
      </Card>

      {/* Business Info Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            <CardTitle>Business Information</CardTitle>
          </div>
          <CardDescription>
            Configure your business details for lead capture pages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Business Name</label>
              <Input placeholder="Primus Home Pro" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number</label>
              <Input placeholder="+1 (555) 123-4567" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Service Area</label>
              <Input placeholder="Dallas-Fort Worth, TX" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Website</label>
              <Input placeholder="https://yourcompany.com" />
            </div>
          </div>
          <Button disabled>Save Changes (Coming Soon)</Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>
            Configure how you receive alerts and updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <p className="font-medium">New Lead Alerts</p>
              <p className="text-sm text-muted-foreground">
                Get notified when new leads are captured
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Email</span>
              <div className="h-6 w-10 rounded-full bg-primary/20" />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <p className="font-medium">SMS Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive text alerts for urgent leads
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Coming Soon</span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <p className="font-medium">Weekly Reports</p>
              <p className="text-sm text-muted-foreground">
                Summary of your lead activity
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Coming Soon</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <CardTitle>Integrations</CardTitle>
          </div>
          <CardDescription>
            Connect external services to enhance your workflow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#6772E5]/10">
                <span className="text-lg font-bold text-[#6772E5]">S</span>
              </div>
              <div className="space-y-0.5">
                <p className="font-medium">Stripe</p>
                <p className="text-sm text-muted-foreground">Payment processing</p>
              </div>
            </div>
            <Link href="/dashboard/billing">
              <Button variant="outline" size="sm">Manage</Button>
            </Link>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F22F46]/10">
                <span className="text-lg font-bold text-[#F22F46]">T</span>
              </div>
              <div className="space-y-0.5">
                <p className="font-medium">Twilio</p>
                <p className="text-sm text-muted-foreground">SMS messaging</p>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>Connect</Button>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#000]/10">
                <span className="text-lg font-bold">R</span>
              </div>
              <div className="space-y-0.5">
                <p className="font-medium">Resend</p>
                <p className="text-sm text-muted-foreground">Email delivery</p>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>Connect</Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Subscription</CardTitle>
          </div>
          <CardDescription>
            Your current plan and billing information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
            <div>
              <p className="font-medium capitalize">{user.subscriptionPlan || 'Free'} Plan</p>
              <p className="text-sm text-muted-foreground">
                {user.subscriptionStatus === 'active'
                  ? `Active until ${user.subscriptionCurrentEnd?.toLocaleDateString()}`
                  : 'No active subscription'}
              </p>
            </div>
            <Link href="/dashboard/billing">
              <Button>Manage Billing</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-destructive/30 p-4">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive" disabled>Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
