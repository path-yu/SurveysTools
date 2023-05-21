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
