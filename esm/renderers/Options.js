/**
 * amis-core v2.1.0
 * Copyright 2018-2022 fex
 */

import { __extends, __awaiter, __generator, __assign, __spreadArray, __decorate, __metadata } from 'tslib';
import { isEffectiveApi, isApiOutdated } from '../utils/api.js';
import { isAlive } from 'mobx-state-tree';
import { anyChanged, isEmpty, getTreeAncestors, getTreeDepth, flattenTree, spliceTree, getTree, findTreeIndex, normalizeNodePath, autobind } from '../utils/helper.js';
import { reaction } from 'mobx';
import { registerFormItem, detectProps as detectProps$1 } from './Item.js';
import React from 'react';
import 'amis-formula';
import 'moment';
import { createObject, setVariable } from '../utils/object.js';
import { isPureVariable } from '../utils/isPureVariable.js';
import { getVariable } from '../utils/getVariable.js';
import { resolveVariableAndFilter } from '../utils/resolveVariableAndFilter.js';
import { dataMapping } from '../utils/dataMapping.js';
import '../utils/filter.js';
import { filter } from '../utils/tpl.js';
import findIndex from 'lodash/findIndex';
import isPlainObject from 'lodash/isPlainObject';
import { normalizeOptions } from '../utils/normalizeOptions.js';
import { optionValueCompare } from '../utils/optionValueCompare.js';
import { keyToPath } from '../utils/keyToPath.js';

