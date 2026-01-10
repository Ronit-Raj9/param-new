"use client"

import * as React from "react"

interface ModalState<T = unknown> {
  isOpen: boolean
  data?: T
}

interface UseModalReturn<T = unknown> {
  isOpen: boolean
  data?: T
  open: (data?: T) => void
  close: () => void
  toggle: () => void
}

/**
 * Hook for managing modal state
 * 
 * @example
 * ```tsx
 * const modal = useModal<Student>()
 * 
 * <Button onClick={() => modal.open(student)}>Edit</Button>
 * 
 * <Modal open={modal.isOpen} onClose={modal.close}>
 *   {modal.data && <StudentForm student={modal.data} />}
 * </Modal>
 * ```
 */
export function useModal<T = unknown>(initialOpen: boolean = false): UseModalReturn<T> {
  const [state, setState] = React.useState<ModalState<T>>({
    isOpen: initialOpen,
    data: undefined,
  })

  const open = React.useCallback((data?: T) => {
    setState({ isOpen: true, data })
  }, [])

  const close = React.useCallback(() => {
    setState({ isOpen: false, data: undefined })
  }, [])

  const toggle = React.useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: !prev.isOpen }))
  }, [])

  return {
    isOpen: state.isOpen,
    data: state.data,
    open,
    close,
    toggle,
  }
}
