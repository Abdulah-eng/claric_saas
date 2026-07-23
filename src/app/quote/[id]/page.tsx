import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import { QuoteStatusBadge } from '@/components/ui/badge'
import { FileText, Download, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function PublicQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        include: { product: true }
      },
      tenant: { select: { name: true } }
    }
  })

  if (!quote) notFound()

  return (
    <div className="min-h-screen bg-[hsl(210,40%,98%)] dark:bg-[hsl(222,47%,11%)] py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[hsl(217,33%,17%)] p-6 rounded-2xl shadow-sm border border-[hsl(214,32%,91%)] dark:border-[hsl(217,33%,17%)]">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[hsl(215,16%,47%)]">{quote.tenant.name}</p>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-[hsl(222,47%,11%)] dark:text-white">{quote.quoteNumber}</h1>
                <QuoteStatusBadge status={quote.status} />
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            {['SENT', 'VIEWED'].includes(quote.status) && (
              <>
                <Button variant="outline" className="flex-1 sm:flex-none text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10 border-emerald-200">
                  <CheckCircle className="h-4 w-4 mr-2" /> Approve
                </Button>
                <Button variant="outline" className="flex-1 sm:flex-none text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 border-red-200">
                  <XCircle className="h-4 w-4 mr-2" /> Reject
                </Button>
              </>
            )}
            <Button variant="outline" className="flex-1 sm:flex-none">
              <Download className="h-4 w-4 mr-2" /> PDF
            </Button>
          </div>
        </div>

        {/* Document Body */}
        <div className="bg-white dark:bg-[hsl(217,33%,17%)] p-8 sm:p-12 rounded-2xl shadow-sm border border-[hsl(214,32%,91%)] dark:border-[hsl(217,33%,17%)]">
          <div className="flex justify-between items-start mb-12">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[hsl(215,16%,47%)] mb-2">Prepared For</p>
              <p className="font-bold text-lg text-[hsl(222,47%,11%)] dark:text-white">{quote.customer.companyName}</p>
              {quote.customer.billingAddress && <p className="text-[hsl(215,16%,47%)]">{quote.customer.billingAddress}</p>}
              {(quote.customer.billingCity || quote.customer.billingCountry) && (
                <p className="text-[hsl(215,16%,47%)]">
                  {[quote.customer.billingCity, quote.customer.billingState, quote.customer.billingCountry].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold uppercase tracking-wider text-[hsl(215,16%,47%)] mb-2">Quote Details</p>
              <p className="text-[hsl(215,16%,47%)]"><span className="font-medium text-[hsl(222,47%,11%)] dark:text-white">Date:</span> {formatDate(quote.createdAt.toISOString())}</p>
              {quote.validUntil && <p className="text-[hsl(215,16%,47%)] mt-1"><span className="font-medium text-[hsl(222,47%,11%)] dark:text-white">Valid Until:</span> {formatDate(quote.validUntil.toISOString())}</p>}
            </div>
          </div>

          <div className="mb-12 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-[hsl(214,32%,91%)] dark:border-white/10">
                  <th className="py-3 text-left font-semibold text-[hsl(215,16%,47%)]">Description</th>
                  <th className="py-3 text-right font-semibold text-[hsl(215,16%,47%)] w-24">Qty</th>
                  <th className="py-3 text-right font-semibold text-[hsl(215,16%,47%)] w-32">Unit Price</th>
                  <th className="py-3 text-right font-semibold text-[hsl(215,16%,47%)] w-32">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(214,32%,91%)] dark:divide-white/10">
                {quote.items.map((li: any) => (
                  <tr key={li.id}>
                    <td className="py-4">
                      <div className="flex items-center gap-4">
                        {(li.imageUrl || li.product?.imageUrls?.[0]) && (
                          <img src={li.imageUrl || li.product.imageUrls[0]} alt="Product" className="h-12 w-12 shrink-0 rounded-xl object-cover bg-[hsl(210,40%,98%)] dark:bg-[hsl(217,33%,17%)] border border-[hsl(214,32%,91%)] dark:border-white/10" />
                        )}
                        <div>
                          {li.product && <p className="font-semibold text-[hsl(222,47%,11%)] dark:text-white mb-1">{li.product.name}</p>}
                          <p className="text-[hsl(215,16%,47%)]">{li.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-right text-[hsl(215,16%,47%)]">{li.quantity}</td>
                    <td className="py-4 text-right text-[hsl(215,16%,47%)]">{formatCurrency(Number(li.unitPrice))}</td>
                    <td className="py-4 text-right font-semibold text-[hsl(222,47%,11%)] dark:text-white">{formatCurrency(Number(li.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-12">
            <div className="flex-1 space-y-8">
              {quote.notes && (
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-[hsl(215,16%,47%)] mb-2">Notes</h4>
                  <p className="text-[hsl(215,16%,47%)] whitespace-pre-wrap">{quote.notes}</p>
                </div>
              )}
              {quote.terms && (
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-[hsl(215,16%,47%)] mb-2">Terms & Conditions</h4>
                  <p className="text-[hsl(215,16%,47%)] text-sm whitespace-pre-wrap">{quote.terms}</p>
                </div>
              )}
            </div>

            <div className="w-full sm:w-72 space-y-3 bg-[hsl(210,40%,98%)] dark:bg-black/20 p-6 rounded-xl">
              <div className="flex justify-between text-[hsl(215,16%,47%)]">
                <span>Subtotal</span>
                <span className="font-medium text-[hsl(222,47%,11%)] dark:text-white">{formatCurrency(Number(quote.subtotal))}</span>
              </div>
              {Number(quote.discountAmount) > 0 && (
                <div className="flex justify-between text-[hsl(215,16%,47%)]">
                  <span>Discount</span>
                  <span className="text-red-500">-{formatCurrency(Number(quote.discountAmount))}</span>
                </div>
              )}
              {Number(quote.taxAmount) > 0 && (
                <div className="flex justify-between text-[hsl(215,16%,47%)] border-b border-[hsl(214,32%,91%)] dark:border-white/10 pb-3">
                  <span>Tax</span>
                  <span className="font-medium text-[hsl(222,47%,11%)] dark:text-white">{formatCurrency(Number(quote.taxAmount))}</span>
                </div>
              )}
              <div className="flex justify-between pt-2">
                <span className="font-bold text-lg text-[hsl(222,47%,11%)] dark:text-white">Total</span>
                <span className="font-bold text-xl text-blue-600 dark:text-blue-400">{formatCurrency(Number(quote.total))}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
