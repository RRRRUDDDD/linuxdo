/**
 * Cookie Hook - 监控Cookie读写操作
 * 使用方法：在浏览器控制台中执行此脚本
 */

(function() {
  'use strict';

  const cookieLog = [];

  // Hook document.cookie getter
  const originalCookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie') ||
                                   Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'cookie');

  if (originalCookieDescriptor) {
    Object.defineProperty(document, 'cookie', {
      get: function() {
        const value = originalCookieDescriptor.get.call(document);
        console.log('[Cookie GET]', value.substring(0, 100) + '...');
        return value;
      },
      set: function(val) {
        console.log('[Cookie SET]', val);
        cookieLog.push({
          type: 'SET',
          value: val,
          time: new Date().toISOString(),
          stack: new Error().stack
        });
        return originalCookieDescriptor.set.call(document, val);
      },
      configurable: true
    });
  }

  // 导出函数
  window.getCookieLog = function() {
    return cookieLog;
  };

  window.parseCookies = function() {
    const cookies = {};
    document.cookie.split(';').forEach(function(cookie) {
      const parts = cookie.trim().split('=');
      if (parts.length >= 2) {
        cookies[parts[0]] = decodeURIComponent(parts.slice(1).join('='));
      }
    });
    return cookies;
  };

  console.log('[Cookie Hook] 已启用，使用 getCookieLog() 查看日志，parseCookies() 解析当前Cookie');
})();
