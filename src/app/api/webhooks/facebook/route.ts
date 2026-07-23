import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Facebook requires verifying the webhook via a GET challenge
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  // In production, verify against your environment variable FB_VERIFY_TOKEN
  if (mode === 'subscribe' && token === 'my_verify_token') {
    return new NextResponse(challenge, { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenantId')

    if (!tenantId) {
      return new NextResponse('Missing tenantId', { status: 400 })
    }

    const body = await req.json()

    // Make sure this is a page subscription
    if (body.object !== 'page') {
      return new NextResponse('Not a page event', { status: 404 })
    }

    // Iterate over each entry
    for (const entry of body.entry) {
      // Get the message
      const webhookEvent = entry.messaging?.[0]
      if (!webhookEvent) continue

      const senderPsid = webhookEvent.sender?.id
      const message = webhookEvent.message
      
      if (!message || !message.text) continue // Ignore non-text messages for now

      // Match or Create Lead based on Facebook Page-Scoped ID (PSID)
      let lead = await prisma.lead.findFirst({
        where: { tenantId, email: `${senderPsid}@facebook.local` }
      })

      if (!lead) {
        lead = await prisma.lead.create({
          data: {
            tenantId,
            companyName: `Facebook User (${senderPsid})`,
            email: `${senderPsid}@facebook.local`,
            status: 'NEW',
            source: 'FACEBOOK',
          }
        })
      }

      // Save the message
      await prisma.message.create({
        data: {
          tenantId,
          leadId: lead.id,
          channel: 'FACEBOOK',
          direction: 'INBOUND',
          isFromCustomer: true,
          body: message.text,
          externalId: message.mid,
        }
      })

      // Create a Follow-up ToDo
      await prisma.followUp.create({
        data: {
          tenantId,
          leadId: lead.id,
          title: `Respond to new Facebook message`,
          notes: `Message: "${message.text.substring(0, 50)}${message.text.length > 50 ? '...' : ''}"`,
          dueDate: new Date(), // Due today
        }
      })
    }

    // Returns a '200 OK' response to all requests
    return new NextResponse('EVENT_RECEIVED', { status: 200 })
  } catch (error) {
    console.error('Facebook Webhook Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
