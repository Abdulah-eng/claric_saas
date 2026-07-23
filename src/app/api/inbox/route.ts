import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiServerError } from '@/lib/api-response'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { tenantId } = await requireTenant()

    // Fetch all messages, ordered by newest first
    const messages = await prisma.message.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, companyName: true, email: true, phone: true } },
        lead: { select: { id: true, companyName: true, email: true, phone: true } },
        sender: { select: { id: true, name: true } },
      },
    })

    // Group by Lead or Customer to form "Conversations"
    const conversationsMap = new Map()

    for (const msg of messages) {
      const contactId = msg.customerId || msg.leadId
      if (!contactId) continue

      const type = msg.customerId ? 'CUSTOMER' : 'LEAD'
      const contact = msg.customerId ? msg.customer : msg.lead
      
      if (!conversationsMap.has(contactId)) {
        conversationsMap.set(contactId, {
          contactId,
          type,
          contactName: contact?.companyName || 'Unknown',
          contactEmail: contact?.email,
          contactPhone: contact?.phone,
          lastMessageAt: msg.createdAt,
          lastMessageText: msg.body,
          channel: msg.channel, // Most recent channel used
          messages: [],
        })
      }

      // Add message to thread (messages are already ordered by desc, we might want asc for chat view, we'll reverse in UI)
      conversationsMap.get(contactId).messages.push(msg)
    }

    const conversations = Array.from(conversationsMap.values())
    
    // Sort conversations by lastMessageAt desc
    conversations.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())

    return apiSuccess(conversations)
  } catch (e) {
    return apiServerError(e)
  }
}

export async function POST(req: Request) {
  try {
    const { user, tenantId } = await requireTenant()
    const { contactId, type, body, channel } = await req.json()

    if (!contactId || !body || !channel) {
      return new Response('Missing fields', { status: 400 })
    }

    const message = await prisma.message.create({
      data: {
        tenantId,
        customerId: type === 'CUSTOMER' ? contactId : undefined,
        leadId: type === 'LEAD' ? contactId : undefined,
        senderId: user.id,
        direction: 'OUTBOUND',
        isFromCustomer: false,
        channel,
        body,
        isRead: true, // we sent it, so it's read
      },
      include: {
        sender: { select: { id: true, name: true } }
      }
    })

    // In a real app, this is where you would call the Twilio/SendGrid/FB API 
    // to actually dispatch the outbound message.

    return apiSuccess(message)
  } catch (e) {
    return apiServerError(e)
  }
}
