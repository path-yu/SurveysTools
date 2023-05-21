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
      }
    });

    let statusSelectValue = localStorage.getItem("statusSelectValue");
    let selectOpenValue = localStorage.getItem("selectOpenValue");
    let moneySelectValue = localStorage.getItem("moneySelectValue");

    if (statusSelectValue) {
      statusSelect.value = statusSelectValue;
    }
    if (selectOpenValue) {
      openSelect.value = selectOpenValue;
    }
    if (moneySelectValue) {
      moneySelect.value = moneySelectValue;
    }
  }

  document.addEventListener("DOMContentLoaded", init);

  const openButton = document.querySelector(".openButton");
  const disabledButton = document.querySelector(".disabledButton");
  const availableButton = document.querySelector(".availableButton");
  const refreshButton = document.querySelector(".refreshButton");
  const openSelect = document.querySelector("#open-select");
  const statusSelect = document.querySelector("#status-select");
  const moneySelect = document.querySelector("#money-select");
  const oppOrderButton = document.querySelector(".oppOrderButton");

  openButton.addEventListener("click", async () => {
    const result = await chrome.storage.session.get(["iframeUrl"]);
    if (result.iframeUrl) {
      window.open(result.iframeUrl);
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

  refreshButton.addEventListener("click", async (ev) => {
    if (result["rootTabId"]) {
      chrome.tabs.sendMessage(+activeTabId, {
        type: "refreshList",
      });
    }
  });
  openSelect.addEventListener("change", async (event) => {
    let result = await chrome.storage.session.get("rootTabId");
    if (result["rootTabId"]) {
      chrome.tabs.sendMessage(+result["rootTabId"], {
        type: "selectOpenChange",
        selectValue: event.target.value,
      });
      localStorage.setItem("selectOpenValue", event.target.value);
    }
  });
  statusSelect.addEventListener("change", async (event) => {
    let result = await chrome.storage.session.get("rootTabId");
    if (result["rootTabId"]) {
      chrome.tabs.sendMessage(+result["rootTabId"], {
        type: "statusChange",
        selectValue: event.target.value,
      });
      localStorage.setItem("statusSelectValue", event.target.value);
    }
  });
  moneySelect.addEventListener("change", async (event) => {
    console.log("change");
    let result = await chrome.storage.session.get("rootTabId");
    if (result["rootTabId"]) {
      chrome.tabs.sendMessage(+result["rootTabId"], {
        type: "moneyChange",
        selectValue: event.target.value,
      });
      localStorage.setItem("moneySelectValue", event.target.value);
    }
  });
  oppOrderButton.addEventListener("click", (ev) => {
    if (oppOrderButton.textContent != "未知") {
      navigator.clipboard.writeText(oppOrderButton.textContent);
      const message = "复制成功！";
      const div = document.createElement("div");
      div.id = "copy-message";
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
    }
  });
})();
