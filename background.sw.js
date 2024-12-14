let modified = false;
let catalanizedOnce = false;
let tabEnabled = {};
let tabCatalanizedOnce = {};
let activeTabId;



chrome.webNavigation.onBeforeNavigate.addListener(function(details) {

//console.log("onBeforeNavigate function called, tabEnabled[tabId] is " + tabEnabled[activeTabId]);
  //console.log("onBeforeNavigate function called, tabCatalanizedOnce[activeTabId] is " + tabCatalanizedOnce[activeTabId]);
  if (details.url.includes("www.google.com/search")){
    if(tabEnabled[activeTabId]){
      if (!modified) {
        //Let's check if we are trying to get away from catalan only search
        if (tabCatalanizedOnce[activeTabId] && !details.url.includes("&lr=lang_ca")){
          modified = true;
          tabCatalanizedOnce[activeTabId] = false;
          tabEnabled[activeTabId] = false;

          updateBadgeValue();
        }else{
          var newUrl = details.url + "&lr=lang_ca";
          
          tabCatalanizedOnce[activeTabId] = true;
          modified = true;
          chrome.tabs.update(details.tabId, {url: newUrl});
        }

      }
    }else{
      if (details.url.includes("&lr=lang_ca")){
        var newUrl = details.url.replace("&lr=lang_ca", "");
        modified = true;
        chrome.tabs.update(details.tabId, {url: newUrl});
      }
    }
  }

}, {url: [{hostContains: 'google.com'}]});


chrome.webNavigation.onCommitted.addListener(function(details) {
  if(modified){
    modified = false;
  }
  
}, {url: [{hostContains: 'google.com'}]});


chrome.action.onClicked.addListener(function(tab) {

  console.log("Tab contains " + tab);

  if (tabEnabled[activeTabId]){
    tabEnabled[activeTabId] = false;
  }else{
    tabEnabled[activeTabId] = true;
  }

  updateBadgeValue();

  var currentTabUrl;
  chrome.tabs.get(activeTabId, function(tab) {
    currentTabUrl = tab.url;
    console.log("URL of tab with id: " + activeTabId + " is " + currentTabUrl);

    if (currentTabUrl.includes("www.google.com/search")){
      tabCatalanizedOnce[activeTabId] = false;
      chrome.tabs.update(tab.id, {url: currentTabUrl});
      //chrome.tabs.reload(tab.id);
    }
  });

});
chrome.tabs.onActivated.addListener(function(activeInfo) {
  // Code to be executed when the active tab changes
  activeTabId = activeInfo.tabId;
  if (tabEnabled[activeTabId] == undefined) {
    tabEnabled[activeTabId] = true;
  }

  updateBadgeValue();

  //console.log("onActivated function called, tabEnabled is " + tabEnabled[activeTabId]);
  //console.log("onActivated function called, inGoogle is " + inGoogle);
  //console.log("onActivated function called, catalanizedOnce is " + catalanizedOnce);
});


function updateBadgeValue(){
  if (tabEnabled[activeTabId]){
    chrome.action.setTitle({title: "El catalanitzador de Google força totes les cerques de Google en Català. Fes click per desactivar l'extensió"}) 
    chrome.action.setBadgeText({text: 'ON'});
    chrome.action.setBadgeBackgroundColor({color: '#77DD77'});
  }else{
    chrome.action.setTitle({title: "El catalanitzador de Google força totes les cerques de Google en Català. Fes click per activar l'extensió"})
    chrome.action.setBadgeText({text: 'OFF'});
    chrome.action.setBadgeBackgroundColor({color: '#B2BEB5'});
  }
}
