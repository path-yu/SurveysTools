document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector("#panelist-portal")) {
    chrome.runtime.sendMessage({
      type: "setIframeUrl",
      payload: {
        url: document.querySelector("#panelist-portal").getAttribute("src"),
      },
    });
  }
});
let timer;
let containerRoot;
timer = setInterval(() => {
  containerRoot = document.querySelector("#opportunities");
  if (containerRoot != null) {
    clearInterval(timer);
    init();
  }
}, 1000);
let hasOwnChangeChildList = false;
let observer = null;
const init = () => {
  // 创建一个新的MutationObserver对象
  observer = new MutationObserver((mutationsList, observer) => {
    // 在DOM节点改变时执行的回调函数
    for (const mutation of mutationsList) {
      if (mutation.type == "childList" && !hasOwnChangeChildList) {
        changeList();
      }
    }
  });

  // 配置MutationObserver对象以监视子节点列表的变化
  const config = { childList: true };

  // 开始监视DOM节点
  observer.observe(containerRoot, config);
};
const statusMap = {
  0: "未知",
  1: "测试成功",
  2: "不合适",
};
let questionMap = {};
const changeList = () => {
  const children = containerRoot.children;

  for (let index = 0; index < children.length; index++) {
    const child = children[index];

    if (child.nodeType == 1) {
      let oppId = child.getAttribute("data-opp-id");
      let tableELe = child.querySelector(".table > .table-cell");
      // bind id
      const button = child.querySelector(".take-survey");
      button.setAttribute("data-opp-id", oppId);
      button.removeEventListener("click", handleClick);
      button.addEventListener("click", handleClick);

      if (!tableELe.textContent.includes("问卷编号：")) {
        let idText = document.createElement("div");
        idText.textContent = `问卷编号：${oppId}`;
        idText.style.cssText = "color:red; padding-left:10px;";

        let fragment = document.createDocumentFragment();
        let hasOpenEle = document.createElement("span");
        hasOpenEle.setAttribute("class", "hasOpen");
        hasOpenEle.style.paddingLeft = "10px";

        let otherEle = document.createElement("span");
        otherEle.setAttribute("class", "test_status");
        otherEle.style.color = "black";
        fragment.appendChild(idText);
        fragment.appendChild(hasOpenEle);
        fragment.appendChild(otherEle);
        const childrenAsArray = Array.from(fragment.children);
        for (const element of childrenAsArray) {
          tableELe.insertAdjacentElement("afterbegin", element);
        }
        if (sessionStorage.getItem(oppId)) {
          questionMap[oppId] = {
            ...JSON.parse(sessionStorage.getItem(oppId)),
            hasOpenEle,
            otherEle,
          };
          renderDom(questionMap[oppId], hasOpenEle, otherEle);
        } else {
          if (!questionMap[oppId]) {
            questionMap[oppId] = {
              hasOpen: false,
              id: oppId,
              status: 0, // 0 未知， 1 -> 可做， 2 -> 不合适,
              hasOpenEle,
              otherEle,
              tabsId: null,
              money: child
                .querySelector(".opportunity-incentive")
                .textContent.trim(),
            };
            hasOwnChangeChildList = true;
            hasOpenEle.textContent = "未打开";
            hasOpenEle.style.color = "#FF69B4";
            otherEle.textContent = `问卷状态：未知`;
            setTimeout(() => (hasOwnChangeChildList = false));
          } else {
            renderDom(questionMap[oppId], hasOpenEle, otherEle);
          }
        }
      }
    }
  }
};
const renderDom = (data, hasOpenEle, otherEle) => {
  hasOwnChangeChildList = true;
  hasOpenEle.textContent = data["hasOpen"] ? "已打开" : "未打开";
  hasOpenEle.style.color = data["hasOpen"] ? "#67C23A" : "#FF69B4";
  let status = data["status"];
  otherEle.style.color =
    status == 0 ? "black" : status == 1 ? "#606266" : "#ccc";
  otherEle.textContent = "问卷状态：" + statusMap[status];
  setTimeout(() => (hasOwnChangeChildList = false));
};
let prevClickOppId = null;
const handleClick = (event) => {
  if (event.target.nodeType == 1) {
    hasOwnChangeChildList = true;
    let oppId = event.target.getAttribute("data-opp-id");
    let data = questionMap[oppId];
    data["hasOpenEle"].textContent = "已打开";
    data["hasOpenEle"].style.color = "#67C23A";
    data["hasOpen"] = true;
    sessionStorage.setItem(oppId, JSON.stringify(data));
    prevClickOppId = oppId;
    setTimeout(() => (hasOwnChangeChildList = false));
  }
};
let hasOpenSelectValue = "all",
  statusSelectValue = "all",
  moneySelectValue = "all";
