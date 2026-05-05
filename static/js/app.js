const video = document.getElementById("webcam");
const ipcamView = document.getElementById("ipcamView");
const canvas = document.getElementById("captureCanvas");
const startBtn = document.getElementById("startCameraBtn");
const stopBtn = document.getElementById("stopCameraBtn");
const overlay = document.getElementById("videoOverlay");
const systemModeText = document.getElementById("systemModeText");
const complianceBadge = document.getElementById("complianceBadge");
const alertBox = document.getElementById("alertBox");
const confidenceText = document.getElementById("confidenceText");

const workerStatus = document.getElementById("workerStatus");
const helmetStatus = document.getElementById("helmetStatus");
const vestStatus = document.getElementById("vestStatus");
const shoesStatus = document.getElementById("shoesStatus");
const glovesStatus = document.getElementById("glovesStatus");
const gogglesStatus = document.getElementById("gogglesStatus");

const totalLogs = document.getElementById("totalLogs");
const totalViolations = document.getElementById("totalViolations");
const compliantLogs = document.getElementById("compliantLogs");
const lastActivity = document.getElementById("lastActivity");

let mediaStream = null;
let captureTimer = null;
let currentConfig = { camera_type: "webcam", camera_id: "", camera_url: "" };

const CAPTURE_INTERVAL = window.SAFESIGHT_CONFIG?.captureInterval || 1800;

// === SETTINGS MODAL LOGIC ===
const settingsModal = document.getElementById("settingsModal");
const openSettingsBtn = document.getElementById("openSettingsBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const webcamSelect = document.getElementById("webcamSelect");
const ipcamUrl = document.getElementById("ipcamUrl");
const webcamGroup = document.getElementById("webcamGroup");
const ipcamGroup = document.getElementById("ipcamGroup");

async function loadSettings() {
  try {
    const res = await fetch("/api/settings");
    currentConfig = await res.json();
    
    if (openSettingsBtn) {
      const radioIpcam = document.querySelector('input[value="ipcam"]');
      const radioWebcam = document.querySelector('input[value="webcam"]');
      if (currentConfig.camera_type === "ipcam") {
        radioIpcam.checked = true;
        ipcamGroup.classList.remove("hidden");
        webcamGroup.classList.add("hidden");
      } else {
        radioWebcam.checked = true;
        webcamGroup.classList.remove("hidden");
        ipcamGroup.classList.add("hidden");
      }
      ipcamUrl.value = currentConfig.camera_url || "";
    }
  } catch (e) { console.error(e); }
}

async function populateCameras() {
  try {
    await navigator.mediaDevices.getUserMedia({video: true}); // trigger prompt
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === 'videoinput');
    
    webcamSelect.innerHTML = videoDevices.map(d => 
      `<option value="${d.deviceId}" ${d.deviceId === currentConfig.camera_id ? 'selected' : ''}>${d.label || 'Kamera USB Terdeteksi'}</option>`
    ).join('');
  } catch(e) { console.error(e); }
}

if (settingsModal) {
  openSettingsBtn.addEventListener("click", () => {
    settingsModal.classList.remove("hidden");
    populateCameras();
  });
  
  closeModalBtn.addEventListener("click", () => {
    settingsModal.classList.add("hidden");
  });
  
  document.querySelectorAll('input[name="camType"]').forEach(r => {
    r.addEventListener('change', (e) => {
      if (e.target.value === 'webcam') {
        webcamGroup.classList.remove("hidden");
        ipcamGroup.classList.add("hidden");
      } else {
        ipcamGroup.classList.remove("hidden");
        webcamGroup.classList.add("hidden");
      }
    });
  });

  saveSettingsBtn.addEventListener("click", async () => {
    const payload = {
      camera_type: document.querySelector('input[name="camType"]:checked').value,
      camera_id: webcamSelect.value,
      camera_url: ipcamUrl.value
    };
    
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      settingsModal.classList.add("hidden");
      await loadSettings();
      
      if (captureTimer) {
        stopCamera();
        startCamera();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save settings.");
    }
  });
}
// === END SETTINGS ===

function setMetric(element, ok) {
  element.textContent = ok ? "Detected" : "Not Detected";
  element.className = ok ? "ok" : "no";
}

function setCompliance(compliant) {
  complianceBadge.className = compliant ? "pill success" : "pill danger";
  complianceBadge.textContent = compliant ? "Compliant" : "Violation";
}

function setAlert(message, type = "info") {
  alertBox.className = `alert-box ${type}`;
  alertBox.textContent = message;
}

async function startCamera() {
  try {
    if (currentConfig.camera_type === "ipcam") {
      video.style.display = "none";
      ipcamView.style.display = "block";
      if (!currentConfig.camera_url) throw new Error("CCTV URL is empty!");
      
      // Use backend proxy to bypass Canvas CORS tainting from external IP Cameras
      ipcamView.src = "/api/proxy/video?url=" + encodeURIComponent(currentConfig.camera_url);
      overlay.textContent = "Connecting to IP Camera...";
      setTimeout(() => overlay.style.display = "none", 1500);
      
    } else {
      ipcamView.style.display = "none";
      video.style.display = "block";
      
      const constraints = { video: { width: 1280, height: 720 }, audio: false };
      if (currentConfig.camera_id) {
        constraints.video.deviceId = { exact: currentConfig.camera_id };
      }
      mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = mediaStream;
      overlay.style.display = "none";
    }

    if (captureTimer) clearInterval(captureTimer);
    captureTimer = setInterval(captureAndAnalyze, CAPTURE_INTERVAL);
  } catch (error) {
    overlay.style.display = "grid";
    overlay.textContent = "Gagal mengakses kamera. Periksa perangkat/jaringan.";
    console.error(error);
  }
}