var detectProps = detectProps$1.concat([
    'value',
    'options',
    'size',
    'buttons',
    'columnsCount',
    'multiple',
    'hideRoot',
    'checkAll',
    'defaultCheckAll',
    'showIcon',
    'showRadio',
    'btnDisabled',
    'joinValues',
    'extractValue',
    'borderMode',
    'hideSelected'
]);
function registerOptionsControl(config) {
    var Control = config.component;
    var FormOptionsItem = /** @class */ (function (_super) {
        __extends(FormOptionsItem, _super);
        function FormOptionsItem(props) {
            var _this = this;
            var _a;
            _this = _super.call(this, props) || this;
            _this.toDispose = [];
            _this.mounted = false;
            var initFetch = props.initFetch, formItem = props.formItem, source = props.source, data = props.data, setPrinstineValue = props.setPrinstineValue, defaultValue = props.defaultValue, multiple = props.multiple, joinValues = props.joinValues, extractValue = props.extractValue, addHook = props.addHook, formInited = props.formInited, valueField = props.valueField, options = props.options, value = props.value, defaultCheckAll = props.defaultCheckAll;
            if (formItem) {
                formItem.setOptions(normalizeOptions(options, undefined, valueField), _this.changeOptionValue, data);
                _this.toDispose.push(reaction(function () { return JSON.stringify([formItem.loading, formItem.filteredOptions]); }, function () { return _this.mounted && _this.forceUpdate(); }));
                _this.toDispose.push(reaction(function () {
                    return JSON.stringify(formItem.getSelectedOptions(formItem.tmpValue));
                }, function () {
                    return _this.mounted &&
                        _this.syncAutoFill(formItem.getSelectedOptions(formItem.tmpValue));
                }));
                // ????????????????????????????????????\?????????????????????????????????????????????source????????????????????????
                if (multiple &&
                    defaultCheckAll &&
                    ((_a = formItem.filteredOptions) === null || _a === void 0 ? void 0 : _a.length) &&
                    !source) {
                    _this.defaultCheckAll();
                }
            }
            var loadOptions = initFetch !== false;
            if (formItem && joinValues === false && defaultValue) {
                var selectedOptions = extractValue
                    ? formItem
                        .getSelectedOptions(value)
                        .map(function (selectedOption) {
                        return selectedOption[valueField || 'value'];
                    })
                    : formItem.getSelectedOptions(value);
                setPrinstineValue(multiple ? selectedOptions.concat() : selectedOptions[0]);
            }
            loadOptions &&
                config.autoLoadOptionsFromSource !== false &&
                (formInited || !addHook
                    ? _this.reload()
                    : addHook && addHook(_this.initOptions, 'init'));
            return _this;
        }
        FormOptionsItem.prototype.componentDidMount = function () {
            this.mounted = true;
            this.normalizeValue();
        };
        FormOptionsItem.prototype.shouldComponentUpdate = function (nextProps) {
            var _a;
            if (config.strictMode === false || nextProps.strictMode === false) {
                return true;
            }
            else if (nextProps.source || nextProps.autoComplete) {
                return true;
            }
            else if ((_a = nextProps.formItem) === null || _a === void 0 ? void 0 : _a.expressionsInOptions) {
                return true;
            }
            if (anyChanged(detectProps, this.props, nextProps)) {
                return true;
            }
            return false;
        };
        FormOptionsItem.prototype.componentDidUpdate = function (prevProps) {
            var _this = this;
            var props = this.props;
            var formItem = props.formItem;
            if (prevProps.options !== props.options && formItem) {
                formItem.setOptions(normalizeOptions(props.options || [], undefined, props.valueField), this.changeOptionValue, props.data);
                this.normalizeValue();
            }
            else if (config.autoLoadOptionsFromSource !== false &&
                (props.formInited || typeof props.formInited === 'undefined') &&
                props.source &&
                formItem &&
                (prevProps.source !== props.source || prevProps.data !== props.data)) {
                if (isPureVariable(props.source)) {
                    var prevOptions = resolveVariableAndFilter(prevProps.source, prevProps.data, '| raw');
                    var options = resolveVariableAndFilter(props.source, props.data, '| raw');
                    if (prevOptions !== options) {
                        formItem.setOptions(normalizeOptions(options || [], undefined, props.valueField || 'value'), this.changeOptionValue, props.data);
                        this.normalizeValue();
                    }
                }
                else if (isEffectiveApi(props.source, props.data) &&
                    isApiOutdated(prevProps.source, props.source, prevProps.data, props.data)) {
                    formItem
                        .loadOptions(props.source, props.data, undefined, true, this.changeOptionValue)
                        .then(function () { return _this.normalizeValue(); });
                }
            }
            if (prevProps.value !== props.value || (formItem === null || formItem === void 0 ? void 0 : formItem.expressionsInOptions)) {
                formItem === null || formItem === void 0 ? void 0 : formItem.syncOptions(undefined, props.data);
            }
        };
        FormOptionsItem.prototype.componentWillUnmount = function () {
            var _a, _b;
            (_b = (_a = this.props).removeHook) === null || _b === void 0 ? void 0 : _b.call(_a, this.reload, 'init');
            this.toDispose.forEach(function (fn) { return fn(); });
            this.toDispose = [];
        };
        FormOptionsItem.prototype.dispatchOptionEvent = function (eventName, eventData) {
            if (eventData === void 0) { eventData = ''; }
            return __awaiter(this, void 0, void 0, function () {
                var _a, dispatchEvent, options, data, rendererEvent;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = this.props, dispatchEvent = _a.dispatchEvent, options = _a.options, data = _a.data;
                            return [4 /*yield*/, dispatchEvent(eventName, createObject(data, {
                                    value: eventData,
                                    options: options
                                }))];
                        case 1:
                            rendererEvent = _b.sent();
                            // ??????????????????
                            return [2 /*return*/, !!(rendererEvent === null || rendererEvent === void 0 ? void 0 : rendererEvent.prevented)];
                    }
                });
            });
        };
        FormOptionsItem.prototype.doAction = function (action, data, throwErrors) {
            var _a = this.props, resetValue = _a.resetValue, onChange = _a.onChange;
            var actionType = action === null || action === void 0 ? void 0 : action.actionType;
            if (actionType === 'clear') {
                onChange === null || onChange === void 0 ? void 0 : onChange('');
            }
            else if (actionType === 'reset') {
                onChange === null || onChange === void 0 ? void 0 : onChange(resetValue !== null && resetValue !== void 0 ? resetValue : '');
            }
        };
        FormOptionsItem.prototype.syncAutoFill = function (selectedOptions) {
            var _a = this.props, autoFill = _a.autoFill, multiple = _a.multiple, onBulkChange = _a.onBulkChange, data = _a.data;
            var formItem = this.props.formItem;
            // ???????????????????????????
            if (autoFill === null || autoFill === void 0 ? void 0 : autoFill.hasOwnProperty('api')) {
                return;
            }
            if (onBulkChange &&
                autoFill &&
                !isEmpty(autoFill) &&
                formItem.filteredOptions.length) {
                var toSync_1 = dataMapping(autoFill, multiple
                    ? {
                        items: selectedOptions.map(function (item) {
                            return createObject(__assign(__assign({}, data), { ancestors: getTreeAncestors(formItem.filteredOptions, item, true) }), item);
                        })
                    }
                    : createObject(__assign(__assign({}, data), { ancestors: getTreeAncestors(formItem.filteredOptions, selectedOptions[0], true) }), selectedOptions[0]));
                Object.keys(autoFill).forEach(function (key) {
                    var keys = keyToPath(key);
                    // ??????????????? key ???????????????
                    // ??????????????????????????????????????????????????????
                    // ??????????????????????????????????????????????????????
                    if (keys.length > 1 && isPlainObject(data[keys[0]])) {
                        var obj = __assign({}, data[keys[0]]);
                        var value = getVariable(toSync_1, key);
                        toSync_1[keys[0]] = obj;
                        setVariable(toSync_1, key, value);
                    }
                });
                onBulkChange(toSync_1);
            }
        };
        // ??????????????????????????????????????????????????????????????????
        FormOptionsItem.prototype.normalizeValue = function () {
            var _a = this.props, joinValues = _a.joinValues, extractValue = _a.extractValue, value = _a.value, multiple = _a.multiple, formItem = _a.formItem, valueField = _a.valueField; _a.enableNodePath; _a.pathSeparator; var onChange = _a.onChange;
            if (!formItem || joinValues !== false || !formItem.options.length) {
                return;
            }
            if (extractValue === false &&
                (typeof value === 'string' || typeof value === 'number')) {
                var selectedOptions = formItem.getSelectedOptions(value);
                onChange === null || onChange === void 0 ? void 0 : onChange(multiple ? selectedOptions.concat() : selectedOptions[0]);
            }
            else if (extractValue === true &&
                value &&
                !((Array.isArray(value) &&
                    value.every(function (val) { return typeof val === 'string' || typeof val === 'number'; })) ||
                    typeof value === 'string' ||
                    typeof value === 'number')) {
                var selectedOptions = formItem
                    .getSelectedOptions(value)
                    .map(function (selectedOption) { return selectedOption[valueField || 'value']; });
                onChange === null || onChange === void 0 ? void 0 : onChange(multiple ? selectedOptions.concat() : selectedOptions[0]);
            }
        };
        FormOptionsItem.prototype.getWrappedInstance = function () {
            return this.input;
        };
        FormOptionsItem.prototype.inputRef = function (ref) {
            this.input = ref;
        };
        FormOptionsItem.prototype.handleToggle = function (option, submitOnChange, changeImmediately) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, onChange, formItem, value, newValue, isPrevented;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = this.props, onChange = _a.onChange, formItem = _a.formItem, value = _a.value;
                            if (!formItem) {
                                return [2 /*return*/];
                            }
                            newValue = this.toggleValue(option, value);
                            return [4 /*yield*/, this.dispatchOptionEvent('change', newValue)];
                        case 1:
                            isPrevented = _b.sent();
                            isPrevented ||
                                (onChange && onChange(newValue, submitOnChange, changeImmediately));
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * ????????????????????????????????????
         */
        FormOptionsItem.prototype.defaultCheckAll = function () {
            var _a = this.props, value = _a.value, formItem = _a.formItem, setPrinstineValue = _a.setPrinstineValue;
            // ??????????????????\?????????????????????
            if (!formItem || formItem.getSelectedOptions(value).length) {
                return;
            }
            var valueArray = formItem.filteredOptions.concat();
            var newValue = this.formatValueArray(valueArray);
            setPrinstineValue === null || setPrinstineValue === void 0 ? void 0 : setPrinstineValue(newValue);
        };
        /**
         * ??????????????????joinValues???delimiter???????????????????????????????????????
         * @param valueArray ??????????????????
         * @returns ??????joinValues???delimiter?????????????????????????????????
         */
        FormOptionsItem.prototype.formatValueArray = function (valueArray) {
            var _a = this.props, joinValues = _a.joinValues, extractValue = _a.extractValue, valueField = _a.valueField, delimiter = _a.delimiter, resetValue = _a.resetValue, multiple = _a.multiple;
            var newValue = '';
            if (multiple) {
                /** ??????tree???????????? */
                newValue =
                    getTreeDepth(valueArray) > 1 ? flattenTree(valueArray) : valueArray;
                if (joinValues) {
                    newValue = newValue
                        .map(function (item) { return item[valueField || 'value']; })
                        .filter(function (item) { return item != null; }) /** tree????????????????????????value??? */
                        .join(delimiter);
                }
                else if (extractValue) {
                    newValue = newValue
                        .map(function (item) { return item[valueField || 'value']; })
                        .filter(function (item) { return item != null; });
                }
            }
            else {
                newValue = valueArray[0] || resetValue;
                if (joinValues && newValue) {
                    newValue = newValue[valueField || 'value'];
                }
            }
            return newValue;
        };
        FormOptionsItem.prototype.handleToggleAll = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a, value, onChange, formItem, valueField, selectedOptions, filteredOptions, valueArray, newValue, isPrevented;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = this.props, value = _a.value, onChange = _a.onChange, formItem = _a.formItem, valueField = _a.valueField;
                            if (!formItem) {
                                return [2 /*return*/];
                            }
                            selectedOptions = formItem.getSelectedOptions(value);
                            filteredOptions = flattenTree(formItem.filteredOptions.concat()).filter(function (item) { return item != null && item[valueField || 'value'] != null; });
                            valueArray = selectedOptions.length === filteredOptions.length
                                ? []
                                : formItem.filteredOptions.concat();
                            newValue = this.formatValueArray(valueArray);
                            return [4 /*yield*/, this.dispatchOptionEvent('change', newValue)];
                        case 1:
                            isPrevented = _b.sent();
                            isPrevented || (onChange && onChange(newValue));
                            return [2 /*return*/];
                    }
                });
            });
        };
        FormOptionsItem.prototype.toggleValue = function (option, originValue) {
            var _a = this.props, joinValues = _a.joinValues, extractValue = _a.extractValue, valueField = _a.valueField, delimiter = _a.delimiter, clearable = _a.clearable, resetValue = _a.resetValue, multiple = _a.multiple, formItem = _a.formItem;
            var valueArray = originValue !== undefined
                ? formItem.getSelectedOptions(originValue).concat()
                : [];
            var idx = findIndex(valueArray, optionValueCompare(option[valueField || 'value'], valueField || 'value'));
            var newValue = '';
            if (multiple) {
                if (~idx) {
                    valueArray.splice(idx, 1);
                }
                else {
                    valueArray.push(option);
                }
                newValue = valueArray;
                if (joinValues) {
                    newValue = newValue
                        .map(function (item) { return item[valueField || 'value']; })
                        .join(delimiter);
                }
                else if (extractValue) {
                    newValue = newValue.map(function (item) { return item[valueField || 'value']; });
                }
            }
            else {
                if (~idx && clearable) {
                    valueArray.splice(idx, 1);
                }
                else {
                    valueArray = [option];
                }
                newValue = valueArray[0] || resetValue;
                if ((joinValues || extractValue) && newValue) {
                    newValue = newValue[valueField || 'value'];
                }
            }
            return newValue;
        };
        // ?????? action ???????????????????????? reload ?????????????????????????????????????????????
        FormOptionsItem.prototype.reload = function () {
            return this.reloadOptions();
        };
        FormOptionsItem.prototype.reloadOptions = function (setError, isInit) {
            if (isInit === void 0) { isInit = false; }
            var _a = this.props, source = _a.source, formItem = _a.formItem, data = _a.data, onChange = _a.onChange, setPrinstineValue = _a.setPrinstineValue, valueField = _a.valueField;
            if (formItem && isPureVariable(source)) {
                isAlive(formItem) &&
                    formItem.setOptions(normalizeOptions(resolveVariableAndFilter(source, data, '| raw') || [], undefined, valueField), this.changeOptionValue, data);
                return;
            }
            else if (!formItem || !isEffectiveApi(source, data)) {
                return;
            }
            return formItem.loadOptions(source, data, undefined, false, isInit ? setPrinstineValue : onChange, setError);
        };
        FormOptionsItem.prototype.deferLoad = function (option) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, deferApi, source, env, formItem, data, api, json;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = this.props, deferApi = _a.deferApi, source = _a.source, env = _a.env, formItem = _a.formItem, data = _a.data;
                            api = option.deferApi || deferApi || source;
                            if (!api) {
                                env.notify('error', '????????????????????? `deferApi` ???????????????????????? `deferApi`???????????????????????????');
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, (formItem === null || formItem === void 0 ? void 0 : formItem.deferLoadOptions(option, api, createObject(data, option)))];
                        case 1:
                            json = _b.sent();
                            // ??????????????????,????????????
                            this.dispatchOptionEvent('loadFinished', json);
                            return [2 /*return*/];
                    }
                });
            });
        };
        FormOptionsItem.prototype.leftDeferLoad = function (option, leftOptions) {
            var _a = this.props, deferApi = _a.deferApi, source = _a.source, env = _a.env, formItem = _a.formItem, data = _a.data;
            var api = option.deferApi || deferApi || source;
            if (!api) {
                env.notify('error', '????????????????????? `deferApi` ???????????????????????? `deferApi`???????????????????????????');
                return;
            }
            formItem === null || formItem === void 0 ? void 0 : formItem.deferLoadLeftOptions(option, leftOptions, api, createObject(data, option));
        };
        FormOptionsItem.prototype.expandTreeOptions = function (nodePathArr) {
            var _a = this.props, deferApi = _a.deferApi, source = _a.source, env = _a.env, formItem = _a.formItem, data = _a.data;
            var api = deferApi || source;
            if (!api) {
                env.notify('error', '????????????????????? `deferApi` ???????????????????????? `deferApi`???????????????????????????');
                return;
            }
            formItem === null || formItem === void 0 ? void 0 : formItem.expandTreeOptions(nodePathArr, api, createObject(data));
        };
        FormOptionsItem.prototype.initOptions = function (data) {
            var _a;
            return __awaiter(this, void 0, void 0, function () {
                var _b, formItem, name, multiple, defaultCheckAll;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.reloadOptions(false, true)];
                        case 1:
                            _c.sent();
                            _b = this.props, formItem = _b.formItem, name = _b.name, multiple = _b.multiple, defaultCheckAll = _b.defaultCheckAll;
                            if (!formItem) {
                                return [2 /*return*/];
                            }
                            if (isAlive(formItem) && formItem.value) {
                                setVariable(data, name, formItem.value);
                            }
                            // ????????????
                            if (multiple && defaultCheckAll && ((_a = formItem.filteredOptions) === null || _a === void 0 ? void 0 : _a.length)) {
                                this.defaultCheckAll();
                            }
                            return [2 /*return*/];
                    }
                });
            });
        };
        FormOptionsItem.prototype.focus = function () {
            this.input && this.input.focus && this.input.focus();
        };
        FormOptionsItem.prototype.changeOptionValue = function (value) {
            var _a = this.props, onChange = _a.onChange, formInited = _a.formInited, setPrinstineValue = _a.setPrinstineValue, originValue = _a.value;
            if (formInited === false) {
                originValue === undefined && (setPrinstineValue === null || setPrinstineValue === void 0 ? void 0 : setPrinstineValue(value));
            }
            else {
                onChange === null || onChange === void 0 ? void 0 : onChange(value);
            }
        };
        FormOptionsItem.prototype.setOptions = function (options, skipNormalize) {
            if (skipNormalize === void 0) { skipNormalize = false; }
            var formItem = this.props.formItem;
            formItem &&
                formItem.setOptions(skipNormalize
                    ? options
                    : normalizeOptions(options || [], undefined, this.props.valueField), this.changeOptionValue, this.props.data);
        };
        FormOptionsItem.prototype.syncOptions = function () {
            var formItem = this.props.formItem;
            formItem && formItem.syncOptions(undefined, this.props.data);
        };
        FormOptionsItem.prototype.setLoading = function (value) {
            var formItem = this.props.formItem;
            formItem && formItem.setLoading(value);
        };
        FormOptionsItem.prototype.handleOptionAdd = function (idx, value, skipForm) {
            if (idx === void 0) { idx = -1; }
            if (skipForm === void 0) { skipForm = false; }
            return __awaiter(this, void 0, void 0, function () {
                var _a, addControls, disabled, labelField, onOpenDialog, optionLabel, addApi, source, data, valueField, model, createBtnLabel, env, __, parent, ctx, result, _b, payload, e_1, isPrevented, options;
                var _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            _a = this.props, addControls = _a.addControls, disabled = _a.disabled, labelField = _a.labelField, onOpenDialog = _a.onOpenDialog, optionLabel = _a.optionLabel, addApi = _a.addApi, source = _a.source, data = _a.data, valueField = _a.valueField, model = _a.formItem, createBtnLabel = _a.createBtnLabel, env = _a.env, __ = _a.translate;
                            // ???????????????????????? name
                            if (disabled || !model) {
                                return [2 /*return*/];
                            }
                            // ??????????????????????????????????????????????????? label ??????
                            if (!skipForm && (!Array.isArray(addControls) || !addControls.length)) {
                                addControls = [
                                    {
                                        type: 'text',
                                        name: labelField || 'label',
                                        label: false,
                                        required: true,
                                        placeholder: __('Options.addPlaceholder')
                                    }
                                ];
                            }
                            parent = Array.isArray(idx)
                                ? getTree(model.options, idx.slice(0, -1))
                                : undefined;
                            ctx = createObject(data, Array.isArray(idx)
                                ? __assign({ parent: parent }, value) : value);
                            if (!skipForm) return [3 /*break*/, 1];
                            _b = ctx;
                            return [3 /*break*/, 3];
                        case 1: return [4 /*yield*/, onOpenDialog({
                                type: 'dialog',
                                title: createBtnLabel || "\u65B0\u589E".concat(optionLabel || '??????'),
                                body: {
                                    type: 'form',
                                    api: addApi,
                                    controls: __spreadArray([
                                        {
                                            type: 'hidden',
                                            name: 'idx',
                                            value: idx
                                        },
                                        {
                                            type: 'hidden',
                                            name: 'parent',
                                            value: parent
                                        }
                                    ], (addControls || []), true)
                                }
                            }, ctx)];
                        case 2:
                            _b = _d.sent();
                            _d.label = 3;
                        case 3:
                            result = _b;
                            if (!(skipForm && addApi)) return [3 /*break*/, 7];
                            _d.label = 4;
                        case 4:
                            _d.trys.push([4, 6, , 7]);
                            return [4 /*yield*/, env.fetcher(addApi, result, {
                                    method: 'post'
                                })];
                        case 5:
                            payload = _d.sent();
                            if (!payload.ok) {
                                env.notify('error', payload.msg || __('Options.createFailed'));
                                result = null;
                            }
                            else {
                                result = payload.data || result;
                            }
                            return [3 /*break*/, 7];
                        case 6:
                            e_1 = _d.sent();
                            result = null;
                            console.error(e_1);
                            env.notify('error', e_1.message);
                            return [3 /*break*/, 7];
                        case 7:
                            // ??? result ???????????????????????????????????????????????????
                            if (!result) {
                                return [2 /*return*/];
                            }
                            // ?????????????????????
                            if (!result.hasOwnProperty(valueField || 'value')) {
                                result = __assign(__assign({}, result), (_c = {}, _c[valueField || 'value'] = result[labelField || 'label'], _c));
                            }
                            return [4 /*yield*/, this.dispatchOptionEvent('add', __assign(__assign({}, result), { idx: idx }))];
                        case 8:
                            isPrevented = _d.sent();
                            if (isPrevented) {
                                return [2 /*return*/];
                            }
                            if (!(parent === null || parent === void 0 ? void 0 : parent.defer)) return [3 /*break*/, 10];
                            return [4 /*yield*/, this.deferLoad(parent)];
                        case 9:
                            _d.sent();
                            return [3 /*break*/, 11];
                        case 10:
                            if (source && addApi) {
                                // ??????????????? source ???????????? addApi ?????????????????????????????????
                                // ??????????????? addApi ??????????????????????????????????????????????????????
                                this.reload();
                            }
                            else {
                                options = model.options.concat();
                                if (Array.isArray(idx)) {
                                    options = spliceTree(options, idx, 0, __assign({}, result));
                                }
                                else {
                                    ~idx
                                        ? options.splice(idx, 0, __assign({}, result))
                                        : options.push(__assign({}, result));
                                }
                                model.setOptions(options, this.changeOptionValue, data);
                            }
                            _d.label = 11;
                        case 11: return [2 /*return*/];
                    }
                });
            });
        };
        FormOptionsItem.prototype.handleOptionEdit = function (value, origin, skipForm) {
            if (origin === void 0) { origin = value; }
            if (skipForm === void 0) { skipForm = false; }
            return __awaiter(this, void 0, void 0, function () {
                var _a, editControls, disabled, labelField, onOpenDialog, editApi, env, source, data, model, optionLabel, __, result, _b, payload, e_2, isPrevented, indexes;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _a = this.props, editControls = _a.editControls, disabled = _a.disabled, labelField = _a.labelField, onOpenDialog = _a.onOpenDialog, editApi = _a.editApi, env = _a.env, source = _a.source, data = _a.data, model = _a.formItem, optionLabel = _a.optionLabel, __ = _a.translate;
                            if (disabled || !model) {
                                return [2 /*return*/];
                            }
                            if (!skipForm && (!Array.isArray(editControls) || !editControls.length)) {
                                editControls = [
                                    {
                                        type: 'text',
                                        name: labelField || 'label',
                                        label: false,
                                        placeholder: __('Options.addPlaceholder')
                                    }
                                ];
                            }
                            if (!skipForm) return [3 /*break*/, 1];
                            _b = value;
                            return [3 /*break*/, 3];
                        case 1: return [4 /*yield*/, onOpenDialog({
                                type: 'dialog',
                                title: __('Options.editLabel', {
                                    label: optionLabel || __('Options.label')
                                }),
                                body: {
                                    type: 'form',
                                    api: editApi,
                                    controls: editControls
                                }
                            }, createObject(data, value))];
                        case 2:
                            _b = _c.sent();
                            _c.label = 3;
                        case 3:
                            result = _b;
                            if (!(skipForm && editApi)) return [3 /*break*/, 7];
                            _c.label = 4;
                        case 4:
                            _c.trys.push([4, 6, , 7]);
                            return [4 /*yield*/, env.fetcher(editApi, createObject(data, result), {
                                    method: 'post'
                                })];
                        case 5:
                            payload = _c.sent();
                            if (!payload.ok) {
                                env.notify('error', payload.msg || __('saveFailed'));
                                result = null;
                            }
                            else {
                                result = payload.data || result;
                            }
                            return [3 /*break*/, 7];
                        case 6:
                            e_2 = _c.sent();
                            result = null;
                            console.error(e_2);
                            env.notify('error', e_2.message);
                            return [3 /*break*/, 7];
                        case 7:
                            // ?????????????????????????????????
                            if (!result) {
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, this.dispatchOptionEvent('edit', result)];
                        case 8:
                            isPrevented = _c.sent();
                            if (isPrevented) {
                                return [2 /*return*/];
                            }
                            if (source && editApi) {
                                this.reload();
                            }
                            else {
                                indexes = findTreeIndex(model.options, function (item) { return item === origin; });
                                if (indexes) {
                                    model.setOptions(spliceTree(model.options, indexes, 1, __assign(__assign({}, origin), result)), this.changeOptionValue, data);
                                }
                            }
                            return [2 /*return*/];
                    }
                });
            });
        };
        FormOptionsItem.prototype.handleOptionDelete = function (value) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, deleteConfirmText, disabled, data, deleteApi, env, model, source, valueField, __, ctx, confirmed, _b, isPrevented, result, options, indexes, e_3;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _a = this.props, deleteConfirmText = _a.deleteConfirmText, disabled = _a.disabled, data = _a.data, deleteApi = _a.deleteApi, env = _a.env, model = _a.formItem, source = _a.source, valueField = _a.valueField, __ = _a.translate;
                            if (disabled || !model) {
                                return [2 /*return*/];
                            }
                            ctx = createObject(data, value);
                            if (!deleteConfirmText) return [3 /*break*/, 2];
                            return [4 /*yield*/, env.confirm(filter(__(deleteConfirmText), ctx))];
                        case 1:
                            _b = _c.sent();
                            return [3 /*break*/, 3];
                        case 2:
                            _b = true;
                            _c.label = 3;
                        case 3:
                            confirmed = _b;
                            if (!confirmed) {
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, this.dispatchOptionEvent('delete', ctx)];
                        case 4:
                            isPrevented = _c.sent();
                            if (isPrevented) {
                                return [2 /*return*/];
                            }
                            _c.label = 5;
                        case 5:
                            _c.trys.push([5, 7, , 8]);
                            if (!deleteApi) {
                                throw new Error(__('Options.deleteAPI'));
                            }
                            return [4 /*yield*/, env.fetcher(deleteApi, ctx, {
                                    method: 'delete'
                                })];
                        case 6:
                            result = _c.sent();
                            if (!result.ok) {
                                env.notify('error', result.msg || __('deleteFailed'));
                            }
                            else if (source) {
                                this.reload();
                            }
                            else {
                                options = model.options.concat();
                                indexes = findTreeIndex(options, function (item) { return item[valueField || 'value'] == value[valueField || 'value']; });
                                if (indexes) {
                                    model.setOptions(spliceTree(options, indexes, 1), this.changeOptionValue, data);
                                }
                            }
                            return [3 /*break*/, 8];
                        case 7:
                            e_3 = _c.sent();
                            console.error(e_3);
                            env.notify('error', e_3.message);
                            return [3 /*break*/, 8];
                        case 8: return [2 /*return*/];
                    }
                });
            });
        };
        FormOptionsItem.prototype.render = function () {
            var _a = this.props, value = _a.value, formItem = _a.formItem, addApi = _a.addApi, editApi = _a.editApi, deleteApi = _a.deleteApi, creatable = _a.creatable, editable = _a.editable, removable = _a.removable, enableNodePath = _a.enableNodePath, pathSeparator = _a.pathSeparator, _b = _a.delimiter, delimiter = _b === void 0 ? ',' : _b, _c = _a.labelField, labelField = _c === void 0 ? 'label' : _c, _d = _a.valueField, valueField = _d === void 0 ? 'value' : _d;
            var _e = normalizeNodePath(value, enableNodePath, labelField, valueField, pathSeparator, delimiter), nodePathArray = _e.nodePathArray, nodeValueArray = _e.nodeValueArray;
            return (React.createElement(Control, __assign({}, this.props, { ref: this.inputRef, options: formItem ? formItem.filteredOptions : [], onToggle: this.handleToggle, onToggleAll: this.handleToggleAll, selectedOptions: formItem
                    ? formItem.getSelectedOptions(value, enableNodePath ? nodeValueArray : undefined)
                    : [], nodePath: nodePathArray, loading: formItem ? formItem.loading : false, setLoading: this.setLoading, setOptions: this.setOptions, syncOptions: this.syncOptions, reloadOptions: this.reload, deferLoad: this.deferLoad, leftDeferLoad: this.leftDeferLoad, expandTreeOptions: this.expandTreeOptions, creatable: creatable !== false && isEffectiveApi(addApi) ? true : creatable, editable: editable || (editable !== false && isEffectiveApi(editApi)), removable: removable || (removable !== false && isEffectiveApi(deleteApi)), onAdd: this.handleOptionAdd, onEdit: this.handleOptionEdit, onDelete: this.handleOptionDelete })));
        };
        FormOptionsItem.displayName = "OptionsControl(".concat(config.type, ")");
        FormOptionsItem.defaultProps = __assign({ delimiter: ',', labelField: 'label', valueField: 'value', joinValues: true, extractValue: false, multiple: false, placeholder: 'Select.placeholder', resetValue: '', deleteConfirmText: 'deleteConfirm' }, Control.defaultProps);
        FormOptionsItem.propsList = Control.propsList
            ? __spreadArray([], Control.propsList, true) : [];
        FormOptionsItem.ComposedComponent = Control;
        __decorate([
            autobind,
            __metadata("design:type", Function),
            __metadata("design:paramtypes", [Object]),
            __metadata("design:returntype", void 0)
        ], FormOptionsItem.prototype, "inputRef", null);
        __decorate([
            autobind,
            __metadata("design:type", Function),
            __metadata("design:paramtypes", [Object, Boolean, Boolean]),
            __metadata("design:returntype", Promise)
        ], FormOptionsItem.prototype, "handleToggle", null);
        __decorate([
            autobind,
            __metadata("design:type", Function),
            __metadata("design:paramtypes", []),
            __metadata("design:returntype", Promise)
        ], FormOptionsItem.prototype, "handleToggleAll", null);
        __decorate([
            autobind,
            __metadata("design:type", Function),
            __metadata("design:paramtypes", []),
            __metadata("design:returntype", void 0)
        ], FormOptionsItem.prototype, "reload", null);
        __decorate([
            autobind,
            __metadata("design:type", Function),
            __metadata("design:paramtypes", [Boolean, Object]),
            __metadata("design:returntype", void 0)
        ], FormOptionsItem.prototype, "reloadOptions", null);
        __decorate([
            autobind,
            __metadata("design:type", Function),
            __metadata("design:paramtypes", [Object]),
            __metadata("design:returntype", Promise)
        ], FormOptionsItem.prototype, "deferLoad", null);
        __decorate([
            autobind,
            __metadata("design:type", Function),
            __metadata("design:paramtypes", [Object, Object]),
            __metadata("design:returntype", void 0)
        ], FormOptionsItem.prototype, "leftDeferLoad", null);
        __decorate([
            autobind,
            __metadata("design:type", Function),
            __metadata("design:paramtypes", [Array]),
            __metadata("design:returntype", void 0)
        ], FormOptionsItem.prototype, "expandTreeOptions", null);
        __decorate([
            autobind,
            __metadata("design:type", Function),
            __metadata("design:paramtypes", [Object]),
            __metadata("design:returntype", Promise)
        ], FormOptionsItem.prototype, "initOptions", null);
        __decorate([
            autobind,
            __metadata("design:type", Function),
            __metadata("design:paramtypes", [Object]),
            __metadata("design:returntype", void 0)
        ], FormOptionsItem.prototype, "changeOptionValue", null);
        __decorate([
            autobind,
            __metadata("design:type", Function),
            __metadata("design:paramtypes", [Array, Object]),
            __metadata("design:returntype", void 0)
        ], FormOptionsItem.prototype, "setOptions", null);
        __decorate([
            autobind,
            __metadata("design:type", Function),
            __metadata("design:paramtypes", []),
            __metadata("design:returntype", void 0)
        ], FormOptionsItem.prototype, "syncOptions", null);
        __decorate([
            autobind,
            __metadata("design:type", Function),
            __metadata("design:paramtypes", [Boolean]),
            __metadata("design:returntype", void 0)
        ], FormOptionsItem.prototype, "setLoading", null);
        __decorate([
            autobind,
            __metadata("design:type", Function),
            __metadata("design:paramtypes", [Object, Object, Boolean]),
            __metadata("design:returntype", Promise)
        ], FormOptionsItem.prototype, "handleOptionAdd", null);
        __decorate([
            autobind,
            __metadata("design:type", Function),
            __metadata("design:paramtypes", [Object, Object, Boolean]),
            __metadata("design:returntype", Promise)
        ], FormOptionsItem.prototype, "handleOptionEdit", null);
        __decorate([
            autobind,
            __metadata("design:type", Function),
            __metadata("design:paramtypes", [Object]),
            __metadata("design:returntype", Promise)
        ], FormOptionsItem.prototype, "handleOptionDelete", null);
        return FormOptionsItem;
    }(React.Component));
    return registerFormItem(__assign(__assign({}, config), { strictMode: false, component: FormOptionsItem }));
}
function OptionsControl(config) {
    return function (component) {
        var renderer = registerOptionsControl(__assign(__assign({}, config), { component: component }));
        return renderer.component;
    };
}

export { OptionsControl, detectProps, registerOptionsControl };
