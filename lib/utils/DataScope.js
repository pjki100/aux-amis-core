/**
 * amis-core v2.1.0
 * Copyright 2018-2022 fex
 */

'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tslib = require('tslib');
var helper = require('./helper.js');
var keyToPath = require('./keyToPath.js');

var DataScope = /** @class */ (function () {
    function DataScope(schemas, id) {
        this.children = [];
        this.schemas = [];
        this.setSchemas(Array.isArray(schemas) ? schemas : [schemas]);
        this.id = id;
    }
    DataScope.prototype.addChild = function (id, schema) {
        var child = new DataScope(schema || {
            type: 'object',
            properties: {}
        }, id);
        this.children.push(child);
        child.parent = this;
        return child;
    };
    DataScope.prototype.removeChild = function (idOrScope) {
        var idx = this.children.findIndex(function (item) {
            return typeof idOrScope === 'string' ? idOrScope === item.id : item === idOrScope;
        });
        if (~idx) {
            var scope = this.children[idx];
            delete scope.parent;
            this.children.splice(idx, 1);
        }
    };
    DataScope.prototype.setSchemas = function (schemas) {
        this.schemas.splice(0, this.schemas.length);
        for (var _i = 0, schemas_1 = schemas; _i < schemas_1.length; _i++) {
            var schema = schemas_1[_i];
            if (schema.type !== 'object') {
                throw new TypeError('data scope accept only object');
            }
            this.schemas.push(tslib.__assign({ $id: helper.guid() }, schema));
        }
        return this;
    };
    DataScope.prototype.addSchema = function (schema) {
        schema = tslib.__assign({ $id: helper.guid() }, schema);
        this.schemas.push(schema);
        return this;
    };
    DataScope.prototype.removeSchema = function (id) {
        var idx = this.schemas.findIndex(function (schema) { return schema.$id === id; });
        if (~idx) {
            this.schemas.splice(idx, 1);
        }
        return this;
    };
    DataScope.prototype.contains = function (scope) {
        var from = scope;
        while (from) {
            if (this === from) {
                return true;
            }
            from = from.parent;
        }
        return false;
    };
    DataScope.prototype.getMergedSchema = function () {
        var mergedSchema = {
            type: 'object',
            properties: {}
        };
        // todo ??????????????????????????????????????????????????????
        this.schemas.forEach(function (schema) {
            var properties = schema.properties || {};
            Object.keys(properties).forEach(function (key) {
                var value = properties[key];
                if (mergedSchema.properties[key]) {
                    if (Array.isArray(mergedSchema.properties[key].oneOf)) {
                        mergedSchema.properties[key].oneOf.push();
                    }
                    else if (mergedSchema.properties[key].type &&
                        mergedSchema.properties[key].type !== value.type) {
                        mergedSchema.properties[key] = {
                            oneOf: [mergedSchema.properties[key], value]
                        };
                    }
                }
                else {
                    mergedSchema.properties[key] = value;
                }
            });
        });
        return mergedSchema;
    };
    DataScope.prototype.buildOptions = function (options, schema, path, key, 
    /** ??????????????????????????????????????????????????????????????????????????? */
    isArrayItem, 
    /** ?????????????????????????????????????????????????????? */
    disabled) {
        var _this = this;
        var _a;
        if (path === void 0) { path = ''; }
        if (key === void 0) { key = ''; }
        if (isArrayItem === void 0) { isArrayItem = false; }
        // todo ?????? oneOf, anyOf
        var option = {
            label: schema.title || key,
            value: path,
            type: schema.type,
            tag: (_a = schema.description) !== null && _a !== void 0 ? _a : schema.type,
            disabled: disabled
        };
        options.push(option);
        if (schema.type === 'object' && schema.properties) {
            option.children = [];
            var keys = Object.keys(schema.properties);
            keys.forEach(function (key) {
                var child = schema.properties[key];
                var newPath = isArrayItem ? "ARRAYMAP(".concat(path, ", item => item.").concat(key, ")") : (path + (path ? '.' : '') + key);
                _this.buildOptions(option.children, child, newPath, key, isArrayItem, false);
            });
        }
        else if (schema.type === 'array' && schema.items) {
            option.children = [];
            this.buildOptions(option.children, tslib.__assign({ title: '??????' }, schema.items), path, 'items', true, true);
            this.buildOptions(option.children, {
                title: '??????',
                type: 'number'
            }, path + (path ? '.' : '') + 'length', 'length', true, isArrayItem);
        }
    };
    DataScope.prototype.getDataPropsAsOptions = function () {
        var variables = [];
        this.buildOptions(variables, this.getMergedSchema());
        return variables[0].children;
    };
    DataScope.prototype.getSchemaByPath = function (path) {
        var parts = keyToPath.keyToPath(path);
        for (var _i = 0, _a = this.schemas; _i < _a.length; _i++) {
            var schema = _a[_i];
            var result = parts.reduce(function (schema, key) {
                if (schema && schema.type === 'object' && schema.properties) {
                    return schema.properties[key];
                }
                return null;
            }, schema);
            if (result) {
                return result;
            }
        }
        return null;
    };
    return DataScope;
}());

exports.DataScope = DataScope;
