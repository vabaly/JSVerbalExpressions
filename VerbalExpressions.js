/**
 * @file VerbalExpressions JavaScript Library
 * @version 0.3.0
 * @license MIT
 *
 * @see https://github.com/VerbalExpressions/JSVerbalExpressions
 */

/**
 * Define the VerbalExpression class
 *
 * @class VerbalExpression
 * @extends {RegExp}
 */
class VerbalExpression extends RegExp {
    /**
     * Creates an instance of VerbalExpression.
     * @constructor
     * @alias VerEx
     * @memberof VerbalExpression
     */
    constructor() {
        // Call the `RegExp` constructor so that `this` can be used
        // 笔记： 1. 其实就是 `RegExp('', 'gm')`，即创建一个全局、多行匹配的空正则表达式 `/(?:)/gm`
        //         在这里，`this` 就等于了 `/(?:)/gm`
        super('', 'gm');

        // Variables to hold the expression construction in order
        // 笔记： 2. `this` 本身是没有下述属性的，这是为了方便记录数据而设定的 “私有属性”
        this._prefixes = '';
        this._source = '';
        this._suffixes = '';
        this._modifiers = 'gm'; // 'global, multiline' matching by default
    }

    // Utility //

    /**
     * Escape meta-characters in the parameter and make it safe for adding to the expression
     * @static
     * @param {(string|RegExp|number)} value object to sanitize
     * @returns {string} sanitized value
     * @memberof VerbalExpression
     */
    static sanitize(value) {
        if (value instanceof RegExp) {
            return value.source;
        }

        if (typeof value === 'number') {
            return value;
        }

        if (typeof value !== 'string') {
            return '';
        }

        // Regular expression to match meta characters
        // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/regexp
        // 笔记： 目前看，好像 `/[\].|*?+(){}^$\\:=[]/g` 也能匹配文本中出现的各种元字符
        const toEscape = /([\].|*?+(){}^$\\:=[])/g;

        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/lastMatch
        const lastMatch = '$&';

        // Escape meta characters
        // 笔记： https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String/replace
        // replace 方法的第二个参数是字符串，这个字符串中可以包含一些以 `$` 开头的特殊字符串，
        // 代表着不同含义的变量，像上面的 `$&` 就表示在 `value` 中单次匹配到字符串
        return value.replace(toEscape, `\\${lastMatch}`);
    }

    /**
     * Add stuff to the expression and compile the new expression so it's ready to be used.
     * @param {(string|number)} [value=''] stuff to add
     * @returns {VerbalExpression} recompiled instance of VerbalExpression
     * @memberof VerbalExpression
     */
    add(value = '') {
        this._source += value;
        // 笔记： 在这种库中，一个正则表达式由 开头、中间值、结尾组成
        const pattern = this._prefixes + this._source + this._suffixes;
        // 笔记： this.compile 是 Regexp 的 compile 方法，效果和 new RegExp(pattern, this._modifier) 类似
        // 但是 `.compile` 方法会改变原正则表达式，不过，其为非 ES 标准的方法，在 Android React Native 中就没法用
        this.compile(pattern, this._modifiers);
        // 笔记： 这个库的方法都是返回 this，也就扩展后的正则表达式对象本身
        return this;
    }

    // Rules //

    /**
     * Control start-of-line matching
     * @param {boolean} [enable=true] whether to enable this behaviour
     * @returns {VerbalExpression} recompiled instance of VerbalExpression
     * @memberof VerbalExpression
     */
    startOfLine(enable = true) {
        this._prefixes = enable ? '^' : '';
        return this.add();
    }

    /**
     * Control end-of-line matching
     * @param {boolean} [enable=true] whether to enable this behaviour
     * @returns {VerbalExpression} recompiled instance of VerbalExpression
     * @memberof VerbalExpression
     */
    endOfLine(enable = true) {
        this._suffixes = enable ? '$' : '';
        return this.add();
    }

