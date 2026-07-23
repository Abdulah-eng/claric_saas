import { Queue, Worker, type Job } from 'bullmq'
import { Redis } from 'ioredis'

let connection: Redis | null = null

function getRedisConnection() {
  if (!connection) {
    connection = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    })
  }
  return connection
}

// ============================================================
// Queue definitions
// ============================================================

export const emailQueue = new Queue('email', {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
})

export const pdfQueue = new Queue('pdf', {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 5000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 25 },
  },
})

export const notificationQueue = new Queue('notification', {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { count: 200 },
  },
})

export const reportQueue = new Queue('report', {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 10000 },
    removeOnComplete: { count: 20 },
    removeOnFail: { count: 10 },
  },
})

// ============================================================
// Job type definitions
// ============================================================

export type EmailJobData = {
  tenantId: string
  to: string | string[]
  subject: string
  templateId?: string
  variables?: Record<string, string>
  html?: string
  from?: string
}

export type PdfJobData = {
  tenantId: string
  type: 'quote' | 'invoice' | 'report'
  entityId: string
  userId: string
}

export type NotificationJobData = {
  tenantId: string
  userId: string
  type: string
  title: string
  body: string
  link?: string
  metadata?: Record<string, unknown>
}

export type ReportJobData = {
  tenantId: string
  userId: string
  type: string
  params: Record<string, unknown>
  emailTo?: string
}

// ============================================================
// Queue helpers
// ============================================================

export async function enqueueEmail(data: EmailJobData) {
  return emailQueue.add('send-email', data)
}

export async function enqueuePdf(data: PdfJobData) {
  return pdfQueue.add('generate-pdf', data)
}

export async function enqueueNotification(data: NotificationJobData) {
  return notificationQueue.add('send-notification', data)
}

export async function enqueueReport(data: ReportJobData) {
  return reportQueue.add('generate-report', data)
}
