// ast_parser.js (Bản nâng cấp bảo vệ cấu trúc Route)
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const fs = require('fs');

const rawCode = fs.readFileSync(0, 'utf-8');

function optimizeReactCodeForLLM(code) {
    try {
        const ast = parser.parse(code, {
            sourceType: 'module',
            plugins: ['jsx', 'typescript'],
        });

        // Danh sách các thẻ HTML tương tác
        const interactiveTags = ['button', 'input', 'form', 'a', 'select', 'textarea'];
        // Danh sách các thẻ Routing cần bảo tồn để Analyzer hiểu cấu trúc web
        const routingTags = ['Route', 'Routes', 'BrowserRouter', 'Link', 'NavLink'];

        traverse(ast, {
            enter(path) {
                if (path.node.leadingComments) path.node.leadingComments = null;
                if (path.node.trailingComments) path.node.trailingComments = null;
            },
            // Xử lý cả JSXElement và JSXFragment
            "JSXElement|JSXFragment": {
                exit(path) {
                    // Nếu là Fragment (<>...</>), mặc định giữ lại nếu có con có giá trị
                    if (path.isJSXFragment()) {
                        const children = path.node.children.filter(child => 
                            child.type === 'JSXElement' || child.type === 'JSXFragment' || child.type === 'JSXExpressionContainer'
                        );
                        if (children.length === 0) path.remove();
                        return;
                    }

                    const openingElement = path.node.openingElement;
                    const tagName = openingElement.name.name || (openingElement.name.property && openingElement.name.property.name);

                    const hasEvent = openingElement.attributes.some(
                        attr => attr.type === 'JSXAttribute' && attr.name.name && attr.name.name.startsWith('on')
                    );
                    
                    // Logic bảo tồn:
                    const isComponent = tagName && /^[A-Z]/.test(tagName); // Thẻ viết hoa (Component)
                    const isRouting = routingTags.includes(tagName); // Thẻ định tuyến
                    const isInteractive = interactiveTags.includes(tagName); // Thẻ HTML tương tác

                    if (!isInteractive && !hasEvent && !isComponent && !isRouting) {
                        const valuableChildren = path.node.children.filter(child => 
                            child.type === 'JSXElement' || child.type === 'JSXFragment' || child.type === 'JSXExpressionContainer'
                        );
                        
                        if (valuableChildren.length === 0) {
                            path.remove();
                        } else {
                            // Chỉ giữ lại xương sống, bỏ qua text tĩnh
                            path.node.children = valuableChildren;
                        }
                    }
                }
            }
        });

        return generate(ast, { compact: true, comments: false }).code;
    } catch (e) {
        return code; 
    }
}

console.log(optimizeReactCodeForLLM(rawCode));