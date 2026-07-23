import Pusher from 'pusher'

let pusherServer: Pusher | null = null

export function getPusherServer(): Pusher {
  if (!pusherServer) {
    pusherServer = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    })
  }
  return pusherServer
}

/**
 * Channel naming conventions:
 * - private-tenant-{tenantId}             → all users of a tenant
 * - private-user-{userId}                 → specific user
 * - private-kanban-{tenantId}             → production Kanban board
 * - private-customer-{customerId}         → customer portal
 */

export const PUSHER_EVENTS = {
  NOTIFICATION: 'notification',
  KANBAN_CARD_MOVED: 'kanban.card.moved',
  KANBAN_CARD_UPDATED: 'kanban.card.updated',
  ORDER_STATUS_CHANGED: 'order.status.changed',
  ARTWORK_STATUS_CHANGED: 'artwork.status.changed',
  QUOTE_STATUS_CHANGED: 'quote.status.changed',
  MESSAGE_RECEIVED: 'message.received',
  INVOICE_PAID: 'invoice.paid',
} as const

export async function triggerTenantEvent(
  tenantId: string,
  event: string,
  data: unknown
) {
  const pusher = getPusherServer()
  await pusher.trigger(`private-tenant-${tenantId}`, event, data)
}

export async function triggerUserEvent(
  userId: string,
  event: string,
  data: unknown
) {
  const pusher = getPusherServer()
  await pusher.trigger(`private-user-${userId}`, event, data)
}

export async function triggerKanbanEvent(
  tenantId: string,
  event: string,
  data: unknown
) {
  const pusher = getPusherServer()
  await pusher.trigger(`private-kanban-${tenantId}`, event, data)
}

export async function triggerCustomerPortalEvent(
  customerId: string,
  event: string,
  data: unknown
) {
  const pusher = getPusherServer()
  await pusher.trigger(`private-customer-${customerId}`, event, data)
}
