// Workaround for mdBook 0.5.0-beta.1 toc.js pop-loop bug.
//
// mdBook's toc.js scans h2-h6 from the current page and injects them under
// the active SUMMARY entry in the sidebar. Its pop loop uses `>= level`
// where `> level` would be correct, so when a same-level heading follows
// a deeper-then-shallower sequence the popped state loses the layer that
// should have remained — making subsequent siblings land at the wrong DOM
// depth. The visible symptoms are staggered indent and (combined with our
// hide-deeper-levels CSS in theme/custom.css) sometimes entries
// disappearing entirely.
//
// This script runs after toc.js, finds the minimum heading level present
// on the page, locates every li.header-item whose corresponding heading
// is at that level, and reparents them all under a single canonical
// container in document order. Deeper-level entries (h4-under-h3 etc.)
// stay inside their parent header-item and are still hidden by the CSS
// rule.

(function () {
    function flatten() {
        const onThisPage = document.querySelector('.on-this-page');
        if (!onThisPage) return;

        const headingLevels = {};
        document.querySelectorAll(
            'main h2[id], main h3[id], main h4[id], main h5[id], main h6[id]'
        ).forEach(function (h) {
            headingLevels[h.id] = parseInt(h.tagName.charAt(1), 10);
        });

        const levels = Object.values(headingLevels);
        if (!levels.length) return;
        const minLevel = Math.min.apply(null, levels);

        const allLis = Array.from(onThisPage.querySelectorAll('li.header-item'));
        const topLevelLis = allLis.filter(function (li) {
            const a = li.querySelector('a.header-in-summary');
            if (!a) return false;
            const id = a.getAttribute('href').slice(1);
            return headingLevels[id] === minLevel;
        });
        if (topLevelLis.length < 2) return;

        // Sort by the corresponding heading's document position so the sidebar
        // matches reading order regardless of how toc.js built the tree.
        topLevelLis.sort(function (a, b) {
            const aId = a.querySelector('a.header-in-summary').getAttribute('href').slice(1);
            const bId = b.querySelector('a.header-in-summary').getAttribute('href').slice(1);
            const aH = document.getElementById(aId);
            const bH = document.getElementById(bId);
            return (aH.compareDocumentPosition(bH) & Node.DOCUMENT_POSITION_PRECEDING) ? 1 : -1;
        });

        // appendChild() moves nodes when they are already in the DOM, so we
        // can use the first top-level li's parent as the canonical container.
        // Any pre-existing top-level lis in that container get reordered too.
        const target = topLevelLis[0].parentNode;
        topLevelLis.forEach(function (li) { target.appendChild(li); });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', flatten);
    } else {
        flatten();
    }
})();
