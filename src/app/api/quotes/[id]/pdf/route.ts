import { requireTenant } from '@/lib/auth-helpers'
import { apiServerError, apiNotFound } from '@/lib/api-response'
import { getQuoteById } from '@/lib/queries/quoting'
import { generateQuotePdfBuffer } from '@/lib/pdf'
import { prisma } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Params) {
  try {
    const { tenantId } = await requireTenant()
    const { id } = await params
    
    const quote = await getQuoteById(tenantId, id)
    if (!quote) return apiNotFound('Quote')

    const company = await prisma.company.findFirst({ where: { tenantId } })

    const pdfBuffer = await generateQuotePdfBuffer(quote, {
      companyName: company?.name,
      address: company?.address,
      email: company?.email,
    })

    return new Response(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="quote-${quote.quoteNumber}.pdf"`,
      },
    })
  } catch (e) {
    return apiServerError(e)
  }
}
