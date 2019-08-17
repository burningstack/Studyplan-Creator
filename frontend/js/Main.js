const NetworkManager = require("./manager/NetworkManager.js");
const UIManager = require("./manager/UIManager.js");

//init all Manager
var netManager = new NetworkManager();
var uiManager = new UIManager(netManager);
netManager.setUIManager(uiManager);
netManager.getFirstStart();

