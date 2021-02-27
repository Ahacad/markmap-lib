import { loadJS } from 'markmap-common';

const enabled = {};

const preloading = loadJS([
  {
    type: 'script',
    data: {
      src: `https://cdn.jsdelivr.net/npm/d3@${process.env.D3_VERSION}`,
    },
  },
  {
    type: 'script',
    data: {
      src: `https://cdn.jsdelivr.net/combine/npm/markmap-lib@${process.env.LIB_VERSION},npm/markmap-view@${process.env.VIEW_VERSION}`,
    },
  },
]);

function transform(transformer, content) {
  const { root, features } = transformer.transform(content);
  const keys = Object.keys(features).filter(key => !enabled[key]);
  keys.forEach(key => { enabled[key] = true; });
  const { styles, scripts } = transformer.getAssets(keys);
  const { loadJS, loadCSS } = window.markmap;
  if (styles) loadCSS(styles);
  if (scripts) loadJS(scripts);
  return root;
}

export function render(el) {
  const { Transformer, Markmap } = window.markmap;
  const lines = el.textContent.split('\n');
  let indent = Infinity;
  lines.forEach(line => {
    const spaces = line.match(/^\s*/)[0].length;
    if (spaces < line.length) indent = Math.min(indent, spaces);
  });
  const content = lines.map(line => line.slice(indent)).join('\n');
  const transformer = new Transformer();
  el.innerHTML = '<svg></svg>';
  const svg = el.firstChild;
  const mm = Markmap.create(svg);
  const render = () => {
    const root = transform(transformer, content);
    mm.setData(root);
    mm.fit();
  };
  transformer.hooks.retransform.tap(render);
  render();
}

export async function renderAllUnder(container: ParentNode) {
  await preloading;
  container.querySelectorAll('.markmap').forEach(render);
}

export function renderAll() {
  return renderAllUnder(document);
}

if (!window.markmap?.autoLoader?.manual) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { renderAll(); });
  else renderAll();
}
