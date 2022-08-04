/**
 * amis-core v2.1.0
 * Copyright 2018-2022 fex
 */

function string2regExp(value, caseSensitive) {
    if (caseSensitive === void 0) { caseSensitive = false; }
    if (typeof value !== 'string') {
        throw new TypeError('Expected a string');
    }
    return new RegExp(value.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d'), !caseSensitive ? 'i' : '');
}

export { string2regExp };
