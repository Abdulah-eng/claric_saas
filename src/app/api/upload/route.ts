import { uploadFile } from '@/lib/storage'
import { requireTenant } from '@/lib/auth-helpers'
import { apiServerError, apiSuccess, apiError } from '@/lib/api-response'
import fs from 'fs'
import path from 'path'

export async function POST(req: Request) {
  try {
    const { tenantId } = await requireTenant()
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return apiError('No file provided')
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = file.name
    const contentType = file.type

    // Check if we have AWS S3 configured (non-placeholder)
    const hasS3 = process.env.AWS_ACCESS_KEY_ID && 
                  process.env.AWS_ACCESS_KEY_ID !== 'your_access_key_id'

    if (hasS3) {
      try {
        const result = await uploadFile({
          tenantId,
          folder: 'quotes',
          fileName,
          contentType,
          body: buffer,
        })
        return apiSuccess({ url: result.url })
      } catch (err) {
        console.warn('S3 upload failed, falling back to local upload:', err)
      }
    }

    // Local upload fallback (under public/uploads)
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const fileExt = fileName.split('.').pop()
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
    const filePath = path.join(uploadDir, uniqueFileName)

    fs.writeFileSync(filePath, buffer)
    const localUrl = `/uploads/${uniqueFileName}`

    return apiSuccess({ url: localUrl })
  } catch (e) {
    return apiServerError(e)
  }
}
