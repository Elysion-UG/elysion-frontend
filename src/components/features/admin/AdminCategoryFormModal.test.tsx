import { describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import AdminCategoryFormModal, { EMPTY_FORM } from "./AdminCategoryFormModal"

/**
 * Accessibility coverage for the category modal (#11): it must expose itself as
 * a dialog, associate every label with its field, and close on Escape.
 */
function renderModal(overrides: Partial<Parameters<typeof AdminCategoryFormModal>[0]> = {}) {
  const onClose = vi.fn()
  const onSubmit = vi.fn()
  const onChange = vi.fn()
  render(
    <AdminCategoryFormModal
      title="Kategorie anlegen"
      form={EMPTY_FORM}
      onChange={onChange}
      onSubmit={onSubmit}
      onClose={onClose}
      isSaving={false}
      parentOptions={[{ id: "1", name: "Textilien", level: 1 }]}
      {...overrides}
    />
  )
  return { onClose, onSubmit, onChange }
}

describe("AdminCategoryFormModal – a11y", () => {
  it("renders as a labelled modal dialog", () => {
    renderModal()
    const dialog = screen.getByRole("dialog")
    expect(dialog).toHaveAttribute("aria-modal", "true")
    // aria-labelledby points at the visible title.
    expect(dialog).toHaveAccessibleName("Kategorie anlegen")
  })

  it("associates every label with its field", () => {
    renderModal()
    expect(screen.getByLabelText("Name *")).toBeInTheDocument()
    expect(screen.getByLabelText("Slug")).toBeInTheDocument()
    expect(screen.getByLabelText("Eltern-Kategorie")).toBeInTheDocument()
    expect(screen.getByLabelText("Beschreibung")).toBeInTheDocument()
    expect(screen.getByLabelText("Sortierung")).toBeInTheDocument()
  })

  it("hides the parent selector when editing", () => {
    renderModal({ hideParent: true })
    expect(screen.queryByLabelText("Eltern-Kategorie")).not.toBeInTheDocument()
  })

  it("closes on Escape", () => {
    const { onClose } = renderModal()
    fireEvent.keyDown(document, { key: "Escape" })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("closes when the backdrop is clicked", () => {
    const { onClose } = renderModal()
    // The backdrop is the aria-hidden overlay behind the dialog.
    const backdrop = document.querySelector('[aria-hidden="true"]')
    expect(backdrop).not.toBeNull()
    fireEvent.click(backdrop as Element)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
