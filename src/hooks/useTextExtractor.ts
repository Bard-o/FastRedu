/**
 * useTextExtractor — File → raw text extraction hook
 * ====================================================
 *
 * Routes by file extension:
 * - .txt → file.text()
 * - .pdf → pdfjs-dist with worker via import.meta.url
 * - .docx → mammoth.extractRawText
 * - Unknown → reject with descriptive error
 */

import { useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString()

export function useTextExtractor(): {
  extractText: (file: File) => Promise<string>
  isExtracting: boolean
  error: string | null
} {
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const extractText = useCallback(async (file: File): Promise<string> => {
    setIsExtracting(true)
    setError(null)

    try {
      const name = file.name.toLowerCase()

      if (name.endsWith('.txt')) {
        return await file.text()
      }

      if (name.endsWith('.pdf') || file.type === 'application/pdf') {
        return await extractPdf(file)
      }

      if (
        name.endsWith('.docx') ||
        file.type ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        return await extractDocx(file)
      }

      throw new Error(`Unsupported file type: ${file.name}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to extract text'
      setError(message)
      throw err
    } finally {
      setIsExtracting(false)
    }
  }, [])

  return { extractText, isExtracting, error }
}

async function extractPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text = (content.items as Array<{ str?: string }>)
      .map(item => item.str ?? '')
      .filter(Boolean)
      .join(' ')
    pages.push(text)
  }

  return pages.join('\n\n')
}

async function extractDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}