"use client"

import * as React from "react"
import { useLocalStorage } from "./use-local-storage"

interface UseFormPersistenceOptions<T> {
  storageKey: string
  initialValues: T
  clearOnSubmit?: boolean
}

/**
 * Hook for auto-saving form state to localStorage
 * Useful for draft persistence across page refreshes
 * 
 * @example
 * ```tsx
 * const { values, setValue, clearDraft } = useFormPersistence({
 *   storageKey: 'student-form-draft',
 *   initialValues: { name: '', email: '' }
 * })
 * 
 * <Input
 *   value={values.name}
 *   onChange={(e) => setValue('name', e.target.value)}
 * />
 * ```
 */
export function useFormPersistence<T extends Record<string, unknown>>({
  storageKey,
  initialValues,
  clearOnSubmit = true,
}: UseFormPersistenceOptions<T>) {
  const [values, setValues] = useLocalStorage<T>(storageKey, initialValues)

  const setValue = React.useCallback(
    (field: keyof T, value: unknown) => {
      setValues((prev) => ({
        ...prev,
        [field]: value,
      }))
    },
    [setValues]
  )

  const setMultipleValues = React.useCallback(
    (updates: Partial<T>) => {
      setValues((prev) => ({
        ...prev,
        ...updates,
      }))
    },
    [setValues]
  )

  const clearDraft = React.useCallback(() => {
    setValues(initialValues)
  }, [setValues, initialValues])

  const hasDraft = React.useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValues)
  }, [values, initialValues])

  return {
    values,
    setValue,
    setMultipleValues,
    clearDraft,
    hasDraft,
  }
}
