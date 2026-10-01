const GENERATED_ID = /_r_[0-9a-z]+_/g;

export function withStableIds(node: Node | null): Element {
  if (!(node instanceof Element)) {
    throw new Error('Expected an element to snapshot');
  }

  const clone = node.cloneNode(true) as Element;
  const placeholders = new Map<string, string>();
  const stabilize = (value: string) =>
    value.replace(GENERATED_ID, (id) => {
      const placeholder = placeholders.get(id) ?? `:id${placeholders.size}:`;
      placeholders.set(id, placeholder);
      return placeholder;
    });

  [clone, ...Array.from(clone.querySelectorAll('*'))].forEach((element) => {
    Array.from(element.attributes).forEach(({ name, value }) => {
      const stable = stabilize(value);
      if (stable !== value) {
        element.setAttribute(name, stable);
      }
    });
  });

  return clone;
}
