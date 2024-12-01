chrome.action.onClicked.addListener(async(tab) => {
  chrome.sidePanel.open({tabId: tab.id});
});
