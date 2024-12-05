// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CryptoDetail from './pages/CryptoDetail';
import './App.css';

const App = () => {
  return(
  <Router>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/crypto/:ticker" element={<CryptoDetail />} />
    </Routes>
  </Router>
);
};
export default App;
