/**
 * Fetch Hook - 监控所有Fetch API请求
 * 使用方法：在浏览器控制台中执行此脚本
 */

(function() {
  'use strict';

  const originalFetch = window.fetch;
  const fetchLog = [];

  window.fetch = async function(input, init = {}) {
    const startTime = Date.now();
    const url = typeof input === 'string' ? input : input.url;
    const method = init.method || 'GET';

    const logEntry = {
      url: url,
      method: method,
      headers: init.headers || {},
      body: init.body,
      startTime: startTime
    };

    try {
      const response = await originalFetch.apply(this, arguments);
      const endTime = Date.now();

      logEntry.endTime = endTime;
      logEntry.duration = endTime - startTime;
      logEntry.status = response.status;
      logEntry.statusText = response.statusText;

      // 克隆响应以便读取body
      const clonedResponse = response.clone();

      // 过滤静态资源
      if (!url.match(/\.(js|css|png|jpg|gif|svg|woff|ttf|ico)(\?|$)/)) {
        console.group(`[Fetch] ${method} ${url}`);
        console.log('状态:', response.status, response.statusText);
        console.log('耗时:', logEntry.duration + 'ms');

        if (init.headers) {
          console.log('请求头:', init.headers);
        }
        if (init.body) {
          console.log('请求体:', init.body);
        }

        // 尝试读取响应
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const json = await clonedResponse.json();
            console.log('响应:', json);
            logEntry.response = json;
          } else {
            const text = await clonedResponse.text();
            console.log('响应:', text.substring(0, 500));
            logEntry.response = text.substring(0, 1000);
          }
        } catch (e) {
          console.log('响应解析失败');
        }

        console.groupEnd();
        fetchLog.push(logEntry);
      }

      return response;
    } catch (error) {
      logEntry.error = error.message;
      console.error(`[Fetch Error] ${method} ${url}:`, error);
      fetchLog.push(logEntry);
      throw error;
    }
  };

  // 导出函数
  window.getFetchLog = function() {
    return fetchLog;
  };

  window.clearFetchLog = function() {
    fetchLog.length = 0;
    console.log('Fetch日志已清除');
  };

  console.log('[Fetch Hook] 已启用，使用 getFetchLog() 查看日志，clearFetchLog() 清除日志');
})();
