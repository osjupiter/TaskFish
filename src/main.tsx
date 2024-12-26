import React from "react";
import ReactDOM from "react-dom/client";
import QuestManager from "./quest";
import './App.css'  

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QuestManager />
  </React.StrictMode>,
);
