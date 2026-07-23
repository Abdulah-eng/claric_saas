import { requireTenant } from '@/lib/auth-helpers'
import { apiServerError, apiNotFound } from '@/lib/api-response'
import { getInvoiceById } from '@/lib/queries/invoices'
import { generateInvoicePdfBuffer } from '@/lib/pdf'
import { prisma } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Params) {
  try {
    const { tenantId } = await requireTenant()
    const { id } = await params
    
    const invoice = await getInvoiceById(tenantId, id)
    if (!invoice) return apiNotFound('Invoice')

    const company = await prisma.company.findFirst({ where: { tenantId } })

    const pdfBuffer = await generateInvoicePdfBuffer(invoice, {
      companyName: company?.name,
      address: company?.address,
      email: company?.email,
    })

    return new Response(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      },
    })
  } catch (e) {
    return apiServerError(e)
  }
}
