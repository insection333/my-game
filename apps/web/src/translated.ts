// A page the browser translates (session 205): translation puts each text node it changes inside <font>
// elements of its own, so the node React wrote is no longer where React left it. The next change React made
// there (a number ticking, a page opening) failed in insertBefore or removeChild, and within seconds the
// whole game read "Something broke here". Both now bear a node that has moved: one already gone is let go,
// and a new node goes before the <font> its neighbour now stands in (or last, where that neighbour is gone),
// so the page keeps working in the words the browser chose.
export function bearTranslation(): void {
  if (typeof Node !== 'function') return;
  // eslint-disable-next-line @typescript-eslint/unbound-method -- called with its own node through call()
  const remove = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) return child;
    return remove.call(this, child) as T;
  };
  // eslint-disable-next-line @typescript-eslint/unbound-method -- called with its own node through call()
  const insert = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(this: Node, node: T, before: Node | null): T {
    if (!before || before.parentNode === this) return insert.call(this, node, before) as T;
    let here: Node | null = before;
    while (here && here.parentNode !== this) here = here.parentNode;
    return insert.call(this, node, here) as T;
  };
}
