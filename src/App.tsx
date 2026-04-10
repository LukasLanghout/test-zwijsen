import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ExercisePage from './pages/Exercise';
import Variations from './pages/Variations';
import AdminDashboard from './pages/admin/Dashboard';
import AdminEditor from './pages/admin/Editor';
import AdminAnalytics from './pages/admin/Analytics';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/oefening/:id" element={<ExercisePage />} />
        <Route path="/variaties/:id" element={<Variations />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/:id" element={<AdminEditor />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
