import { useState, useCallback } from "react"
import { toast } from "sonner"

interface ExecuteOptions {
  /** Toast message shown on error. If omitted, no toast is shown. */
  errorMessage?: string
}

/**
 * Wraps an async operation with a loading state.
 * The `fn` callback is responsible for success toasts and any post-success logic.
 * On error, an optional `errorMessage` is shown as a toast.
 */
export function useAsyncAction() {
  const [isLoading, setIsLoading] = useState(false)

  const execute = useCallback(
    async (fn: () => Promise<void>, options?: ExecuteOptions): Promise<void> => {
      setIsLoading(true)
      try {
        await fn()
      } catch (err) {
        if (options?.errorMessage) toast.error(options.errorMessage)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return { isLoading, execute }
}
