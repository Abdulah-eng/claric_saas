import { PrismaClient, UserRole, SubscriptionPlan } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { hash } from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // ============================================================
  // Create Super Admin Tenant (platform owner)
  // ============================================================
  const platformTenant = await prisma.tenant.upsert({
    where: { slug: 'platform' },
    update: {},
    create: {
      name: 'Claric Platform',
      slug: 'platform',
      plan: SubscriptionPlan.ENTERPRISE,
      isActive: true,
    },
  })

  // ============================================================
  // Create Super Admin User
  // ============================================================
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL ?? 'admin@claric.io'
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD ?? 'ChangeMe123!'
  const passwordHash = await hash(superAdminPassword, 12)

  const superAdmin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: platformTenant.id, email: superAdminEmail } },
    update: {},
    create: {
      tenantId: platformTenant.id,
      email: superAdminEmail,
      passwordHash,
      name: 'Super Admin',
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      isSuperAdmin: true,
      emailVerified: new Date(),
      isActive: true,
    },
  })

  console.log(`✅ Super Admin created: ${superAdmin.email}`)

  // ============================================================
  // Create Demo Tenant
  // ============================================================
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'demo-company' },
    update: {},
    create: {
      name: 'Demo Company',
      slug: 'demo-company',
      plan: SubscriptionPlan.PROFESSIONAL,
      isActive: true,
    },
  })

  // Company profile
  await prisma.company.upsert({
    where: { tenantId: demoTenant.id },
    update: {},
    create: {
      tenantId: demoTenant.id,
      name: 'Demo Company Inc.',
      email: 'hello@demo-company.com',
      phone: '+1 555-0100',
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      country: 'US',
      postalCode: '10001',
      timezone: 'America/New_York',
      currency: 'USD',
    },
  })

  // Tenant settings
  await prisma.tenantSettings.upsert({
    where: { tenantId: demoTenant.id },
    update: {},
    create: {
      tenantId: demoTenant.id,
      quotePrefix: 'QT',
      orderPrefix: 'ORD',
      invoicePrefix: 'INV',
    },
  })

  // White label defaults
  await prisma.whiteLabelConfig.upsert({
    where: { tenantId: demoTenant.id },
    update: {},
    create: {
      tenantId: demoTenant.id,
      primaryColor: '#2563EB',
      secondaryColor: '#7C3AED',
      accentColor: '#0EA5E9',
    },
  })

  // Default tax rule
  await prisma.taxRule.upsert({
    where: { id: 'demo-tax-default' },
    update: {},
    create: {
      id: 'demo-tax-default',
      tenantId: demoTenant.id,
      name: 'Sales Tax',
      rate: 8.5,
      isDefault: true,
      isActive: true,
    },
  })

  // Demo Company Admin
  const adminHash = await hash('Demo123!', 12)
  const companyAdmin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: demoTenant.id, email: 'admin@demo-company.com' } },
    update: {},
    create: {
      tenantId: demoTenant.id,
      email: 'admin@demo-company.com',
      passwordHash: adminHash,
      name: 'Jane Smith',
      firstName: 'Jane',
      lastName: 'Smith',
      role: UserRole.COMPANY_ADMIN,
      emailVerified: new Date(),
      isActive: true,
    },
  })

  // Sales Rep
  const salesRep = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: demoTenant.id, email: 'sales@demo-company.com' } },
    update: {},
    create: {
      tenantId: demoTenant.id,
      email: 'sales@demo-company.com',
      passwordHash: adminHash,
      name: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.SALES_REP,
      emailVerified: new Date(),
      isActive: true,
    },
  })

  console.log(`✅ Demo Tenant created: ${demoTenant.slug}`)
  console.log(`✅ Company Admin: admin@demo-company.com / Demo123!`)
  console.log(`✅ Sales Rep: sales@demo-company.com / Demo123!`)

  // Default warehouse
  await prisma.warehouse.upsert({
    where: { id: 'demo-warehouse-default' },
    update: {},
    create: {
      id: 'demo-warehouse-default',
      tenantId: demoTenant.id,
      name: 'Main Warehouse',
      address: '123 Main Street',
      isDefault: true,
      isActive: true,
    },
  })

  // Sample categories
  const printCat = await prisma.category.upsert({
    where: { tenantId_slug: { tenantId: demoTenant.id, slug: 'printing' } },
    update: {},
    create: {
      tenantId: demoTenant.id,
      name: 'Printing',
      slug: 'printing',
      description: 'Custom print products',
      isActive: true,
    },
  })

  // Sample product
  await prisma.product.upsert({
    where: { tenantId_sku: { tenantId: demoTenant.id, sku: 'TSHIRT-001' } },
    update: {},
    create: {
      tenantId: demoTenant.id,
      categoryId: printCat.id,
      sku: 'TSHIRT-001',
      name: 'Custom T-Shirt',
      description: 'Premium quality custom printed t-shirt',
      basePrice: 25.00,
      unit: 'unit',
      isActive: true,
      isTaxable: true,
      tags: ['apparel', 'custom-print'],
    },
  })

  console.log('✅ Sample catalog data seeded')
  console.log('\n🎉 Database seeded successfully!')
  console.log('\nCredentials:')
  console.log(`  Super Admin: ${superAdminEmail} / ${superAdminPassword}`)
  console.log('  Company Admin: admin@demo-company.com / Demo123!')
  console.log('  Sales Rep: sales@demo-company.com / Demo123!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
