/**
 * useStorageQuota — localStorage usage tracking hook
 * ===================================================
 *
 * Iterates all localStorage keys, sums their serialized sizes,
 * and warns when usage exceeds the ~4MB safe threshold.
 *
 * The warning is logged once per session (not per call) to avoid
 * console spam during normal usage.
 */

const STORAGE_LIMIT = 5_242_880 // 5MB — localStorage hard limit
const WARNING_THRESHOLD = 4_194_304 // 4MB — soft warning threshold

interface StorageQuota {
  used: number
  limit: number
  warning: boolean
}

let sessionWarningFired = false

/**
 * Calculate current localStorage usage.
 *
 * @returns StorageQuota — { used, limit, warning }
 */
export function checkQuota(): StorageQuota {
  let used = 0

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue
    const value = localStorage.getItem(key)
    if (!value) continue
    // Rough estimate: key + value in UTF-16 chars × 2 bytes
    used += (key.length + value.length) * 2
  }

  const warning = used > WARNING_THRESHOLD

  if (warning && !sessionWarningFired) {
    console.warn(
      `[useStorageQuota] localStorage usage (${(used / 1024 / 1024).toFixed(
        2
      )}MB) exceeds the 4MB soft limit (${(
        WARNING_THRESHOLD /
        1024 /
        1024
      ).toFixed(0)}MB). Large texts may not persist across sessions.`
    )
    sessionWarningFired = true
  }

  return { used, limit: STORAGE_LIMIT, warning }
}