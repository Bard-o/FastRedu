/**
 * useTextExtractor.test.ts — Tests for file text extraction hook
 * ================================================================
 *
 * Tests TXT extraction (mock File) and rejection on unknown extensions.
 * PDF and DOCX extraction are integration-level and depend on external
 * libraries; they are tested manually in Phase 4 verification.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTextExtractor } from './useTextExtractor'

/**
 * Create a mock File that supports .text() for TXT files.
 * jsdom's File doesn't implement .text(), so we add it manually.
 */
function createTxtFile(content: string, name: string): File {
  const file = new File([content], name, { type: 'text/plain' })
  // jsdom File doesn't have .text(), patch it
  file.text = vi.fn(async () => content)
  return file
}

describe('useTextExtractor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('extracts text from a .txt file', async () => {
    const content = 'Hello world from TXT'
    const file = createTxtFile(content, 'test.txt')

    const { result } = renderHook(() => useTextExtractor())

    let extracted: string | undefined
    await act(async () => {
      extracted = await result.current.extractText(file)
    })

    expect(extracted).toBe('Hello world from TXT')
  })

  it('extracts text from a .txt file by extension (even without text/plain type)', async () => {
    const content = 'Extension-based'
    const file = createTxtFile(content, 'document.txt')
    // Override type to ensure extension-based routing
    Object.defineProperty(file, 'type', { value: 'application/octet-stream' })

    const { result } = renderHook(() => useTextExtractor())

    let extracted: string | undefined
    await act(async () => {
      extracted = await result.current.extractText(file)
    })

    expect(extracted).toBe('Extension-based')
  })

  it('rejects unknown file extension with descriptive error', async () => {
    const file = new File(['data'], 'image.xyz', { type: 'application/octet-stream' })

    const { result } = renderHook(() => useTextExtractor())

    await expect(
      act(async () => {
        await result.current.extractText(file)
      }),
    ).rejects.toThrow('Unsupported file type: image.xyz')
  })

  it('sets isExtracting to false after extraction completes', async () => {
    const content = 'Loading state test'
    const file = createTxtFile(content, 'test.txt')

    const { result } = renderHook(() => useTextExtractor())
    expect(result.current.isExtracting).toBe(false)

    await act(async () => {
      await result.current.extractText(file)
    })

    expect(result.current.isExtracting).toBe(false)
  })

  it('sets error when extraction fails', async () => {
    const file = new File(['data'], 'unknown.xyz', { type: 'application/octet-stream' })

    const { result } = renderHook(() => useTextExtractor())

    await act(async () => {
      try {
        await result.current.extractText(file)
      } catch {
        // Expected error
      }
    })

    expect(result.current.error).toBe('Unsupported file type: unknown.xyz')
    expect(result.current.isExtracting).toBe(false)
  })

  it('resets error on subsequent successful extraction', async () => {
    const badFile = new File(['data'], 'bad.xyz', { type: 'application/octet-stream' })
    const goodFile = createTxtFile('Good content', 'good.txt')

    const { result } = renderHook(() => useTextExtractor())

    // First call fails
    await act(async () => {
      try {
        await result.current.extractText(badFile)
      } catch {
        // Expected
      }
    })
    expect(result.current.error).toBeTruthy()

    // Second call succeeds — error should be cleared
    await act(async () => {
      await result.current.extractText(goodFile)
    })
    expect(result.current.error).toBeNull()
  })
})