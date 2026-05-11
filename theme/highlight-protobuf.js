// Register a Protocol Buffers grammar with highlight.js, then re-highlight
// any `language-protobuf` code blocks. mdBook's bundled highlight.js does not
// ship this language, so without this script the blocks render as plain text.

(function () {
    function defineProtobuf(hljs) {
        return {
            name: 'Protocol Buffers',
            aliases: ['proto', 'proto3'],
            keywords: {
                keyword:
                    'package import option syntax service rpc returns ' +
                    'message enum oneof map repeated optional required ' +
                    'reserved to extensions extend group stream default',
                type:
                    'double float int32 int64 uint32 uint64 sint32 sint64 ' +
                    'fixed32 fixed64 sfixed32 sfixed64 bool string bytes',
                literal: 'true false'
            },
            contains: [
                hljs.QUOTE_STRING_MODE,
                hljs.NUMBER_MODE,
                hljs.C_LINE_COMMENT_MODE,
                hljs.C_BLOCK_COMMENT_MODE,
                {
                    className: 'class',
                    beginKeywords: 'message enum service',
                    end: /\{/,
                    illegal: /\n/,
                    contains: [
                        hljs.inherit(hljs.TITLE_MODE, {
                            starts: { endsWithParent: true, excludeEnd: true }
                        })
                    ]
                },
                {
                    className: 'function',
                    beginKeywords: 'rpc',
                    end: /[;{]/,
                    excludeEnd: true,
                    keywords: 'rpc returns'
                },
                {
                    // Enum value names like BOOLEAN_AND = 0
                    className: 'symbol',
                    begin: /^\s*[A-Z][A-Z0-9_]*(?=\s*=)/
                }
            ]
        };
    }

    function rehighlightProtobufBlocks() {
        // mdBook 0.5.0-beta.1 ships hljs 10.1.1, which only exposes
        // `highlightBlock`. Newer hljs (10.7+) added `highlightElement`;
        // call whichever is available.
        const highlight = (hljs.highlightElement || hljs.highlightBlock).bind(hljs);
        document.querySelectorAll('pre code.language-protobuf').forEach(function (block) {
            // mdBook's highlight pass already ran. Reset and re-tokenize so
            // the grammar we just registered actually applies.
            block.removeAttribute('data-highlighted');
            block.classList.remove('hljs');
            block.innerHTML = block.textContent;
            highlight(block);
        });
    }

    function init() {
        if (typeof hljs === 'undefined') {
            // hljs may not be parsed yet; defer.
            setTimeout(init, 30);
            return;
        }
        if (!hljs.getLanguage || !hljs.getLanguage('protobuf')) {
            hljs.registerLanguage('protobuf', defineProtobuf);
        }
        rehighlightProtobufBlocks();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
