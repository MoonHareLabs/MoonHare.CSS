import { defaultColors } from '../../config/base';
import { Property, Style } from '../../utils/style';
import { toColor } from '../../utils/color';
import { cssEscape } from '../../utils/algorithm';
import { isNumber, isFraction, isSize, roundUp, fracToPercent, hex2RGB, negateValue, flatColors, splitColorGroup, } from '../../utils/tools';

export function handle() {
    if (body[0] == '[') {
        if (body.slice[-1] == ']')
            return props.map(prop => `${prop}:${body.slice(1, -1).replace(/_/g, ' ')};`).join('')
    }
    else if (body[0] == '$') {
        return props.map(prop => `${prop}:var(--${body.slice(1)});`).join('')
    }
    value = this.config[id][
}

export function createHandler(handlers = { static: true }) {
    return (utility, value, color) => {
        const handler = {
            utility,
            value,
            color,
            _amount: utility.amount,
            handleStatic: handlers.static ? (map, callback) => {
                if (handler.value)
                    return handler;
                if (map && typeof map === 'object') {
                    if (map.DEFAULT)
                        map[handler.utility.raw] = map.DEFAULT;
                    if (handler._amount in map)
                        handler.value = callback
                            ? callback(handler._amount)
                            : `${map[handler._amount]}`;
                }
                return handler;
            } : () => handler,
            handleBody: handlers.static ? (map, callback) => {
                if (handler.value)
                    return handler;
                if (map && typeof map === 'object') {
                    const body = handler.utility.body;
                    if (body in map)
                        handler.value = callback ? callback(body) : `${map[body]}`;
                }
                return handler;
            } : () => handler,
            handleNumber: handlers.number ? (start = -Infinity, end = Infinity, type = 'int', callback) => {
                if (handler.value)
                    return handler;
                if (isNumber(handler._amount, start, end, type))
                    handler.value = callback ? callback(+handler._amount) : handler._amount;
                return handler;
            } : () => handler,
            handleTime: handlers.time ? (start = -Infinity, end = Infinity, type = 'int', callback) => {
                if (handler.value)
                    return handler;
                let unit = 'ms';
                let amount = handler._amount;
                if (amount.endsWith('ms')) {
                    amount = amount.slice(0, -2);
                }
                else if (amount.endsWith('s')) {
                    unit = 's';
                    amount = amount.slice(0, -1);
                }
                else {
                    return handler;
                }
                if (isNumber(amount, start, end, type))
                    handler.value = callback ? callback(unit === 's' ? +amount * 1000 : +amount) : handler._amount;
                return handler;
            } : () => handler,
            handleString: handlers.string ? (callback) => {
                if (handler.value)
                    return handler;
                handler.value = callback(handler.utility.body);
                return handler;
            } : () => handler,
            handleSquareBrackets: handlers.bracket ? (callback) => {
                if (handler.value)
                    return handler;
                if (handler._amount[0] === '[' && handler._amount[handler._amount.length - 1] === ']') {
                    const value = handler._amount.slice(1, -1).replace(/_/g, ' '); // replace _ to space
                    handler.value = callback
                        ? callback(value)
                        : value;
                }
                return handler;
            } : () => handler,
            handleSpacing: handlers.number ? () => {
                // just a short-hand for handle spacing.
                return handler.handleNumber(0, undefined, 'float', (number) => number === 0 ? '0px' : `${roundUp(number / 4, 6)}rem`);
            } : () => handler,
            handleNxl: handlers.nxl ? (callback) => {
                if (handler.value)
                    return handler;
                if (/^\d*xl$/.test(handler._amount))
                    handler.value = callback
                        ? callback(handler._amount === 'xl' ? 1 : parseInt(handler._amount))
                        : parseInt(handler._amount).toString();
                return handler;
            } : () => handler,
            handleFraction: handlers.fraction ? (callback) => {
                if (handler.value)
                    return handler;
                if (isFraction(handler._amount))
                    handler.value = callback
                        ? callback(handler._amount)
                        : fracToPercent(handler._amount);
                return handler;
            } : () => handler,
            handleSize: handlers.size ? (callback) => {
                if (handler.value)
                    return handler;
                if (isSize(handler._amount))
                    handler.value = callback ? callback(handler._amount) : handler._amount;
                return handler;
            } : () => handler,
            handleVariable: handlers.variable ? (callback) => {
                if (handler.value)
                    return handler;
                const matchVariable = handler.utility.raw.match(/-\$[\w-]+/);
                if (matchVariable) {
                    const variableName = matchVariable[0].substring(2);
                    handler.value = callback ? callback(variableName) : `var(--${variableName})`;
                }
                return handler;
            } : () => handler,
            handleColor: handlers.color ? (map = defaultColors) => {
                if (handler.value)
                    return handler;
                let color;
                if (map && typeof map === 'object') {
                    const colors = flatColors(map);
                    const body = handler.utility.raw.replace(/^ring-offset|outline-solid|outline-dotted/, 'head').replace(/^\w+-/, '');
                    const [key, opacity] = splitColorGroup(body);
                    handler.opacity = opacity;
                    if (key in colors) {
                        color = colors[key];
                    }
                    else if (handlers.hex && key.startsWith('hex-')) {
                        const hex = key.slice(4);
                        if (hex2RGB(hex))
                            color = '#' + hex;
                    }
                    if (typeof color === 'string') {
                        handler.value = color;
                    }
                    else if (typeof color === 'function') {
                        handler.color = color;
                    }
                }
                return handler;
            } : () => handler,
            handleOpacity: handlers.opacity ? (map) => {
                if (handler.opacity && typeof map === 'object') {
                    const _map = map;
                    if (handlers.static && handler.opacity in _map) {
                        handler.opacity = _map[handler.opacity];
                    }
                    else if (handlers.number && isNumber(handler.opacity, 0, 100, 'int')) {
                        handler.opacity = (+handler.opacity / 100).toString();
                    }
                    else if (handlers.variable && handler.opacity.charAt(0) === '$') {
                        handler.opacity = `var(--${handler.opacity.slice(1)})`;
                    }
                    else if (handlers.bracket && handler.opacity.charAt(0) === '[' && handler.opacity.charAt(handler.opacity.length - 1) === ']') {
                        handler.opacity = handler.opacity.slice(1, -1).replace(/_/g, ' ');
                    }
                    else {
                        handler.opacity = undefined;
                    }
                }
                return handler;
            } : () => handler,
            handleNegative: handlers.negative ? (callback = negateValue) => {
                if (!handler.value)
                    return handler;
                handler.value = handler.utility.isNegative ? callback(handler.value) : handler.value;
                return handler;
            } : () => handler,
            createProperty: (name, callback) => {
                if (!handler.value)
                    return;
                const value = callback ? callback(handler.value) : handler.value;
                return new Property(name, value);
            },
            createStyle: (selector, callback) => {
                if (!handler.value)
                    return;
                const value = callback ? callback(handler.value) : undefined;
                return new Style(selector, value);
            },
            createColorValue: (opacityValue) => {
                if (handler.color)
                    return handler.color({ opacityValue });
                if (handler.value) {
                    if (['transparent', 'currentColor', 'auto', 'none'].includes(handler.value))
                        return handler.value;
                    if (handler.value.includes('var') && opacityValue)
                        return `rgba(${handler.value}, ${handler.opacity || opacityValue})`;
                    return opacityValue ? `rgba(${toColor(handler.value).color}, ${handler.opacity || opacityValue})` : `rgb(${toColor(handler.value).color})`;
                }
            },
            createColorStyle: (selector, property, opacityVariable, wrapRGB = true) => {
                if (handler.color) {
                    const value = handler.color({ opacityVariable, opacityValue: opacityVariable ? `var(${opacityVariable})` : undefined });
                    if (opacityVariable) {
                        return new Style(selector, [
                            new Property(opacityVariable, handler.opacity || '1'),
                            new Property(property, value),
                        ]);
                    }
                    return new Style(selector, new Property(property, value));
                }
                const color = handler.value;
                if (!color)
                    return;
                if (['transparent', 'currentColor', 'auto', 'none'].includes(color) || color.includes('var'))
                    return new Style(selector, new Property(property, color));
                const rgb = toColor(color);
                if (opacityVariable) {
                    return new Style(selector, [
                        new Property(opacityVariable, handler.opacity || rgb.opacity),
                        new Property(property, `rgba(${rgb.color}, var(${opacityVariable}))`),
                    ]);
                }
                return new Style(selector, new Property(property, wrapRGB ? `rgb(${rgb.color})` : rgb.color));
            },
            callback: (func) => {
                if (!handler.value)
                    return;
                return func(handler.value);
            },
        };
        return handler;
    };
}
export class Utility {
    constructor(raw, _h) {
        this.raw = raw; // -placeholder-real-gray-300
        this._h = _h;
    }
    match(expression) {
        const match = this.absolute.match(expression);
        return match ? match[0] : '';
    }
    clone(raw) {
        return new Utility(raw || this.raw, this._h);
    }
    get class() {
        return '.' + cssEscape(this.raw); // .-placeholder-real-gray-300
    }
    get isNegative() {
        return this.raw[0] === '-'; // true
    }
    get absolute() {
        return this.isNegative ? this.raw.substring(1) : this.raw;
    }
    get identifier() {
        return this.match(/[^-]+/); // placeholder
    }
    get key() {
        return this.match(/^\w[-\w]+(?=-)/); // placeholder-real-gray
    }
    get center() {
        return this.match(/-.+(?=-)/).substring(1); // real-gray
    }
    get amount() {
        return this.match(/(?:[^-]+|\[[\s\S]*?\])$/); // 300
    }
    get body() {
        return this.match(/-.+/).substring(1); // real-gray-300
    }
    get handler() {
        return this._h(this);
    }
}
