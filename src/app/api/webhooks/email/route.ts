import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenantId')

    if (!tenantId) {
      return new NextResponse('Missing tenantId', { status: 400 })
    }

    const formData = await req.formData()
    const fromRaw = formData.get('from') as string
    const subject = formData.get('subject') as string
    const text = formData.get('text') as string
    // const headers = formData.get('headers') as string

    if (!fromRaw || !text) {
      return new NextResponse('Missing fields', { status: 400 })
    }

    // Extract email from "Name <email@example.com>"
    const emailMatch = fromRaw.match(/<([^>]+)>/)
    const email = emailMatch ? emailMatch[1] : fromRaw.trim()
    const nameMatch = fromRaw.match(/^([^<]+)/)
    const name = nameMatch ? nameMatch[1].trim() : 'Unknown Sender'

    // Match or Create Lead based on Email
    let customerId = null
    let leadId = null

    const customer = await prisma.customer.findFirst({
      where: { tenantId, email }
    })

    if (customer) {
      customerId = customer.id
    } else {
      let lead = await prisma.lead.findFirst({
        where: { tenantId, email }
      })

      if (!lead) {
        lead = await prisma.lead.create({
          data: {
            tenantId,
            companyName: name,
            email,
            status: 'NEW',
            source: 'EMAIL',
          }
        })
      }
      leadId = lead.id
    }

    // Save the message
    await prisma.message.create({
      data: {
        tenantId,
        customerId,
        leadId,
        channel: 'EMAIL',
        direction: 'INBOUND',
        isFromCustomer: true,
        subject,
        body: text,
      }
    })

    // Create a Follow-up ToDo
    await prisma.followUp.create({
      data: {
        tenantId,
        customerId,
        leadId,
        title: `Respond to new Email from ${name}`,
        notes: `Subject: ${subject}\n\n"${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
        dueDate: new Date(), // Due today
      }
    })

    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('Email Webhook Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
