
// 「おい、App.jsx、一緒にバンドルされようぜ！」という依存関係の宣言
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
