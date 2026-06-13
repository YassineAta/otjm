import { useState } from 'react'

/**
 * Shared modal + form state for admin CRUD pages.
 *
 * Centralizes the add/edit/view modal flags, the currently selected item and
 * the form data that each admin page used to hand-roll. `reset` closes all
 * three modals, clears the selection and restores `initialForm`.
 *
 * @example
 * const {
 *   showAdd, setShowAdd, showEdit, setShowEdit, showView, setShowView,
 *   selected, setSelected, formData, setFormData, reset,
 * } = useModalForm<NewsItem, typeof initialFormData>(initialFormData)
 */
export function useModalForm<TItem, TForm>(initialForm: TForm) {
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showView, setShowView] = useState(false)
  const [selected, setSelected] = useState<TItem | null>(null)
  const [formData, setFormData] = useState<TForm>(initialForm)

  const reset = () => {
    setShowAdd(false)
    setShowEdit(false)
    setShowView(false)
    setSelected(null)
    setFormData(initialForm)
  }

  return {
    showAdd,
    setShowAdd,
    showEdit,
    setShowEdit,
    showView,
    setShowView,
    selected,
    setSelected,
    formData,
    setFormData,
    reset,
  }
}