function stopCamera() {
  if (captureTimer) clearInterval(captureTimer);
  captureTimer = null;

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }

  video.srcObject = null;
  ipcamView.src = "";
  overlay.style.display = "grid";
  overlay.innerHTML = 'Klik <strong>Start Camera</strong> untuk memulai monitoring.';
}

async function captureAndAnalyze() {
  let srcElement = currentConfig.camera_type === "ipcam" ? ipcamView : video;
  const width = srcElement.videoWidth || srcElement.naturalWidth;
  const height = srcElement.videoHeight || srcElement.naturalHeight;
  
  if (!width || !height) return;

  const ctx = canvas.getContext("2d");
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(srcElement, 0, 0, canvas.width, canvas.height);

  const frame = canvas.toDataURL("image/jpeg", 0.82);

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frame }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to analyze frame.");

    updateDetectionUI(data.result);
    await refreshSummary();
  } catch (error) {
    console.error(error);
    setAlert(error.message, "danger");
  }
}

function updateDetectionUI(result) {
  setMetric(workerStatus, result.worker_detected);
  setMetric(helmetStatus, result.helmet);
  setMetric(vestStatus, result.vest);
  setMetric(shoesStatus, result.shoes);
  if (typeof glovesStatus !== 'undefined') setMetric(glovesStatus, result.gloves);
  if (typeof gogglesStatus !== 'undefined') setMetric(gogglesStatus, result.goggles);
  setCompliance(result.compliant);

  confidenceText.textContent = Number(result.confidence).toFixed(3);

  if (!result.worker_detected) {
    setAlert(result.violation_text, "info");
  } else if (result.compliant) {
    setAlert(result.violation_text, "success");
  } else {
    setAlert(result.violation_text, "danger");
  }
}

async function refreshSummary() {
  try {
    const response = await fetch("/api/summary");
    const data = await response.json();

    totalLogs.textContent = data.total_logs ?? 0;
    totalViolations.textContent = data.violations ?? 0;
    compliantLogs.textContent = data.compliant_logs ?? 0;
    lastActivity.textContent = data.last_activity ?? "-";

    if (window.complianceChart) {
      window.complianceChart.data.datasets[0].data = [data.compliant_logs ?? 0, data.violations ?? 0];
      window.complianceChart.update();
    }
  } catch (error) {
    console.error(error);
  }
}

function initChart() {
  const ctx = document.getElementById("statsChart");
  if (!ctx) return;

  window.complianceChart = new Chart(ctx.getContext("2d"), {
    type: 'bar',
    data: {
      labels: ['Pekerja Patuh (SAFE)', 'Pelanggaran (DANGER)'],
      datasets: [{
        label: 'Jumlah Log',
        data: [0, 0],
        backgroundColor: [
          'rgba(16, 185, 129, 0.85)',
          'rgba(244, 63, 94, 0.85)'
        ],
        borderColor: [
          '#10b981',
          '#f43f5e'
        ],
        borderWidth: 2,
        borderRadius: 10,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(11, 17, 32, 0.95)',
          titleColor: '#f8fafc',
          bodyColor: '#94a3b8',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
          padding: 14,
          cornerRadius: 10,
          displayColors: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: '#94a3b8',
            font: { family: 'Inter', size: 12 }
          }
        },
        x: {
          grid: { display: false },
          ticks: {
            color: '#94a3b8',
            font: { family: 'Inter', size: 13, weight: '600' }
          }
        }
      }
    }
  });
}

/* ── Violation Log ── */
async function fetchViolationLogs() {
  try {
    const resp = await fetch("/api/logs?limit=20");
    const logs = await resp.json();
    renderViolationLogs(logs);
  } catch (e) {
    console.error("Failed to fetch logs:", e);
  }
}

function renderViolationLogs(logs) {
  const container = document.getElementById("violationList");
  if (!container) return;

  // Only show non-compliant logs (violations)
  const violations = logs.filter(l => l.compliant === 0 && l.worker_detected === 1);

  if (violations.length === 0) {
    container.innerHTML = '<div class="violation-empty">&#10003; No violations found in recent logs. Workers are compliant!</div>';
    return;
  }

  const ppeItems = [
    { key: "worker_detected", label: "Worker" },
    { key: "helmet",         label: "Helmet" },
    { key: "vest",           label: "Vest" },
    { key: "shoes",          label: "Shoes" },
    { key: "gloves",         label: "Gloves" },
    { key: "goggles",        label: "Goggles" },
  ];

  container.innerHTML = violations.map(log => {
    const badges = ppeItems.map(item => {
      const worn = log[item.key] === 1;
      return `<span class="ppe-badge ${worn ? 'ok' : 'fail'}">
        ${worn ? '&#10003;' : '&#10005;'} ${item.label}
      </span>`;
    }).join('');

    return `
      <div class="vlog-row">
        <div class="vlog-icon">&#128683;</div>
        <div class="vlog-info">
          <div class="vlog-time">&#128337; ${log.created_at} &nbsp;|&nbsp; Confidence: ${(log.confidence * 100).toFixed(1)}%</div>
          <div class="vlog-badges">${badges}</div>
        </div>
      </div>`;
  }).join('');
}

startBtn.addEventListener("click", startCamera);
stopBtn.addEventListener("click", stopCamera);
window.addEventListener("beforeunload", stopCamera);

const refreshLogsBtn = document.getElementById("refreshLogsBtn");
if (refreshLogsBtn) {
  refreshLogsBtn.addEventListener("click", fetchViolationLogs);
}

loadSettings().then(() => {
  initChart();
  refreshSummary();
  fetchViolationLogs();
});

// Auto-refresh violation log every 15 seconds
setInterval(() => {
  refreshSummary();
  fetchViolationLogs();
}, 15000);