    /**
     * Look for the value passed
     * @param {(string|RegExp|number)} value value to find
     * @returns {VerbalExpression} recompiled instance of VerbalExpression
     * @memberof VerbalExpression
     */
    then(value) {
        //
        value = VerbalExpression.sanitize(value);
        // 这种方法把 value 加在末尾，并以未捕获分组的形式存在，
        // 这样一来的话，当再在后面加上 `*`、`+` 时，就能重复匹配，但又不会存储匹配组，提升效率
        return this.add(`(?:${value})`);
    }

    /**
     * Alias for then() to allow for readable syntax when then() is the first method in the chain.
     * @param {(string|RegExp|numer)} value value to find
     * @returns {VerbalExpression} recompiled instance of VerbalExpression
     * @memberof VerbalExpression
     */
    find(value) {
        return this.then(value);
    }

    /**
     * Add optional values
     * @param {(string|RegExp|number)} value value to find
     * @returns {VerbalExpression} recompiled instance of VerbalExpression
     * @memberof VerbalExpression
     */
    maybe(value) {
        value = VerbalExpression.sanitize(value);
        return this.add(`(?:${value})?`);
    }

    /**
     * Add alternative expressions
     * @param {(string|RegExp|number)} value value to find
     * @returns {VerbalExpression} recompiled instance of VerbalExpression
     * @memberof VerbalExpression
     */
    or(value) {
        this._prefixes += '(?:';
        this._suffixes = `)${this._suffixes}`;

        this.add(')|(?:');

        if (value) {
            this.then(value);
        }

        return this;
    }

    /**
     * Any character any number of times
     * @returns {VerbalExpression} recompiled instance of VerbalExpression
     * @memberof VerbalExpression
     */
    anything() {
        return this.add('(?:.*)');
    }

    /**
     * Anything but these characters
     * @param {(string|number|string[]|number[])} value characters to not match
     * @returns {VerbalExpression} recompiled instance of VerbalExpression
     * @memberof VerbalExpression
     */
    anythingBut(value) {
        if (Array.isArray(value)) {
            value = value.join('');
        }

        value = VerbalExpression.sanitize(value);
        return this.add(`(?:[^${value}]*)`);
    }

    /**
     * Any character(s) at least once
     * @returns {VerbalExpression} recompiled instance of VerbalExpression
     * @memberof VerbalExpression
     */
    something() {
        return this.add('(?:.+)');
    }

    /**
     * Any character at least one time except for these characters
     * @param {(string|number|string[]|number[])} value characters to not match
     * @returns {VerbalExpression} recompiled instance of VerbalExpression
     * @memberof VerbalExpression
     */
    somethingBut(value) {
        if (Array.isArray(value)) {
            value = value.join('');
        }

        value = VerbalExpression.sanitize(value);
        return this.add(`(?:[^${value}]+)`);
    }

    /**
     * Match any of the given characters
     * @param {(string|number|string[]|number[])} value characters to match
     * @returns {VerbalExpression} recompiled instance of VerbalExpression
     * @memberof VerbalExpression
     */
    anyOf(value) {
        if (Array.isArray(value)) {
            value = value.join('');
        }

        value = VerbalExpression.sanitize(value);
        return this.add(`[${value}]`);
    }

    /**
     * Shorthand for anyOf(value)
     * @param {string|number} value value to find
     * @returns {VerbalExpression} recompiled instance of VerbalExpression
     * @memberof VerbalExpression
     */
    any(value) {
        return this.anyOf(value);
    }

    /**
     * Ensure that the parameter does not follow
     * @param {string|number} value
     * @returns {VerbalExpression} recompiled instance of VerbalExpression
     * @memberof VerbalExpression
     */
    not(value) {
        value = VerbalExpression.sanitize(value);
        this.add(`(?!${value})`);

        return this;
    }

    /**
     * Matching any character within a range of characters
     * Usage: .range( from, to [, from, to ... ] )
     * @param {...string} ranges characters denoting beginning and ending of ranges
     * @returns {VerbalExpression} recompiled instance of VerbalExpression
     * @memberof VerbalExpression
     */
    range(...ranges) {
        let value = '';

        for (let i = 1; i < ranges.length; i += 2) {
            const from = VerbalExpression.sanitize(ranges[i - 1]);
            const to = VerbalExpression.sanitize(ranges[i]);

            value += `${from}-${to}`;
        }

        return this.add(`[${value}]`);
    }

