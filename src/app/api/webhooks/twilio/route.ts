import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenantId')

    if (!tenantId) {
      return new NextResponse('Missing tenantId', { status: 400 })
    }

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
      select: { twilioAccountSid: true, twilioAuthTokenEncrypted: true }
    })

    if (!settings || !settings.twilioAuthTokenEncrypted) {
      return new NextResponse('Twilio integration not configured for this tenant', { status: 403 })
    }

    // In a real production environment, you would use twilio.validateRequest() here
    // passing req.headers.get('x-twilio-signature') and the decrypted twilioAuthTokenEncrypted

    const text = await req.text()
    const params = new URLSearchParams(text)

    const from = params.get('From')
    const to = params.get('To')
    const body = params.get('Body')
    const messageSid = params.get('MessageSid')

    if (!from || !body) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // 1. Try to find an existing customer or lead by phone number
    let customerId = null
    let leadId = null

    const customer = await prisma.customer.findFirst({
      where: { tenantId, phone: from }
    })

    if (customer) {
      customerId = customer.id
    } else {
      const lead = await prisma.lead.findFirst({
        where: { tenantId, phone: from }
      })
      if (lead) {
        leadId = lead.id
      } else {
        // Create a new Lead
        const newLead = await prisma.lead.create({
          data: {
            tenantId,
            companyName: `Unknown Sender (${from})`,
            phone: from,
            status: 'NEW',
            source: 'SMS',
          }
        })
        leadId = newLead.id
      }
    }

    // 2. Save the message
    await prisma.message.create({
      data: {
        tenantId,
        customerId,
        leadId,
        channel: 'SMS',
        direction: 'INBOUND',
        isFromCustomer: true,
        body,
        externalId: messageSid,
      }
    })

    // Create a Follow-up ToDo
    await prisma.followUp.create({
      data: {
        tenantId,
        customerId,
        leadId,
        title: `Respond to new SMS`,
        notes: `Message: "${body.substring(0, 50)}${body.length > 50 ? '...' : ''}"`,
        dueDate: new Date(), // Due today
      }
    })

    // Return TwiML empty response
    return new NextResponse('<Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' }
    })
  } catch (error) {
    console.error('Twilio Webhook Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
