import { useEffect, useState, useRef } from "react";
import API from "../services/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function AlertBox({ msg }) {
  return (
    <div className="alert-box">
      <div className="alert-icon">⚠️</div>
      <div className="alert-text">{msg}</div>
    </div>
  );
}

export default function Dashboard() {
  const [alerts, setAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState("live");
  const [reportPeriod, setReportPeriod] = useState("all");

  // Settings State
  const [apiKey, setApiKey] = useState("");
  const [cam1Url, setCam1Url] = useState("0");
  const [cam2Url, setCam2Url] = useState("1");
  const [settingsMsg, setSettingsMsg] = useState("");

  const prevAlertCount = useRef(0);
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/";
    return null;
  }

  const loadData = async () => {
    try {
      const a = await API.get("/alerts");
      const newAlerts = a.data;

      // Auto Audio Alarm logic
      if (newAlerts.length > 0 && prevAlertCount.current > 0 && newAlerts.length > prevAlertCount.current) {
        playAlarm();
      }
      prevAlertCount.current = newAlerts.length;

      setAlerts(newAlerts);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/";
      }
    }
  };

  const loadSettings = async () => {
    try {
      const s = await API.get("/settings");
      setApiKey(s.data.api_key || "");
      setCam1Url(s.data.camera_urls?.cam1 || "0");
      setCam2Url(s.data.camera_urls?.cam2 || "1");
    } catch (err) {
      console.error("Failed loading settings");
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    try {
      await API.post("/settings", {
        api_key: apiKey,
        camera_urls: { cam1: cam1Url, cam2: cam2Url }
      });
      setSettingsMsg("Settings Saved Successfully!");
      setTimeout(() => setSettingsMsg(""), 3000);
    } catch (err) {
      setSettingsMsg("Failed saving settings.");
    }
  };

  const playAlarm = () => {
    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance("Warning, PPE Violation Detected");
      msg.lang = 'en-US';
      msg.rate = 1.1;
      msg.pitch = 1.2;
      window.speechSynthesis.speak(msg);
    }
  };

  useEffect(() => {
    loadData();
    loadSettings();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const downloadReport = () => {
    window.open(`http://127.0.0.1:5000/report?token=${token}&period=${reportPeriod}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  // Analytics Chart Logic
  const getChartData = () => {
    const typeCounts = {};
    alerts.forEach(a => {
      let typeStr = a[3].replace("Missing PPE: ", "");
      if (typeStr === "PPE Missing") typeStr = "UNSPECIFIED/LEGACY";
      typeCounts[typeStr] = (typeCounts[typeStr] || 0) + 1;
    });

    const labels = Object.keys(typeCounts);
    const dataVals = Object.values(typeCounts);

    const colors = [
      'rgba(239, 68, 68, 0.8)', // Red
      'rgba(245, 158, 11, 0.8)', // Amber
      'rgba(59, 130, 246, 0.8)', // Blue
      'rgba(16, 185, 129, 0.8)'  // Emerald
    ];

    const borders = [
      'rgba(239, 68, 68, 1)', 
      'rgba(245, 158, 11, 1)', 
      'rgba(59, 130, 246, 1)', 
      'rgba(16, 185, 129, 1)'
    ];

    return {
      labels: labels.length > 0 ? labels : ['No Data'],
      datasets: [
        {
          label: 'Total Violations by Category',
          data: dataVals.length > 0 ? dataVals : [0],
          backgroundColor: labels.map((_, i) => colors[i % colors.length]),
          borderColor: labels.map((_, i) => borders[i % borders.length]),
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { color: '#E2E8F0' } },
      title: { display: true, text: 'Breakdown: PPE Violations by Object Type', color: '#E2E8F0' },
    },
    scales: {
      y: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.1)' } },
      x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.1)' } }
    }
  };

  return (
    <div className="dashboard-layout">
      <div className="sidebar">
        <h2 className="brand-logo">VisionShield</h2>
        <nav className="nav-menu">
          <button
            className={`nav-link ${activeTab === 'live' ? 'active' : ''}`}
            onClick={() => setActiveTab('live')}
          >📡 Live Monitoring</button>

          <button
            className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >📊 Analytics</button>

          <button
            className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >⚙️ Settings</button>
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>🚪 Logout</button>
        </div>
      </div>

      <div className="main-content">
        <div className="top-header">
          <h2>
            {activeTab === 'live' && "Dashboard Overview"}
            {activeTab === 'analytics' && "Data & Analytics"}
            {activeTab === 'settings' && "System Configuration"}
          </h2>
          <div className="header-actions" style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
            <select 
              className="periode-select"
              value={reportPeriod}
              onChange={e => setReportPeriod(e.target.value)}
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                color: 'white',
                border: '1px solid var(--glass-border)',
                padding: '0.65rem 1.5rem',
                borderRadius: '8px',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              <option value="all">📊 All Time Data</option>
              <option value="daily">📅 Daily (Hari Ini)</option>
              <option value="monthly">📆 Monthly (Bulan Ini)</option>
              <option value="yearly">📈 Yearly (Tahun Ini)</option>
            </select>
            <button className="btn btn-primary" onClick={downloadReport}>
              📄 Export PDF Report
            </button>
          </div>
        </div>

        {activeTab === 'live' && (
          <>
            <div className="cctv-grid">
              <div className="cctv-card">
                <div className="cctv-header">
                  <h3>📍 Camera 1: Source</h3>
                  <span className="live-badge">LIVE</span>
                </div>
                <div className="cctv-frame">
                  {/* Notice added random param to force refresh on settings save if needed, though stream is continuous */}
                  <img src={`http://127.0.0.1:5000/video/cam1?token=${token}`} alt="CCTV 1 stream" />
                </div>
              </div>
              <div className="cctv-card">
                <div className="cctv-header">
                  <h3>📍 Camera 2: Source</h3>
                  <span className="live-badge">LIVE</span>
                </div>
                <div className="cctv-frame">
                  <img src={`http://127.0.0.1:5000/video/cam2?token=${token}`} alt="CCTV 2 stream" />
                </div>
              </div>
            </div>

            <div className="alerts-section">
              <h3>🚨 Live Violation Alerts (Max 50)</h3>
              <div className="alerts-list">
                {alerts.length === 0 ? (
                  <div className="no-alert-msg">All areas secure. No violations detected.</div>
                ) : (
                  alerts.slice(0, 5).map((a, i) => {
                    const time = new Date(a[1]).toLocaleTimeString();
                    return <AlertBox key={i} msg={`[${time}] ${a[2]}: ${a[3]}`} />;
                  })
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-card card p-4">
            <div style={{ maxWidth: '600px', margin: '0 auto', background: 'rgba(15,23,42,0.6)', padding: '20px', borderRadius: '16px' }}>
              <Bar options={chartOptions} data={getChartData()} />
            </div>
            <div className="mt-4" style={{ textAlign: "center", color: "#94A3B8", marginTop: '20px' }}>
              <p>Total Lifespan Alerts: {alerts.length}</p>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-card">
            <form onSubmit={saveSettings} className="settings-form">
              <div className="input-group">
                <label>Roboflow API Key</label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="e.g., a0ZmLbsda0FY..."
                />
              </div>
              <div className="input-group">
                <label>Camera 1 Source (RTSP URL / USB ID 0)</label>
                <input
                  type="text"
                  value={cam1Url}
                  onChange={e => setCam1Url(e.target.value)}
                  placeholder="0, 1, or rtsp://..."
                />
              </div>
              <div className="input-group">
                <label>Camera 2 Source (RTSP URL / USB ID 1)</label>
                <input
                  type="text"
                  value={cam2Url}
                  onChange={e => setCam2Url(e.target.value)}
                  placeholder="0, 1, or rtsp://..."
                />
              </div>

              {settingsMsg && <div className="success-msg" style={{ color: '#10B981', marginBottom: '1rem' }}>{settingsMsg}</div>}

              <button type="submit" className="btn btn-primary">Save Configuration</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}