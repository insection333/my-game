// A page the browser translates (session 205): translation wraps the text nodes it changes in <font>
// elements, and React's next insertBefore or removeChild there threw, so within seconds the whole game read
// "Something broke here". A node that has moved is now borne: one gone is let go, and a new node goes before
// the wrapper its neighbour stands in, or last where the neighbour is gone.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { bearTranslation } from '../src/translated.ts';

/** Enough of the DOM's tree for its two checks: each throws for a node not its child, as browsers do. */
class FakeNode {
  parentNode: FakeNode | null = null;
  childNodes: FakeNode[] = [];
  readonly name: string;
  constructor(name: string) {
    this.name = name;
  }
  appendChild(n: FakeNode) {
    return this.insertBefore(n, null);
  }
  insertBefore(n: FakeNode, before: FakeNode | null) {
    if (before && before.parentNode !== this) throw new Error('NotFoundError: insertBefore');
    n.parentNode?.childNodes.splice(n.parentNode.childNodes.indexOf(n), 1);
    const at = before ? this.childNodes.indexOf(before) : this.childNodes.length;
    this.childNodes.splice(at, 0, n);
    n.parentNode = this;
    return n;
  }
  removeChild(n: FakeNode) {
    if (n.parentNode !== this) throw new Error('NotFoundError: removeChild');
    this.childNodes.splice(this.childNodes.indexOf(n), 1);
    n.parentNode = null;
    return n;
  }
}
afterEach(() => vi.unstubAllGlobals());

/** A row of three words, the middle one translated as the browser does: wrapped in <font><font>. */
function translatedRow() {
  vi.stubGlobal('Node', FakeNode);
  bearTranslation();
  const row = new FakeNode('row');
  const [a, b, c] = ['Oak', 'tree', 'logs'].map((w) => row.appendChild(new FakeNode(w)));
  const outer = new FakeNode('font');
  const inner = outer.appendChild(new FakeNode('font'));
  row.insertBefore(outer, b);
  inner.appendChild(b);
  return { row, a, b, c, outer };
}
const names = (n: FakeNode) => n.childNodes.map((x) => x.name);

describe('a translated page', () => {
  it('puts a new node before the wrapper its neighbour now stands in', () => {
    const { row, b } = translatedRow();
    expect(() => row.insertBefore(new FakeNode('new'), b)).not.toThrow();
    expect(names(row)).toEqual(['Oak', 'new', 'font', 'logs']);
  });

  it('lets go of a node already gone, and puts a node last where its neighbour is gone', () => {
    const { row, b } = translatedRow();
    b.parentNode!.removeChild(b);
    expect(() => row.removeChild(b)).not.toThrow();
    expect(() => row.insertBefore(new FakeNode('new'), b)).not.toThrow();
    expect(names(row)).toEqual(['Oak', 'font', 'logs', 'new']);
  });

  it('leaves an ordinary page as it was', () => {
    const { row, a, c } = translatedRow();
    row.insertBefore(new FakeNode('new'), c);
    row.removeChild(a);
    expect(names(row)).toEqual(['font', 'new', 'logs']);
  });
});
