/**
 * Side Panel Entry Point
 * 
 * Chrome Extension Side Panel의 진입점.
 * 모바일 친화적인 컴팩트 UI로 핵심 기능 제공.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { SidePanelApp } from './SidePanelApp';
import './index.css';
import './i18n';

const rootElement = document.getElementById('sidepanel-root');
if (!rootElement) {
  throw new Error("Could not find sidepanel-root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <SidePanelApp />
  </React.StrictMode>
);
