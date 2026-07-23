import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const email = 'mabdulaharshad@gmail.com'
    
    const user = await prisma.user.findFirst({
      where: { email },
      include: { tenant: true }
    })
    
    if (!user || !user.tenant) {
      return NextResponse.json({ error: 'Could not find user or tenant for ' + email })
    }
    
    const tenantId = user.tenant.id
    const userId = user.id
    
    // Create Customers
    const customer1 = await prisma.customer.create({
      data: {
        tenantId,
        companyName: `Acme Corp ${Date.now()}`,
        type: 'BUSINESS',
        isActive: true,
        email: `contact${Date.now()}@acmecorp.com`,
        phone: '555-0100',
      }
    })
    
    const customer2 = await prisma.customer.create({
      data: {
        tenantId,
        companyName: `John Doe ${Date.now()}`,
        type: 'INDIVIDUAL',
        isActive: true,
        email: `john.doe${Date.now()}@example.com`,
        phone: '555-0101',
      }
    })
    
    // Create Contacts
    await prisma.contact.create({
      data: {
        tenantId,
        customerId: customer1.id,
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@acmecorp.com',
        isPrimary: true,
      }
    })

    // Create Products
    const product1 = await prisma.product.create({
      data: {
        tenantId,
        name: 'Premium Business Cards',
        sku: `BC-PREM-${Date.now()}`,
        basePrice: 45.00,
        description: 'High quality double-sided business cards',
        isActive: true,
      }
    })

    const product2 = await prisma.product.create({
      data: {
        tenantId,
        name: 'Custom T-Shirts',
        sku: `TS-CUST-${Date.now()}`,
        basePrice: 25.00,
        description: 'Screen printed cotton t-shirts',
        isActive: true,
      }
    })

    // Create Quotes
    const quote1 = await prisma.quote.create({
      data: {
        tenantId,
        customerId: customer1.id,
        createdById: userId,
        quoteNumber: 'QT-' + Date.now().toString().slice(-4),
        status: 'APPROVED',
        subtotal: 450.00,
        taxAmount: 45.00,
        total: 495.00,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: {
          create: [
            {
              productId: product1.id,
              description: product1.name,
              quantity: 10,
              unitPrice: 45.00,
              total: 450.00,
              sortOrder: 0
            }
          ]
        }
      }
    })
    
    const quote2 = await prisma.quote.create({
      data: {
        tenantId,
        customerId: customer2.id,
        createdById: userId,
        quoteNumber: 'QT-' + (Date.now() + 1).toString().slice(-4),
        status: 'DRAFT',
        subtotal: 250.00,
        taxAmount: 25.00,
        total: 275.00,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: {
          create: [
            {
              productId: product2.id,
              description: product2.name,
              quantity: 10,
              unitPrice: 25.00,
              total: 275.00,
              sortOrder: 0
            }
          ]
        }
      }
    })

    // Create Orders
    const order1 = await prisma.order.create({
      data: {
        tenantId,
        customerId: customer1.id,
        quoteId: quote1.id,
        orderNumber: 'ORD-' + Date.now().toString().slice(-4),
        status: 'CONFIRMED',
        subtotal: 450.00,
        taxAmount: 45.00,
        discountAmount: 0.00,
        total: 495.00,
        items: {
          create: [
            {
              productId: product1.id,
              description: product1.name,
              quantity: 10,
              unitPrice: 45.00,
              total: 450.00,
              sortOrder: 0
            }
          ]
        }
      }
    })

    // Create Production Jobs
    await prisma.productionJob.create({
      data: {
        tenantId,
        orderId: order1.id,
        title: 'Business Cards for Acme',
        status: 'IN_PROGRESS',
        stage: 'PRE_PRESS',
        priority: 1,
      }
    })
    
    // Create Inbox Message
    await prisma.message.create({
      data: {
        tenantId,
        customerId: customer1.id,
        channel: 'EMAIL',
        direction: 'INBOUND',
        subject: 'Question about business cards',
        body: 'Hi, do you offer foil stamping?',
        isFromCustomer: true,
      }
    })

    return NextResponse.json({ success: true, message: 'Seeded successfully for ' + email })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: String(error?.message || error) }, { status: 500 })
  }
}
