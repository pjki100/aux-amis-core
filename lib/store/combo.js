/**
 * amis-core v2.1.0
 * Copyright 2018-2022 fex
 */

'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var mobxStateTree = require('mobx-state-tree');
var iRenderer = require('./iRenderer.js');
var manager = require('./manager.js');

var UniqueGroup = mobxStateTree.types
    .model('UniqueGroup', {
    name: mobxStateTree.types.identifier,
    itemsRef: mobxStateTree.types.array(mobxStateTree.types.string)
})
    .views(function (self) { return ({
    get items() {
        return self.itemsRef.map(function (id) { return manager.getStoreById(id); });
    }
}); })
    .actions(function (self) { return ({
    removeItem: function (item) {
        self.itemsRef.replace(self.itemsRef.filter(function (id) { return id !== item.id; }));
    },
    addItem: function (item) {
        self.itemsRef.push(item.id);
    }
}); });
var ComboStore = iRenderer.iRendererStore
    .named('ComboStore')
    .props({
    uniques: mobxStateTree.types.map(UniqueGroup),
    multiple: false,
    formsRef: mobxStateTree.types.optional(mobxStateTree.types.array(mobxStateTree.types.string), []),
    minLength: 0,
    maxLength: 0,
    length: 0,
    activeKey: 0
})
    .views(function (self) {
    function getForms() {
        return self.formsRef.map(function (item) { return manager.getStoreById(item); });
    }
    return {
        get forms() {
            return getForms();
        },
        get addable() {
            if (self.maxLength && self.length >= self.maxLength) {
                return false;
            }
            if (self.uniques.size) {
                var isFull_1 = false;
                self.uniques.forEach(function (item) {
                    if (isFull_1 || !item.items.length) {
                        return;
                    }
                    var total = item.items[0].options.length;
                    var current = item.items.reduce(function (total, item) {
                        return total + item.selectedOptions.length;
                    }, 0);
                    isFull_1 = total && current >= total ? true : false;
                });
                if (isFull_1) {
                    return false;
                }
            }
            return true;
        },
        get removable() {
            if (self.minLength && self.minLength >= self.length) {
                return false;
            }
            return true;
        },
        /**
         * name ?????????????????????
         * 1. ???????????????????????????????????????????????????????????????????????????????????????form???????????????????????????????????????
         * 2. ?????????????????? name ????????????????????????????????????????????????????????????????????????????????????????????????items??????????????????form
         *
         * @param name ?????????name
         */
        getItemsByName: function (name) {
            var forms = getForms();
            return self.multiple
                ? [forms[parseInt(name, 10)]]
                : forms[0].getItemsByName(name);
        }
    };
})
    .actions(function (self) {
    function config(setting) {
        typeof setting.multiple !== 'undefined' &&
            (self.multiple = setting.multiple);
        typeof setting.minLength !== 'undefined' &&
            (self.minLength = parseInt(setting.minLength, 10));
        typeof setting.maxLength !== 'undefined' &&
            (self.maxLength = parseInt(setting.maxLength, 10));
        typeof setting.length !== 'undefined' && (self.length = setting.length);
    }
    function bindUniuqueItem(item) {
        if (!self.uniques.has(item.name)) {
            self.uniques.put({
                name: item.name
            });
        }
        var group = self.uniques.get(item.name);
        group.addItem(item);
    }
    function unBindUniuqueItem(item) {
        var group = self.uniques.get(item.name);
        group.removeItem(item);
        if (!group.items.length) {
            self.uniques.delete(item.name);
        }
    }
    function addForm(form) {
        self.formsRef.push(form.id);
    }
    function onChildStoreDispose(child) {
        if (child.storeType === 'FormStore') {
            var idx = self.formsRef.indexOf(child.id);
            if (~idx) {
                self.formsRef.splice(idx, 1);
                child.items.forEach(function (item) {
                    if (item.unique) {
                        unBindUniuqueItem(item);
                    }
                });
                self.forms.forEach(function (form) {
                    return form.items.forEach(function (item) { return item.unique && item.syncOptions(undefined, form.data); });
                });
            }
        }
        self.removeChildId(child.id);
    }
    function setActiveKey(key) {
        self.activeKey = key;
    }
    return {
        config: config,
        setActiveKey: setActiveKey,
        bindUniuqueItem: bindUniuqueItem,
        unBindUniuqueItem: unBindUniuqueItem,
        addForm: addForm,
        onChildStoreDispose: onChildStoreDispose
    };
});

exports.ComboStore = ComboStore;
exports.UniqueGroup = UniqueGroup;
