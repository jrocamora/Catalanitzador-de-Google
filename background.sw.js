let modified = false; // Variable per controlar si la URL ha estat modificada.
let catalanizedOnce = false; // Indica si la cerca ja ha estat catalanitzada almenys una vegada.
let tabEnabled = {}; // Objecte que guarda l'estat (activat/desactivat) de l'extensió per cada pestanya.
let tabCatalanizedOnce = {}; // Objecte que indica si una pestanya ja ha estat catalanitzada almenys una vegada.
let activeTabId; // Emmagatzema l'ID de la pestanya activa actual.

// Escolta els esdeveniments abans de la navegació.
chrome.webNavigation.onBeforeNavigate.addListener(function(details) {
  // Verifica si la URL és una cerca de Google.
  if (details.url.includes("www.google.com/search")) {
    if (tabEnabled[activeTabId]) { // Només actua si l'extensió està activada per a la pestanya activa.
      if (!modified) { // Evita modificar repetidament la URL durant la mateixa navegació.
        // Si ja s'havia catalanitzat i la nova URL no inclou el paràmetre "&lr=lang_ca", desactiva l'extensió.
        if (tabCatalanizedOnce[activeTabId] && !details.url.includes("&lr=lang_ca")) {
          modified = true;
          tabCatalanizedOnce[activeTabId] = false;
          tabEnabled[activeTabId] = false;
          updateBadgeValue(); // Actualitza la visualització de l'estat de l'extensió.
        } else {
          // Afegeix el paràmetre "&lr=lang_ca" per forçar la cerca en català.
          var newUrl = details.url + "&lr=lang_ca";
          tabCatalanizedOnce[activeTabId] = true;
          modified = true;
          chrome.tabs.update(details.tabId, {url: newUrl}); // Actualitza la URL de la pestanya.
        }
      }
    } else {
      // Si l'extensió està desactivada però la URL conté "&lr=lang_ca", elimina el paràmetre.
      if (details.url.includes("&lr=lang_ca")) {
        var newUrl = details.url.replace("&lr=lang_ca", "");
        modified = true;
        chrome.tabs.update(details.tabId, {url: newUrl});
      }
    }
  }
}, {url: [{hostContains: 'google.com'}]});

// Reseteja la variable 'modified' després que la navegació s'hagi completat.
chrome.webNavigation.onCommitted.addListener(function(details) {
  if (modified) {
    modified = false;
  }
}, {url: [{hostContains: 'google.com'}]});

// Gestiona els clics a l'extensió
chrome.action.onClicked.addListener(function(tab) {
  // Canvia l'estat de l'extensió per la pestanya activa.
  if (tabEnabled[activeTabId]) {
    tabEnabled[activeTabId] = false;
  } else {
    tabEnabled[activeTabId] = true;
  }

  updateBadgeValue(); // Actualitza l'indicador visual de l'estat.

  // Recarrega la pestanya si és una cerca de Google.
  chrome.tabs.get(activeTabId, function(tab) {
    var currentTabUrl = tab.url;
    if (currentTabUrl.includes("www.google.com/search")) {
      tabCatalanizedOnce[activeTabId] = false; // Marca com no catalanitzada.
      chrome.tabs.update(tab.id, {url: currentTabUrl}); // Recarrega la URL.
    }
  });
});

// Gestiona el canvi de pestanya activa.
chrome.tabs.onActivated.addListener(function(activeInfo) {
  activeTabId = activeInfo.tabId; // Actualitza l'ID de la pestanya activa.
  if (tabEnabled[activeTabId] == undefined) { // Inicialitza l'estat si no està definit.
    tabEnabled[activeTabId] = true; // Activa l'extensió per defecte.
  }
  updateBadgeValue(); // Actualitza l'indicador visual.
});

// Actualitza l'estat de la icona i el text de la insígnia de l'extensió.
function updateBadgeValue() {
  if (tabEnabled[activeTabId]) {
    chrome.action.setTitle({title: "El catalanitzador de Google força totes les cerques de Google en Català. Fes click per desactivar l'extensió"}); 
    chrome.action.setBadgeText({text: 'ON'});
    chrome.action.setBadgeBackgroundColor({color: '#77DD77'});
  } else {
    chrome.action.setTitle({title: "El catalanitzador de Google força totes les cerques de Google en Català. Fes click per activar l'extensió"});
    chrome.action.setBadgeText({text: 'OFF'});
    chrome.action.setBadgeBackgroundColor({color: '#B2BEB5'});
  }
}
