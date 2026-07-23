import { prisma } from '@/lib/db'

async function main() {
  const result = await prisma.productionJob.updateMany({
    where: {
      stage: {
        in: ['production', 'pending', 'pending_stage']
      }
    },
    data: {
      stage: 'PRE_PRESS'
    }
  })
  console.log(`Successfully updated ${result.count} production jobs to stage 'PRE_PRESS'`)
}

main()
