import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import AppContent from './AppContent';
import './index.css';
import 'react-calendar/dist/Calendar.css'; 

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