let validationMoneyMap = {
  1: (value) => value >= 0.5 && value < 1,
  2: (value) => value >= 1 && value < 2,
  3: (value) => value >= 2 && value < 3,
  4: (value) => value >= 3,
};
if (location.host == "panelist.cint.com") {
  chrome.runtime.sendMessage({ type: "setRootTabsId" });
  chrome.runtime.onMessage.addListener(function async(
    message,
    sender,
    sendResponse
  ) {
    if (message.type == "createNewTabs") {
      if (prevClickOppId) {
        questionMap[prevClickOppId]["tabsId"] = message["tab"]["id"];
        chrome.runtime.sendMessage({
          type: "setTabsDataStorage",
          payload: {
            tabId: message["tab"]["id"],
            value: {
              oppId: prevClickOppId,
              money: questionMap[prevClickOppId]["money"],
            },
          },
        });

        prevClickOppId = null;
      }
    }
    if (message.type == "updateTabs") {
      let oppId = message["activeOppId"];
      let data = questionMap[oppId];
      if (data) {
        data["status"] = message["menuItemId"] == "disabled" ? 2 : 1;
        sessionStorage.setItem(oppId, JSON.stringify(data));
        renderDom(data, data["hasOpenEle"], data["otherEle"]);
      }
    }

    if (message.type == "refreshList") {
      containerRoot = document.querySelector("#opportunities");
      if (containerRoot != null && location.pathname.includes("surveys")) {
        observer.disconnect();
        init();
        changeList();
      }
    }

    if (
      message.type == "selectOpenChange" ||
      message.type == "statusChange" ||
      message.type == "moneyChange"
    ) {
      hasOwnChangeChildList = true;
      if (message.type == "selectOpenChange") {
        hasOpenSelectValue = message.selectValue;
      }
      if (message.type == "statusChange") {
        statusSelectValue = message.selectValue;
      }
      if (message.type == "moneyChange") {
        moneySelectValue = message.selectValue;
      }
      hasOwnChangeChildList = true;

      if (
        hasOpenSelectValue == "all" &&
        statusSelectValue == "all" &&
        moneySelectValue == "all"
      ) {
        console.log();
        for (let index = 0; index < containerRoot.children.length; index++) {
          const child = containerRoot.children[index];
          child.style.display = "block";
        }
        setTimeout(() => (hasOwnChangeChildList = false));
      } else {
        Array.from(containerRoot.children).forEach((child) => {});
        for (let index = 0; index < containerRoot.children.length; index++) {
          const child = containerRoot.children[index];
          let oppId = child.getAttribute("data-opp-id");
          let data = questionMap[oppId];
          let money = parseFloat(data["money"]);
          let firstValue =
            hasOpenSelectValue == "all"
              ? true
              : data["hasOpen"] + "" == hasOpenSelectValue;
          let secondValue =
            statusSelectValue == "all"
              ? true
              : data["status"] == statusSelectValue;
          let thirdValue =
            moneySelectValue == "all"
              ? true
              : validationMoneyMap[moneySelectValue](money);
          child.style.display =
            firstValue && secondValue && thirdValue ? "block" : "none";
        }
        setTimeout(() => (hasOwnChangeChildList = false));
      }
    }
    sendResponse({});
    return true;
  });
}
