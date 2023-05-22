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

const checkLocationPathName = () => {
  if (location.pathname.includes("surveys:history")) {
    timer = setInterval(() => {
      containerRoot = document.querySelector("#opportunities");
      if (containerRoot != null) {
        init();
        changeMainStyle();
        listenerRootMain();
        clearInterval(timer);
      }
    }, 300);
  } else {
    timer = setInterval(() => {
      if (
        document.querySelector("app-reward") ||
        document.querySelector("app-profiling") ||
        document.querySelector("#app-root > main > app-survey")
      ) {
        changeMainStyle();
        listenerRootMain();
        clearInterval(timer);
      }
    }, 300);
  }
};
console.log("render");
if (location.host == "panelist.cint.com") {
  if (location.pathname == "/") {
    let cancanId = setInterval(() => {
      if (location.pathname != "/") {
        clearInterval(cancanId);
        setTimeout(checkLocationPathName);
      }
    }, 200);
  } else {
    checkLocationPathName();
  }
}

const changeMainStyle = () => {
  document.querySelector(
    `#app-root > main > app-${
      location.pathname.includes("account:settings")
        ? "profiling"
        : location.pathname.includes("surveys:history")
        ? "survey"
        : "reward"
    } > section`
  ).style.marginTop = "61px";
};
let hasOwnChangeChildList = false;
let observer = null;
const init = () => {
  // 创建一个新的MutationObserver对象
  observer = new MutationObserver((mutationsList, observer) => {
    console.log("childList");
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
    let oppId = child.getAttribute("data-opp-id");
    let tableELe = child.querySelector(".table > .table-cell");
    // bind id
    const button = child.querySelector(".take-survey");
    button.setAttribute("data-opp-id", oppId);
    button.removeEventListener("click", handleClick);
    button.addEventListener("click", handleClick);

    if (
      hasOpenSelectValue == "all" &&
      statusSelectValue == "all" &&
      moneySelectValue == "all"
    ) {
      child.style.display = "block";
    } else {
      let data = questionMap[oppId];
      if (data) {
        changeChildDisplay(child, data);
      }
    }

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
        console.log("refresh");
        observer.disconnect();
        init();
        changeList();
      }
    }
    sendResponse({});
    return true;
  });
}

if (location.host == "panelist.cint.com") {
  const html = `
      <div class="flex mt10" style="
      background: linear-gradient(rgb(252, 199, 12) 0%, rgb(218, 172, 11) 100%);
      width: 100%;
      justify-content: center;
      display: flex;
      position: fixed;
      top: 61px;
      z-index: 999;
      padding:10px;
      ">
        <div class="selectContainer">
          <label for="open-select">是否打开：</label>
          <select id="open-select">
            <option value="all">全部</option>
            <option value="true">是</option>
            <option value="false">否</option>
          </select>
        </div>
        <div class="selectContainer " style="margin-left:20px">
          <label for="status-select">问卷状态：</label>
          <select id="status-select" class="flex items-center">
            <option value="all">全部</option>
            <option value="0">未知</option>
            <option value="1">测试成功</option>
            <option value="2">不合适</option>
          </select>
        </div>
        <div class="selectContainer" style="margin-left:20px">
          <label for="money-select">价值区间筛选：</label>
          <select id="money-select" class="flex items-center">
            <option value="all">全部</option>
            <option value="1">0.5~1区间</option>
            <option value="2">1~2区间</option>
            <option value="3">2~3区间</option>
            <option value="4">3元以上</option>
          </select>
        </div>
      </div>
  `;
  document.body.insertAdjacentHTML("afterbegin", html);
  setTimeout(() => {
    const openSelect = document.getElementById("open-select");
    const statusSelect = document.getElementById("status-select");
    const moneySelect = document.getElementById("money-select");
    openSelect.addEventListener("change", async (event) => {
      hasOpenSelectValue = event.target.value;
      changeChildrenDisplay();
    });
    statusSelect.addEventListener("change", async (event) => {
      statusSelectValue = event.target.value;
      changeChildDisplay();
    });
    moneySelect.addEventListener("change", async (event) => {
      moneySelectValue = event.target.value;
      changeChildrenDisplay();
    });
  });
  console.log("hello world");
}
let toolbarObserver;
const listenerRootMain = () => {
  // 创建一个新的MutationObserver对象
  toolbarObserver = new MutationObserver(() => {
    // 在DOM节点改变时执行的回调函数
    changeMainStyle();
    if (
      location.pathname.includes("account:settings") ||
      (location.pathname.includes("reward") && observer != null)
    ) {
      observer.disconnect();
      observer = null;
    }
    if (location.pathname.includes("surveys:history") && observer == null) {
      listenOpportunitiesEleChange();
    }
  });

  // 配置MutationObserver对象以监视子节点列表的变化
  const config = { childList: true };

  // 开始监视DOM节点
  toolbarObserver.observe(document.querySelector("#app-root > main"), config);
};
const listenOpportunitiesEleChange = () => {
  timer = setInterval(() => {
    containerRoot = document.querySelector("#opportunities");
    if (containerRoot != null) {
      init();
      clearInterval(timer);
    }
  }, 300);
};
const changeChildDisplay = (child, data) => {
  let money = parseFloat(data["money"]);
  let firstValue =
    hasOpenSelectValue == "all"
      ? true
      : data["hasOpen"] + "" == hasOpenSelectValue;
  let secondValue =
    statusSelectValue == "all" ? true : data["status"] == statusSelectValue;
  let thirdValue =
    moneySelectValue == "all"
      ? true
      : validationMoneyMap[moneySelectValue](money);
  child.style.display =
    firstValue && secondValue && thirdValue ? "block" : "none";
};
const changeChildrenDisplay = () => {
  hasOwnChangeChildList = true;
  if (
    hasOpenSelectValue == "all" &&
    statusSelectValue == "all" &&
    moneySelectValue == "all"
  ) {
    for (let index = 0; index < containerRoot.children.length; index++) {
      const child = containerRoot.children[index];
      child.style.display = "block";
    }
    setTimeout(() => (hasOwnChangeChildList = false));
  } else {
    for (let index = 0; index < containerRoot.children.length; index++) {
      const child = containerRoot.children[index];
      let oppId = child.getAttribute("data-opp-id");
      let data = questionMap[oppId];
      if (data) {
        changeChildDisplay(child, data);
      }
    }
    setTimeout(() => (hasOwnChangeChildList = false));
  }
};
