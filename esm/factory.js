/**
 * amis-core v2.1.0
 * Copyright 2018-2022 fex
 */

import { __assign } from 'tslib';
import React from 'react';
import { RendererStore } from './store/index.js';
import { destroy, getEnv } from 'mobx-state-tree';
import { wrapFetcher } from './utils/api.js';
import { normalizeLink } from './utils/normalizeLink.js';
import { qsparse, findIndex, promisify } from './utils/helper.js';
import { observer } from 'mobx-react';
import { HocScoped } from './Scoped.js';
import find from 'lodash/find';
import { HocStoreFactory } from './WithStore.js';
import { Placeholder } from './renderers/Placeholder.js';
import { string2regExp } from './utils/string2regExp.js';

var _a, _b;
var renderers = [];
var renderersMap = {};
var schemaFilters = [];
var anonymousIndex = 1;
function addSchemaFilter(fn) {
    schemaFilters.push(fn);
}
function filterSchema(schema, render, props) {
    return schemaFilters.reduce(function (schema, filter) { return filter(schema, render, props); }, schema);
}
function Renderer(config) {
    return function (component) {
        var renderer = registerRenderer(__assign(__assign({}, config), { component: component }));
        return renderer.component;
    };
}
function registerRenderer(config) {
    if (!config.test && !config.type) {
        throw new TypeError('please set config.test or config.type');
    }
    else if (!config.component) {
        throw new TypeError('config.component is required');
    }
    if (typeof config.type === 'string' && config.type) {
        config.type = config.type.toLowerCase();
        config.test =
            config.test || new RegExp("(^|/)".concat(string2regExp(config.type), "$"), 'i');
    }
    config.weight = config.weight || 0;
    config.Renderer = config.component;
    config.name = config.name || config.type || "anonymous-".concat(anonymousIndex++);
    if (renderersMap[config.name]) {
        console.info('config.name:'+config.name);
        console.warn("The renderer with name \"".concat(config.name, "\" has already exists, please try another name!"));
        return config;
        
    }
    else if (renderersMap.hasOwnProperty(config.name)) {
        // ???????????????
        var idx_1 = findIndex(renderers, function (item) { return item.name === config.name; });
        ~idx_1 && renderers.splice(idx_1, 0, config);
    }
    if (config.storeType && config.component) {
        config.component = HocStoreFactory({
            storeType: config.storeType,
            extendsData: config.storeExtendsData,
            shouldSyncSuperStore: config.shouldSyncSuperStore
        })(observer(config.component));
    }
    if (config.isolateScope) {
        config.component = HocScoped(config.component);
    }
    var idx = findIndex(renderers, function (item) { return config.weight < item.weight; });
    ~idx ? renderers.splice(idx, 0, config) : renderers.push(config);
    renderersMap[config.name] = config.component !== Placeholder;
    return config;
}
function unRegisterRenderer(config) {
    var name = (typeof config === 'string' ? config : config.name);
    delete renderersMap[name];
    // ???????????????????????????
    cache = {};
}
function loadRenderer(schema, path) {
    return (React.createElement("div", { className: "RuntimeError" },
        React.createElement("p", null, "Error: \u627E\u4E0D\u5230\u5BF9\u5E94\u7684\u6E32\u67D3\u5668"),
        React.createElement("p", null,
            "Path: ",
            path),
        React.createElement("pre", null,
            React.createElement("code", null, JSON.stringify(schema, null, 2)))));
}
var defaultOptions = {
    session: 'global',
    affixOffsetTop: 0,
    affixOffsetBottom: 0,
    richTextToken: '',
    useMobileUI: true,
    enableAMISDebug: (_b = (_a = window.enableAMISDebug) !== null && _a !== void 0 ? _a : location.search.indexOf('amisDebug=1') !== -1) !== null && _b !== void 0 ? _b : false,
    loadRenderer: loadRenderer,
    fetcher: function () {
        return Promise.reject('fetcher is required');
    },
    // ?????? WebSocket ?????????????????????
    wsFetcher: function (ws, onMessage, onError) {
        if (ws) {
            var socket_1 = new WebSocket(ws.url);
            socket_1.onopen = function (event) {
                if (ws.body) {
                    socket_1.send(JSON.stringify(ws.body));
                }
            };
            socket_1.onmessage = function (event) {
                var _a;
                if (event.data) {
                    var data = void 0;
                    try {
                        data = JSON.parse(event.data);
                    }
                    catch (error) { }
                    if (typeof data !== 'object') {
                        var key = ws.responseKey || 'data';
                        data = (_a = {},
                            _a[key] = event.data,
                            _a);
                    }
                    onMessage(data);
                }
            };
            socket_1.onerror = onError;
            return {
                close: socket_1.close
            };
        }
        else {
            return {
                close: function () { }
            };
        }
    },
    isCancel: function () {
        console.error('Please implement isCancel. see https://baidu.gitee.io/amis/docs/start/getting-started#%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97');
        return false;
    },
    updateLocation: function () {
        console.error('Please implement updateLocation. see https://baidu.gitee.io/amis/docs/start/getting-started#%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97');
    },
    jumpTo: function (to, action) {
        if (to === 'goBack') {
            return window.history.back();
        }
        to = normalizeLink(to);
        if (action && action.actionType === 'url') {
            action.blank === false ? (window.location.href = to) : window.open(to);
            return;
        }
        if (/^https?:\/\//.test(to)) {
            window.location.replace(to);
        }
        else {
            location.href = to;
        }
    },
    isCurrentUrl: function (to) {
        if (!to) {
            return false;
        }
        var link = normalizeLink(to);
        var location = window.location;
        var pathname = link;
        var search = '';
        var idx = link.indexOf('?');
        if (~idx) {
            pathname = link.substring(0, idx);
            search = link.substring(idx);
        }
        if (search) {
            if (pathname !== location.pathname || !location.search) {
                return false;
            }
            var query_1 = qsparse(search.substring(1));
            var currentQuery_1 = qsparse(location.search.substring(1));
            return Object.keys(query_1).every(function (key) { return query_1[key] === currentQuery_1[key]; });
        }
        else if (pathname === location.pathname) {
            return true;
        }
        return false;
    },
    copy: function (contents) {
        console.error('copy contents', contents);
    },
    // ?????????????????????????????????????????????
    tracker: function (eventTrack, props) { },
    rendererResolver: resolveRenderer,
    replaceTextIgnoreKeys: [
        'type',
        'name',
        'mode',
        'target',
        'reload',
        'persistData'
    ],
    /**
     * ?????? html ???????????????????????? xss ????????????
     */
    filterHtml: function (input) { return input; }
};
var stores = {};
// ?????? env ????????????????????????????????? env ?????????????????????
// ?????????????????????????????????????????????
function clearStoresCache(sessions) {
    if (sessions === void 0) { sessions = Object.keys(stores); }
    if (!Array.isArray(sessions)) {
        sessions = [sessions];
    }
    sessions.forEach(function (key) {
        var store = stores[key];
        // @ts-ignore
        delete stores[key];
        store && destroy(store);
    });
}
// ????????????????????????????????????
// ????????????????????????????????????????????????????????????????????????
// ?????????????????????????????? amis ??????????????????prompt ??????????????????
function updateEnv(options, session) {
    if (session === void 0) { session = 'global'; }
    options = __assign({}, options);
    if (options.fetcher) {
        options.fetcher = wrapFetcher(options.fetcher, options.tracker);
    }
    if (options.confirm) {
        options.confirm = promisify(options.confirm);
    }
    var store = stores[options.session || session];
    if (!store) {
        store = RendererStore.create({}, __assign(__assign({}, defaultOptions), options));
        stores[options.session || session] = store;
    }
    else {
        var env = getEnv(store);
        Object.assign(env, options);
    }
}
// ??????????????? env ?????????????????????????????????????????????
function extendDefaultEnv(env) {
    Object.assign(defaultOptions, env);
}
var cache = {};
function resolveRenderer(path, schema) {
    var type = typeof (schema === null || schema === void 0 ? void 0 : schema.type) == 'string' ? schema.type.toLowerCase() : '';
    if (type && cache[type]) {
        return cache[type];
    }
    else if (cache[path]) {
        return cache[path];
    }
    else if (path && path.length > 1024) {
        throw new Error('Path??????????????????????????????');
    }
    var renderer = null;
    renderers.some(function (item) {
        var matched = false;
        // ????????????????????????????????????????????????????????????????????????????????????????????????
        if (item.type && type) {
            matched = item.type === type;
            // ?????????type?????????????????????cache???key????????? type ?????????
            if (matched) {
                cache[type] = item;
            }
        }
        else if (typeof item.test === 'function') {
            // ????????????????????????????????????????????????????????? id??????????????????????????????????????????
            matched = item.test(path, schema, resolveRenderer);
        }
        else if (item.test instanceof RegExp) {
            matched = item.test.test(path);
        }
        if (matched) {
            renderer = item;
        }
        return matched;
    });
    // ?????????????????????????????????????????????????????????????????????????????????
    // ??????????????? test ???????????????????????? schema ?????????
    if (renderer !== null &&
        renderer.component !== Placeholder &&
        (renderer.type ||
            renderer.test instanceof RegExp ||
            (typeof renderer.test === 'function' &&
                renderer.test.length < 2))) {
        cache[path] = renderer;
    }
    return renderer;
}
function getRenderers() {
    return renderers.concat();
}
function getRendererByName(name) {
    return find(renderers, function (item) { return item.name === name; });
}

export { Renderer, addSchemaFilter, clearStoresCache, defaultOptions, extendDefaultEnv, filterSchema, getRendererByName, getRenderers, loadRenderer, registerRenderer, resolveRenderer, stores, unRegisterRenderer, updateEnv };
