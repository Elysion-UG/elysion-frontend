/**
 * CategoryService tree-builder unit tests.
 *
 * Covers buildCategoryTree() in isolation — see remaining.service.test.ts for
 * the API-call assertions. We test this in a separate file because the tree
 * builder is the load-bearing replacement for the backend's broken
 * /categories/tree endpoint (currently 500). If this regresses, the admin
 * category UI silently breaks.
 */
import { describe, it, expect } from "vitest"
import { buildCategoryTree } from "./category.service"
import type { Category } from "@/src/types"

function cat(partial: Partial<Category> & { id: string }): Category {
  return {
    name: partial.name ?? partial.id,
    slug: partial.slug ?? partial.id,
    parentId: partial.parentId ?? null,
    level: partial.level ?? 1,
    order: partial.order ?? 0,
    ...partial,
  }
}

describe("buildCategoryTree", () => {
  it("returns an empty array for an empty input", () => {
    expect(buildCategoryTree([])).toEqual([])
  })

  it("returns a single root when there are no children", () => {
    const tree = buildCategoryTree([cat({ id: "a", level: 1 })])
    expect(tree).toHaveLength(1)
    expect(tree[0].id).toBe("a")
    expect(tree[0].children).toEqual([])
  })

  it("attaches children to their parent by parentId", () => {
    const tree = buildCategoryTree([
      cat({ id: "root", level: 1 }),
      cat({ id: "child", level: 2, parentId: "root" }),
    ])
    expect(tree).toHaveLength(1)
    expect(tree[0].children).toHaveLength(1)
    expect(tree[0].children[0].id).toBe("child")
  })

  it("supports three levels of nesting", () => {
    const tree = buildCategoryTree([
      cat({ id: "l1", level: 1 }),
      cat({ id: "l2", level: 2, parentId: "l1" }),
      cat({ id: "l3", level: 3, parentId: "l2" }),
    ])
    expect(tree[0].id).toBe("l1")
    expect(tree[0].children[0].id).toBe("l2")
    expect(tree[0].children[0].children[0].id).toBe("l3")
    expect(tree[0].children[0].children[0].children).toEqual([])
  })

  it("sorts siblings by order, then by name", () => {
    const tree = buildCategoryTree([
      cat({ id: "b", name: "Banane", order: 2 }),
      cat({ id: "a", name: "Apfel", order: 1 }),
      cat({ id: "c", name: "Cassis", order: 2 }),
    ])
    expect(tree.map((n) => n.id)).toEqual(["a", "b", "c"])
  })

  it("sorts children with the same ordering rule", () => {
    const tree = buildCategoryTree([
      cat({ id: "root", level: 1, order: 1 }),
      cat({ id: "z", name: "Zebra", level: 2, parentId: "root", order: 1 }),
      cat({ id: "a", name: "Affe", level: 2, parentId: "root", order: 1 }),
    ])
    expect(tree[0].children.map((n) => n.id)).toEqual(["a", "z"])
  })

  it("treats unknown parentId as a root (defensive)", () => {
    const tree = buildCategoryTree([cat({ id: "orphan", level: 2, parentId: "missing-parent" })])
    expect(tree).toHaveLength(1)
    expect(tree[0].id).toBe("orphan")
  })

  it("preserves the public CategoryTreeNode shape (no parentId / description leakage)", () => {
    const [node] = buildCategoryTree([
      {
        id: "n",
        name: "Node",
        slug: "node",
        parentId: null,
        level: 1,
        order: 0,
        description: "Should not leak",
        status: "ACTIVE",
      },
    ])
    expect(Object.keys(node).sort()).toEqual(
      ["children", "id", "level", "name", "order", "slug"].sort()
    )
  })
})
