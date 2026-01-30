/**
 * Debugger绕过 - 禁用无限debugger反调试
 * 使用方法：在打开DevTools之前执行此脚本
 */

(function() {
  'use strict';

  // 方法1: Hook Function构造函数
  const originalFunction = Function.prototype.constructor;
  Function.prototype.constructor = function() {
    const code = arguments[arguments.length - 1];
    if (typeof code === 'string' && code.includes('debugger')) {
      console.log('[Debugger Bypass] 拦截到debugger代码');
      arguments[arguments.length - 1] = code.replace(/debugger/g, '');
    }
    return originalFunction.apply(this, arguments);
  };

  // 方法2: Hook eval
  const originalEval = window.eval;
  window.eval = function(code) {
    if (typeof code === 'string' && code.includes('debugger')) {
      console.log('[Debugger Bypass] 拦截到eval中的debugger');
      code = code.replace(/debugger/g, '');
    }
    return originalEval.call(this, code);
  };

  // 方法3: Hook setInterval/setTimeout
  const originalSetInterval = window.setInterval;
  const originalSetTimeout = window.setTimeout;

  window.setInterval = function(fn, delay) {
    if (typeof fn === 'string' && fn.includes('debugger')) {
      console.log('[Debugger Bypass] 拦截到setInterval中的debugger');
      fn = fn.replace(/debugger/g, '');
    } else if (typeof fn === 'function') {
      const fnStr = fn.toString();
      if (fnStr.includes('debugger')) {
        console.log('[Debugger Bypass] 拦截到setInterval函数中的debugger');
        return null; // 阻止执行
      }
    }
    return originalSetInterval.apply(this, arguments);
  };

  window.setTimeout = function(fn, delay) {
    if (typeof fn === 'string' && fn.includes('debugger')) {
      console.log('[Debugger Bypass] 拦截到setTimeout中的debugger');
      fn = fn.replace(/debugger/g, '');
    } else if (typeof fn === 'function') {
      const fnStr = fn.toString();
      if (fnStr.includes('debugger') && delay < 1000) {
        console.log('[Debugger Bypass] 拦截到setTimeout函数中的debugger');
        return null;
      }
    }
    return originalSetTimeout.apply(this, arguments);
  };

  console.log('[Debugger Bypass] 已启用，无限debugger将被拦截');
})();
