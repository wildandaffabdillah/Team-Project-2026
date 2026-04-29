const video = document.getElementById("webcam");
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

const CAPTURE_INTERVAL = window.SAFESIGHT_CONFIG?.captureInterval || 1800;

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

function formatBoolean(value) {
  return value ? '<span class="ok">Yes</span>' : '<span class="no">No</span>';
}

async function startCamera() {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720, facingMode: "user" },
      audio: false,
    });

    video.srcObject = mediaStream;
    overlay.textContent = "Camera aktif. Monitoring sedang berjalan...";
    setTimeout(() => {
      overlay.style.display = "none";
    }, 1200);

    if (captureTimer) {
      clearInterval(captureTimer);
    }

    captureTimer = setInterval(captureAndAnalyze, CAPTURE_INTERVAL);
    await refreshSummary();
  } catch (error) {
    overlay.style.display = "grid";
    overlay.textContent = "Gagal mengakses webcam. Pastikan izin kamera sudah diberikan.";
    console.error(error);
  }
}

function stopCamera() {
  if (captureTimer) {
    clearInterval(captureTimer);
    captureTimer = null;
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }

  video.srcObject = null;
  overlay.style.display = "grid";
  overlay.innerHTML = 'Klik <strong>Start Camera</strong> untuk memulai monitoring.';
}

async function captureAndAnalyze() {
  if (!video.videoWidth || !video.videoHeight) {
    return;
  }

  const ctx = canvas.getContext("2d");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const frame = canvas.toDataURL("image/jpeg", 0.82);

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frame }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Gagal menganalisis frame.");
    }

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
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { 
          beginAtZero: true,
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#9cb0d1', stepSize: 1 }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#9cb0d1', font: { weight: 'bold' } }
        }
      }
    }
  });
}

initChart();



startBtn.addEventListener("click", startCamera);
stopBtn.addEventListener("click", stopCamera);
window.addEventListener("beforeunload", stopCamera);
refreshSummary();