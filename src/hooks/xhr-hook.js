/**
 * XHR Hook - 监控所有XMLHttpRequest请求
 * 使用方法：在浏览器控制台中执行此脚本
 */

(function() {
  'use strict';

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

  // 存储请求信息
  const requestLog = [];

  XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
    this._hookData = {
      method: method,
      url: url,
      headers: {},
      startTime: null,
      endTime: null
    };
    return originalOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
    if (this._hookData) {
      this._hookData.headers[name] = value;
    }
    return originalSetRequestHeader.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function(body) {
    if (this._hookData) {
      this._hookData.body = body;
      this._hookData.startTime = Date.now();

      this.addEventListener('load', function() {
        this._hookData.endTime = Date.now();
        this._hookData.status = this.status;
        this._hookData.response = this.responseText;
        this._hookData.duration = this._hookData.endTime - this._hookData.startTime;

        // 过滤掉静态资源
        if (!this._hookData.url.match(/\.(js|css|png|jpg|gif|svg|woff|ttf)$/)) {
          console.group(`[XHR] ${this._hookData.method} ${this._hookData.url}`);
          console.log('状态:', this._hookData.status);
          console.log('耗时:', this._hookData.duration + 'ms');
          console.log('请求头:', this._hookData.headers);
          if (this._hookData.body) {
            console.log('请求体:', this._hookData.body);
          }
          try {
            console.log('响应:', JSON.parse(this._hookData.response));
          } catch (e) {
            console.log('响应:', this._hookData.response?.substring(0, 500));
          }
          console.groupEnd();

          requestLog.push(this._hookData);
        }
      });
    }
    return originalSend.apply(this, arguments);
  };

  // 导出日志查看函数
  window.getXhrLog = function() {
    return requestLog;
  };

  window.clearXhrLog = function() {
    requestLog.length = 0;
    console.log('XHR日志已清除');
  };

  console.log('[XHR Hook] 已启用，使用 getXhrLog() 查看日志，clearXhrLog() 清除日志');
})();
