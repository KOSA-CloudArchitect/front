import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import './index.css';

// MSW 브라우저 워커 초기화 (개발 환경에서만)
if (process.env.NODE_ENV === 'development') {
  const { worker } = require('./mocks/browser');
  worker.start({
    onUnhandledRequest: 'bypass', // 처리되지 않은 요청은 실제 서버로 전달
  });
}

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);