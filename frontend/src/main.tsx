import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { cleanUpStoredIncidents } from "./storage";

// App 이 저장된 데이터를 읽기 전에 실행해야 한다
cleanUpStoredIncidents();

document.title = "다시가동";

const favicon = document.createElement("link");
favicon.rel = "icon";
favicon.type = "image/png";
favicon.href = "/favicon.png";
document.head.appendChild(favicon);

const appleTouchIcon = document.createElement("link");
appleTouchIcon.rel = "apple-touch-icon";
appleTouchIcon.href = "/restart-app-icon.png";
document.head.appendChild(appleTouchIcon);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
