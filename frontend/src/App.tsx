import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import IDEPage from './pages/IDEPage';

function App() {
  return (
    <div className="font-sans antialiased text-white bg-black min-h-screen">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/runtainer/:id" element={<IDEPage />} />
      </Routes>
    </div>
  );
}

export default App;
