export function hideNextDevToolsButton() {
  const visit = (root: Document | ShadowRoot) => {
    root.querySelectorAll('[data-nextjs-dev-tools-button]').forEach((node) => {
      if (node instanceof HTMLElement) {
        node.style.setProperty('display', 'none', 'important')
        node.style.setProperty('visibility', 'hidden', 'important')
        node.style.setProperty('pointer-events', 'none', 'important')
      }
    })

    root.querySelectorAll('*').forEach((element) => {
      if (element.shadowRoot) {
        visit(element.shadowRoot)
      }
    })
  }

  visit(document)
}
