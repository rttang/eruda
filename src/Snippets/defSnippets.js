import util from '../lib/util'
import logger from '../lib/logger'
import emitter from '../lib/emitter'

let style = null;

export default [
    {
        name: 'Border All',
        fn()
        {
            if (style) 
            {
                util.evalCss.remove(style);
                style = null;
                return;
            }

            style = util.evalCss(borderCss);
        },
        desc: 'Add color borders to all elements'
    },
    {
        name: 'Refresh Page',
        fn()
        {
            let url = new util.Url();
            url.setQuery('timestamp', util.now());

            window.location.replace(url.toString());
        },
        desc: 'Add timestamp to url and refresh'
    },
    {
        name: 'Search Text',
        fn()
        {
            let keyword = prompt('Enter the text');

            search(keyword);
        },
        desc: 'Highlight given text on page'
    },
    {
        name: 'Edit Page',
        fn()
        {
            let body = document.body;

            body.contentEditable = body.contentEditable !== 'true';
        },
        desc: 'Toggle body contentEditable'
    },
    {
        name: 'Load Fps Plugin',
        fn() 
        {
            loadPlugin('fps');
        },
        desc: 'Display page fps'
    },
    {
        name: 'Restore Settings',
        fn() 
        {
            let store = util.safeStorage('local');

            util.each(store, (val, key) => 
            {
                if (util.startWith(key, 'eruda')) store.removeItem(key);
            });

            window.location.reload();
        },
        desc: 'Restore defaults and reload'
    }
];

let borderCss = '',
    styleName = util.has(document.documentElement.style, 'outline') ? 'outline' : 'border',
    selector = 'html',
    colors = ['f5f5f5', 'dabb3a', 'abc1c7', '472936', 'c84941', '296dd1', '67adb4', '1ea061'];

util.each(colors, (color, idx) =>
{
    selector += (idx === 0) ? '>*:not([class^="eruda-"])' : '>*';

    borderCss += selector + `{${styleName}: 2px solid #${color} !important}`;
});

function search(text)
{
    let root = document.documentElement,
        regText = new RegExp(text, 'ig');

    traverse(root, node =>
    {
        let $node = util.$(node);

        if (!$node.hasClass('eruda-search-highlight-block')) return;

        return document.createTextNode($node.text());
    });

    traverse(root, node =>
    {
        if (node.nodeType !== 3) return;

        let val = node.nodeValue;
        val = val.replace(regText, match => `<span class="eruda-keyword">${match}</span>`);
        if (val === node.nodeValue) return;

        let $ret = util.$(document.createElement('div'));

        $ret.html(val);
        $ret.addClass('eruda-search-highlight-block');

        return $ret.get(0);
    });
}

function traverse(root, processor)
{
    let childNodes = root.childNodes;

    if (util.isErudaEl(root)) return;

    for (let i = 0, len = childNodes.length; i < len; i++)
    {
        let newNode = traverse(childNodes[i], processor);
        if (newNode) root.replaceChild(newNode, childNodes[i]);
    }

    return processor(root);
}

function loadPlugin(name) 
{
    let globalName = 'eruda' + util.upperFirst(name);
    if (window[globalName]) return;

    util.loadJs('//cdn.jsdelivr.net/npm/eruda-' + name, (isLoaded) =>
    {
        if (!isLoaded || !window[globalName]) return logger.error('Fail to load plugin ' + name);

        emitter.emit(emitter.ADD, window[globalName]); 
        emitter.emit(emitter.SHOW, name);
    });
}