    // Special characters //

    /**
     * Match a Line break
     * @returns {VerbalExpression} recompiled instance of VerbalExpression
     * @memberof VerbalExpression
     */
    lineBreak() {
        return this.add('(?:\\r\\n|\\r|\\n)'); // Unix(LF) + Windows(CRLF)
    }

    /**
     * A shorthand for lineBreak() for html-minded users
     * @returns {VerbalExpression} recompiled instance of VerbalExpression
     * @memberof VerbalExpression
     */
    br() {
        return this.lineBreak();
    }

    /**
     * Match a tab character
     * @returns {VerbalExpression} recompiled instance of VerbalExpression
     * @memberof VerbalExpression
     */
    tab() {
        return this.add('\\t');
    }

    /**
     * Match any alphanumeric
     * @returns {VerbalExpression} recompiled instance of VerbalExpression
     * @memberof VerbalExpression
     */
    word() {
        return this.add('\\w+');
    }

    /**
     * Match a single digit
     * @returns {VerbalExpression} recompiled instance of VerbalExpression
     * @memberof VerbalExpression
     */
    digit() {
        return this.add('\\d');
    }

    /**
     * Match a single whitespace
     * @returns {VerbalExpression} recompiled instance of VerbalExpression
     * @memberof VerbalExpression
     */
    whitespace() {
        return this.add('\\s');
    }

    // Modifiers //

    /**
     * Add a regex modifier/flag
     * @param {string} modifier modifier to add
     * @returns {VerbalExpression} recompiled instance of VerbalExpression
     * @memberof VerbalExpression
     */
    addModifier(modifier) {
        if (!this._modifiers.includes(modifier)) {
            this._modifiers += modifier;
        }

        return this.add();
    }

    /**
     * Remove modifier
     * @param {string} modifier modifier to remove
     * @returns {VerbalExpression} recompiled instance of VerbalExpression
     * @memberof VerbalExpression
     */
    removeModifier(modifier) {
        this._modifiers = this._modifiers.replace(modifier, '');
        return this.add();
    }

    /**
     * Control case-insensitive matching
     * @param {boolean} [enable=true] whether to enable this behaviour
     * @returns {VerbalExpression} recompiled instance of VerbalExpression
     * @memberof VerbalExpression
     */
    withAnyCase(enable = true) {
        return enable ? this.addModifier('i') : this.removeModifier('i');
    }

    /**
     * Default behaviour is with "g" modifier, so we can turn this another way around than other modifiers
     * @param {boolean} [enable=true] whether to enable this behaviour
     * @returns {VerbalExpression} recompiled instance of VerbalExpression
     * @memberof VerbalExpression
     */
    stopAtFirst(enable = true) {
        return enable ? this.removeModifier('g') : this.addModifier('g');
    }

    /**
     * Control the multiline modifier
     * @param {boolean} [enable=true] whether to enable this behaviour
     * @returns {VerbalExpression} recompiled instance of VerbalExpression
     * @memberof VerbalExpression
     */
    searchOneLine(enable = true) {
        return enable ? this.removeModifier('m') : this.addModifier('m');
    }

    // Loops //

    /**
     * Repeat the previous item exactly n times or between n and m times
     * @returns {VerbalExpression} recompiled instance of VerbalExpression
     * @memberof VerbalExpression
     */
    repeatPrevious(...quantity) {
        const isInteger = /\d+/;
        const values = quantity.filter((argument) => isInteger.test(argument));

        if (values.length === 0 || values.length > 2) {
            return this;
        }

        this.add(`{${values.join(',')}}`);

        return this;
    }

    /**
     * Repeat the previous at least once
     * @returns {VerbalExpression} recompiled instance of VerbalExpression
     * @memberof VerbalExpression
     */
    oneOrMore() {
        return this.add('+');
    }

