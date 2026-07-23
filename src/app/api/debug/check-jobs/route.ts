import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const jobs = await prisma.productionJob.findMany({
      include: {
        order: {
          select: {
            orderNumber: true,
            customer: {
              select: {
                companyName: true
              }
            }
          }
        }
      }
    })

    const orders = await prisma.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        tenantId: true
      }
    })

    return NextResponse.json({ success: true, jobs, orders })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message })
  }
}
