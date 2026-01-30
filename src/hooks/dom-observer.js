/**
 * DOM Observer - 监控页面DOM变化
 * 用于分析Discourse的动态加载机制
 */

(function() {
  'use strict';

  const observerLog = [];
  let observer = null;

  // 创建观察器
  function createObserver(targetSelector = '#main-outlet-wrapper') {
    const target = document.querySelector(targetSelector);
    if (!target) {
      console.warn('[DOM Observer] 目标元素不存在:', targetSelector);
      return null;
    }

    observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        const entry = {
          type: mutation.type,
          target: mutation.target.nodeName + (mutation.target.id ? '#' + mutation.target.id : ''),
          time: new Date().toISOString()
        };

        if (mutation.type === 'childList') {
          entry.addedNodes = mutation.addedNodes.length;
          entry.removedNodes = mutation.removedNodes.length;

          // 记录新增的重要元素
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) { // Element node
              if (node.id && node.id.startsWith('post_')) {
                console.log('[DOM Observer] 新帖子加载:', node.id);
              }
              if (node.classList && node.classList.contains('topic-list-item')) {
                console.log('[DOM Observer] 新话题项加载');
              }
            }
          });
        }

        if (mutation.type === 'attributes') {
          entry.attributeName = mutation.attributeName;
          entry.oldValue = mutation.oldValue;
        }

        observerLog.push(entry);

        // 限制日志大小
        if (observerLog.length > 1000) {
          observerLog.shift();
        }
      });
    });

    observer.observe(target, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true
    });

    console.log('[DOM Observer] 开始观察:', targetSelector);
    return observer;
  }

  // 导出函数
  window.startDomObserver = function(selector) {
    if (observer) {
      observer.disconnect();
    }
    return createObserver(selector);
  };

  window.stopDomObserver = function() {
    if (observer) {
      observer.disconnect();
      observer = null;
      console.log('[DOM Observer] 已停止');
    }
  };

  window.getDomLog = function() {
    return observerLog;
  };

  window.clearDomLog = function() {
    observerLog.length = 0;
    console.log('[DOM Observer] 日志已清除');
  };

  // 自动启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      createObserver();
    });
  } else {
    createObserver();
  }

  console.log('[DOM Observer] 已加载，使用 startDomObserver(selector) 开始观察');
})();