    /**
     * Match the value zero or more times
     * @param {string} value value to find
     * @param {integer} [lower] minimum number of times the value should be repeated
     * @param {integer} [upper] maximum number of times the value should be repeated
     * @returns {VerbalExpression} recompiled instance of VerbalExpression
     * @memberof VerbalExpression
     */
    multiple(value, lower, upper) {
        if (value !== undefined) {
            value = VerbalExpression.sanitize(value);
            this.add(`(?:${value})`);
        }

        if (lower === undefined && upper === undefined) {
            this.add('*'); // Any number of times
        } else if (lower !== undefined && upper === undefined) {
            this.add(`{${lower},}`);
        } else if (lower !== undefined && upper !== undefined) {
            this.add(`{${lower},${upper}}`);
        }

        return this;
    }

    // Capture groups //

    /**
     * Starts a capturing group
     * @returns {VerbalExpression} recompiled instance of VerbalExpression
     * @memberof VerbalExpression
     */
    beginCapture() {
        // Add the end of the capture group to the suffixes temporarily so that compilation continues to work
        this._suffixes += ')';
        return this.add('(');
    }

    /**
     * Ends a capturing group
     * @returns {VerbalExpression} recompiled instance of VerbalExpression
     * @memberof VerbalExpression
     */
    endCapture() {
        // Remove the last parenthesis from the _suffixes and add it to the regex
        this._suffixes = this._suffixes.slice(0, -1);
        return this.add(')');
    }

    // Miscellaneous //

    /**
     * Shorthand function for the string.replace function to allow for a more logical flow
     * @param {string} source string to search for
     * @param {string} value value to replace with
     * @returns {VerbalExpression} recompiled instance of VerbalExpression
     * @memberof VerbalExpression
     */
    replace(source, value) {
        source = source.toString();
        return source.replace(this, value);
    }

    /**
     * Convert to RegExp object
     * @returns {RegExp} equivalent RegExp instance
     * @memberof VerbalExpression
     */
    toRegExp() {
        const components = this.toString().match(/\/(.*)\/([gimuy]+)?/);
        const pattern = components[1];
        const flags = components[2];

        return new RegExp(pattern, flags);
    }
}

/**
 * Return a new instance of `VerbalExpression`
 * @export
 * @returns {VerbalExpression} new instance
 */
function VerEx() { // eslint-disable-line no-unused-vars
    const instance = new VerbalExpression();
    // 笔记：`VerbalExpression` 类上的 `sanitize` 静态方法在实例上也可以使用
    instance.sanitize = VerbalExpression.sanitize;
    return instance;
}

// 使用示例
// 笔记： 下面这行语句仅仅是创建了一个 `/(?:)/gm` 的正则表达式，不同的是它和它的原型带有一系列的方法，主要也就是这些方法在起作用
const regular = VerEx()

const stringToEscape = '(http://example.com?arg=foo+bar)';
// => '\(http:\/\/example.com\?arg\=foo\+bar\)'
// 笔记： `sanitize` 是用来将给定字符串内的元字符前面加上转义符号的，使其能够被 this.compile 方法接收
// this.compile 方法和 new RegExp 方法一样，第一个参数是字符串，且字符串内不允许含有元字符，
// 元字符要做为匹配项生效，就必须在元字符前面加上转义符号，否则会报错
console.log(regular.sanitize(stringToEscape));

// 笔记： `add` 方法用来在原基础上追加正则表达式
regular.add('(foo)?(?:bar)*');
console.log(regular); // => /(foo)?(?:bar)*/gm

// 笔记： 以下的规则旨在用一系列方法语义化的给正则表达式添砖加瓦，使其变成一个含义丰富的正则表达式
// `find` 方法是 `then` 方法的别名，比 `then` 方法更加的语义化
// `then` 方法
const expr1 = VerEx().find('apple');
console.log(expr1.test('pineapple')); // => true

const expr2 = VerEx().startOfLine().find('apple');
console.log(expr2.test('pineapple')); // => false
