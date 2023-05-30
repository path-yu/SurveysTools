"use strict";

// With background scripts you can communicate with popup
// and contentScript files.
// For more information on background script,
// See https://developer.chrome.com/extensions/background_pages

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type == "setIframeUrl") {
    chrome.storage.session.set({ iframeUrl: request.payload.url });
    sendResponse({});
  }

  if (request.type == "setRootTabsId") {
    let rootTabId = sender.tab.id;
    chrome.storage.session.set({ rootTabId });
    sendResponse({ tabId: rootTabId, tabIndex: sender.tab.index });
  }

  if (request.type == "setTabsDataStorage") {
    chrome.storage.session.set({
      [request.payload.tabId]: request.payload.value,
    });
    sendResponse({});
  }

  if (request.type == "geSurveyData") {
    doSomethingWith(request).then(sendResponse);
  }
  if (request.type == "initBookMarks") {
    createBookMarks(request.data);
    sendResponse({});
  }
  return true;
});
chrome.tabs.onCreated.addListener(async (tab) => {
  let result = await chrome.storage.session.get("rootTabId");
  if (result["rootTabId"]) {
    chrome.tabs.sendMessage(+result["rootTabId"], {
      tab: tab,
      type: "createNewTabs",
    });
  }
});
async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}
async function doSomethingWith(request) {
  const activeTab = await getCurrentTab();
  const result = await chrome.storage.session.get(activeTab.id + "");
  return {
    value: {
      ...result[activeTab.id],
      tabId: activeTab.id,
    },
  };
}
const regex = /^\d{4}-\d{1,2}-\d{1,2}$/;
async function createBookMarks(remarkList) {
  const newList = [];
  remarkList.forEach((item) => {
    if (regex.test(item)) {
      newList.push(item, getAge(item) + "岁");
    } else {
      newList.push(item);
    }
  });
  newList.forEach((item) => {
    chrome.bookmarks.search({ title: item }).then((res) => {
      if (!res.length) {
        chrome.bookmarks.create({
          parentId: "1", // 父节点 ID（1 表示“其他书签”文件夹）
          title: item, // 书签标题
        });
      }
    });
  });
}
function getAge(dateString) {
  const today = new Date();
  const birthDate = new Date(dateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}
