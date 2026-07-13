import "@testing-library/jest-dom"
import { afterEach } from "vitest"
import { cleanup } from "@testing-library/react"

// Configure a proper React act() environment so state updates flush
// deterministically and don't leak across tests (renderHook in particular).
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// Unmount React trees rendered by Testing Library after every test.
afterEach(() => {
  cleanup()
})
