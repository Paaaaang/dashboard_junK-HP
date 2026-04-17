import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <header>
          <h1>🤖 Automation Dashboard</h1>
          <p>Workflow Management & Data Processing</p>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function Dashboard() {
  return (
    <div className="dashboard">
      <h2>Welcome to Automation Dashboard</h2>
      <p>This is your comprehensive automation & workflow management platform.</p>
      <div className="features">
        <div className="feature-card">
          <h3>📅 Workflow Management</h3>
          <p>Create and manage automation workflows</p>
        </div>
        <div className="feature-card">
          <h3>📊 Data Processing</h3>
          <p>Process and transform data automatically</p>
        </div>
        <div className="feature-card">
          <h3>📈 Monitoring</h3>
          <p>Real-time workflow status monitoring</p>
        </div>
      </div>
    </div>
  );
}

export default App;
