"use strict";

import "./popup.css";

(function () {
  let activeOppId = null;
  let activeTabId = null;
  function init() {
    chrome.runtime.sendMessage({ type: "geSurveyData" }, (response) => {
      activeOppId = response.value.oppId;
      activeTabId = response.value.tabId;
      if (response.value.oppId) {
        document.querySelector(".questionnaire > .number > span").textContent =
          response.value.oppId;
        document.querySelector(".questionnaire > .value > span").textContent =
          response.value.money;
        document.querySelector(".questionnaire > .time > span").textContent =
          response.value.time + "分钟";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);

  const openButton = document.querySelector(".openButton");
  const disabledButton = document.querySelector(".disabledButton");
  const availableButton = document.querySelector(".availableButton");
  const refreshButton = document.querySelector(".refreshButton");
  const oppOrderButton = document.querySelector(".oppOrderButton");

  openButton.addEventListener("click", async () => {
    const result = await chrome.storage.session.get(["iframeUrl"]);
    if (result.iframeUrl) {
      window.open(result.iframeUrl);
    } else {
      renderMessage(1, "页面未初始化完成!");
    }
  });

  disabledButton.addEventListener("click", async () => {
    let result = await chrome.storage.session.get("rootTabId");
    if (result["rootTabId"]) {
      chrome.tabs.sendMessage(+result["rootTabId"], {
        menuItemId: "disabled",
        type: "updateTabs",
        activeOppId,
      });
    }
  });
  availableButton.addEventListener("click", async () => {
    let result = await chrome.storage.session.get("rootTabId");
    if (result["rootTabId"]) {
      chrome.tabs.sendMessage(+result["rootTabId"], {
        menuItemId: "available",
        type: "updateTabs",
        activeOppId,
      });
    }
  });

  oppOrderButton.addEventListener("click", (ev) => {
    if (oppOrderButton.textContent != "未知") {
      navigator.clipboard.writeText(oppOrderButton.textContent);
      renderMessage();
    }
  });

  const renderMessage = (type = 0, message = "复制成功") => {
    const div = document.createElement("div");
    div.id = type == 0 ? "copy-message" : "error-message";
    div.textContent = message;
    document.body.appendChild(div);

    // 在下一帧中切换提示元素的可见状态，触发过渡效果
    window.requestAnimationFrame(() => {
      div.classList.add("visible");
    });

    // 3秒后删除提示元素
    setTimeout(() => {
      div.classList.remove("visible");
      setTimeout(() => {
        document.body.removeChild(div);
      }, 300); // 等待0.3秒，使过渡效果结束后再删除元素
    }, 3000);
  };
})();
