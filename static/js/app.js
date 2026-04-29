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
      alert("Gagal menyimpan pengaturan.");
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
      if (!currentConfig.camera_url) throw new Error("URL CCTV Kosong!");
      
      ipcamView.src = currentConfig.camera_url;
      overlay.textContent = "Menghubungkan ke IP Camera...";
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
    if (!response.ok) throw new Error(data.error || "Gagal menganalisis frame.");

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
  setCompliance(result.compliant);

  confidenceText.textContent = Number(result.confidence).toFixed(3);
  systemModeText.textContent = "AI Live Processing Engine Aktif";

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
        label: 'Frekuensi Log',
        data: [0, 0],
        backgroundColor: [
          'rgba(37, 211, 155, 0.4)',
          'rgba(255, 100, 127, 0.4)'
        ],
        borderColor: [
          'rgba(37, 211, 155, 1)',
          'rgba(255, 100, 127, 1)'
        ],
        borderWidth: 2,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9cb0d1', stepSize: 1 } },
        x: { grid: { display: false }, ticks: { color: '#9cb0d1', font: { weight: 'bold' } } }
      }
    }
  });
}

startBtn.addEventListener("click", startCamera);
stopBtn.addEventListener("click", stopCamera);
window.addEventListener("beforeunload", stopCamera);

loadSettings().then(() => {
  initChart();
  refreshSummary();
});