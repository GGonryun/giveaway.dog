const UNSTABLE_ID = /_r_[0-9a-z]+_|Dnd(?:DescribedBy|LiveRegion)-\d+/g;

export const stabilizeIds = <T extends Element>(node: T): T => {
  const clone = node.cloneNode(true) as T;
  const ids = new Map<string, string>();

  const rename = (match: string) => {
    const existing = ids.get(match);
    if (existing) return existing;
    const replacement = `:id${ids.size + 1}:`;
    ids.set(match, replacement);
    return replacement;
  };

  [clone, ...Array.from(clone.querySelectorAll('*'))].forEach((element) => {
    Array.from(element.attributes).forEach(({ name, value }) => {
      const next = value.replace(UNSTABLE_ID, rename);
      if (next !== value) {
        element.setAttribute(name, next);
      }
    });
  });

  return clone;
};
