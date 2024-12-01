export function getActiveTab() {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        const activeTab = tabs[0];
        if (activeTab) {
          resolve(activeTab);
        } else {
          reject(new Error("No active tab found"));
        }
      });
    }); 
  }

