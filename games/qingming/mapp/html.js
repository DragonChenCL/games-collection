// The platform enforces Trusted Types, so HTML strings cannot be assigned to innerHTML.
// This builds the same nodes with createElement instead; it covers the plain markup the game uses.
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const SVG_NS = 'http://www.w3.org/2000/svg';
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0' };
const TOKEN = /<!--[\s\S]*?-->|<\/([a-zA-Z][^\s>]*)\s*>|<([a-zA-Z][^\s/>]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>|[^<]+|</g;
const ATTRIBUTE = /([^\s=/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;

function decode(text) {
  return text.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (match, name) => {
    if (name[0] !== '#') return ENTITIES[name] ?? match;
    const code = name[1] === 'x' || name[1] === 'X' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
  });
}

export function fragmentFromHtml(html) {
  const root = document.createDocumentFragment();
  const stack = [{ node: root, tag: '', svg: false }];
  for (const [token, closing, opening, attributes] of String(html).matchAll(TOKEN)) {
    const top = stack.at(-1);
    if (closing) {
      const index = stack.findLastIndex(entry => entry.tag === closing.toLowerCase());
      if (index > 0) stack.length = index;
    } else if (opening) {
      const tag = opening.toLowerCase();
      // Nothing in the game needs these, and they are script sinks.
      if (tag === 'script' || tag === 'style') continue;
      const svg = top.svg || tag === 'svg';
      const node = svg ? document.createElementNS(SVG_NS, opening) : document.createElement(tag);
      for (const [, name, double, single, bare] of attributes.matchAll(ATTRIBUTE)) {
        if (/^on/i.test(name)) continue;
        node.setAttribute(name, decode(double ?? single ?? bare ?? ''));
      }
      top.node.append(node);
      if (!VOID.has(tag) && !/\/\s*$/.test(attributes)) stack.push({ node, tag, svg });
    } else if (!token.startsWith('<!--')) {
      top.node.append(decode(token));
    }
  }
  return root;
}

// vite.config.js rewrites the game's `element.innerHTML = html` to `element.mappHtml = html`.
export function installHtmlSetter() {
  Object.defineProperty(Element.prototype, 'mappHtml', {
    configurable: true,
    set(html) { this.replaceChildren(fragmentFromHtml(html)); },
  });
}
