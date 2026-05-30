let parser, traverse, generate;

try {
  parser = require('@babel/parser');
  traverse = require('@babel/traverse').default;
  generate = require('@babel/generator').default;
} catch {
  // Babel deps optional - fallback to raw code
}

const INTERACTIVE_TAGS = ['button', 'input', 'form', 'a', 'select', 'textarea'];
const ROUTING_TAGS = ['Route', 'Routes', 'BrowserRouter', 'Link', 'NavLink'];

function optimizeCodeForLLM(code) {
  if (!parser || !traverse || !generate) return code.slice(0, 3000);

  try {
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });

    traverse(ast, {
      enter(nodePath) {
        if (nodePath.node.leadingComments) nodePath.node.leadingComments = null;
        if (nodePath.node.trailingComments) nodePath.node.trailingComments = null;
      },
      'JSXElement|JSXFragment': {
        exit(nodePath) {
          if (nodePath.isJSXFragment()) {
            const children = nodePath.node.children.filter(
              c => c.type === 'JSXElement' || c.type === 'JSXFragment' || c.type === 'JSXExpressionContainer'
            );
            if (children.length === 0) nodePath.remove();
            return;
          }

          const opening = nodePath.node.openingElement;
          const tagName = opening.name.name || (opening.name.property && opening.name.property.name);
          const hasEvent = opening.attributes.some(
            a => a.type === 'JSXAttribute' && a.name.name && a.name.name.startsWith('on')
          );

          const isComponent = tagName && /^[A-Z]/.test(tagName);
          const isRouting = ROUTING_TAGS.includes(tagName);
          const isInteractive = INTERACTIVE_TAGS.includes(tagName);

          if (!isInteractive && !hasEvent && !isComponent && !isRouting) {
            const valuableChildren = nodePath.node.children.filter(
              c => c.type === 'JSXElement' || c.type === 'JSXFragment' || c.type === 'JSXExpressionContainer'
            );
            if (valuableChildren.length === 0) {
              nodePath.remove();
            } else {
              nodePath.node.children = valuableChildren;
            }
          }
        },
      },
    });

    return generate(ast, { compact: true, comments: false }).code;
  } catch {
    return code;
  }
}

module.exports = { optimizeCodeForLLM };
