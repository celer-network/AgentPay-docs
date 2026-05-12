// Register a Solidity grammar with highlight.js, then re-highlight any
// `language-solidity` code blocks. mdBook 0.5.0-beta.1 ships hljs 10.1.1
// which does not include Solidity, so without this script those blocks
// render as plain text. Mirrors theme/highlight-protobuf.js.

(function () {
    function defineSolidity(hljs) {
        const SOL_NUMBER = {
            className: 'number',
            begin: /\b(?:0x[a-fA-F0-9]+|\d+(?:\.\d+)?(?:e[+-]?\d+)?)\b/
        };
        return {
            name: 'Solidity',
            aliases: ['sol'],
            keywords: {
                keyword:
                    'pragma import using as ' +
                    'contract interface library abstract is ' +
                    'function modifier constructor fallback receive ' +
                    'public private internal external ' +
                    'view pure payable nonpayable ' +
                    'memory storage calldata ' +
                    'returns return ' +
                    'event emit struct enum mapping ' +
                    'new delete this super assembly ' +
                    'if else for while do break continue ' +
                    'try catch throw revert require assert ' +
                    'indexed anonymous override virtual immutable constant unchecked',
                type:
                    'address bool string bytes ' +
                    'int int8 int16 int24 int32 int40 int48 int56 int64 int72 int80 ' +
                    'int88 int96 int104 int112 int120 int128 int136 int144 int152 ' +
                    'int160 int168 int176 int184 int192 int200 int208 int216 int224 int232 int240 int248 int256 ' +
                    'uint uint8 uint16 uint24 uint32 uint40 uint48 uint56 uint64 uint72 uint80 ' +
                    'uint88 uint96 uint104 uint112 uint120 uint128 uint136 uint144 uint152 ' +
                    'uint160 uint168 uint176 uint184 uint192 uint200 uint208 uint216 uint224 uint232 uint240 uint248 uint256 ' +
                    'bytes1 bytes2 bytes3 bytes4 bytes5 bytes6 bytes7 bytes8 bytes9 bytes10 ' +
                    'bytes11 bytes12 bytes13 bytes14 bytes15 bytes16 bytes17 bytes18 bytes19 bytes20 ' +
                    'bytes21 bytes22 bytes23 bytes24 bytes25 bytes26 bytes27 bytes28 bytes29 bytes30 bytes31 bytes32 ' +
                    'fixed ufixed',
                literal:
                    'true false null ' +
                    'wei gwei szabo finney ether ' +
                    'seconds minutes hours days weeks years'
            },
            contains: [
                hljs.QUOTE_STRING_MODE,
                hljs.APOS_STRING_MODE,
                SOL_NUMBER,
                hljs.C_LINE_COMMENT_MODE,
                hljs.C_BLOCK_COMMENT_MODE,
                {
                    className: 'class',
                    beginKeywords: 'contract interface library struct enum',
                    end: /\{/,
                    excludeEnd: true,
                    contains: [
                        hljs.inherit(hljs.TITLE_MODE, {
                            starts: { endsWithParent: true, excludeEnd: true }
                        })
                    ]
                },
                {
                    className: 'function',
                    beginKeywords: 'function modifier event',
                    end: /[;{]/,
                    excludeEnd: true,
                    contains: [
                        hljs.inherit(hljs.TITLE_MODE, {
                            starts: { endsWithParent: true, excludeEnd: true }
                        }),
                        {
                            className: 'params',
                            begin: /\(/,
                            end: /\)/,
                            keywords: {
                                keyword: 'memory storage calldata indexed',
                                type:
                                    'address bool string bytes ' +
                                    'uint uint8 uint16 uint32 uint64 uint128 uint256 ' +
                                    'int int8 int16 int32 int64 int128 int256 ' +
                                    'bytes1 bytes4 bytes8 bytes16 bytes32'
                            },
                            contains: [
                                hljs.QUOTE_STRING_MODE,
                                hljs.APOS_STRING_MODE,
                                SOL_NUMBER,
                                hljs.C_LINE_COMMENT_MODE,
                                hljs.C_BLOCK_COMMENT_MODE
                            ]
                        }
                    ]
                },
                {
                    // pragma solidity ^0.8.0;
                    className: 'meta',
                    begin: /\bpragma\s+\w+/,
                    end: /;/,
                    excludeEnd: true
                }
            ]
        };
    }

    function rehighlightSolidityBlocks() {
        // mdBook ships hljs 10.1.1 (highlightBlock only). Newer versions
        // expose highlightElement; call whichever is available.
        const highlight = (hljs.highlightElement || hljs.highlightBlock).bind(hljs);
        document.querySelectorAll('pre code.language-solidity').forEach(function (block) {
            block.removeAttribute('data-highlighted');
            block.classList.remove('hljs');
            block.innerHTML = block.textContent;
            highlight(block);
        });
    }

    function init() {
        if (typeof hljs === 'undefined') {
            setTimeout(init, 30);
            return;
        }
        if (!hljs.getLanguage || !hljs.getLanguage('solidity')) {
            hljs.registerLanguage('solidity', defineSolidity);
        }
        rehighlightSolidityBlocks();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
