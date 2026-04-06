const storageKey = "ytsum:last-analysis";

function byId(id) {
  return document.getElementById(id);
}

function saveAnalysis(data) {
  localStorage.setItem(storageKey, JSON.stringify(data));
}

function loadAnalysis() {
  const raw = localStorage.getItem(storageKey);
  return raw ? JSON.parse(raw) : null;
}

function markActiveNav() {
  const current = window.location.pathname;
  document.querySelectorAll(".nav a").forEach((a) => {
    if (a.getAttribute("href") === current) {
      a.classList.add("active");
    }
  });
}

async function processVideo(event) {
  event.preventDefault();
  const payload = {
    video_url: byId("videoUrl").value.trim(),
    summary_type: byId("summaryType").value,
    summary_length: Number(byId("summaryLength").value || 4),
    summary_model: byId("summaryModel").value,
    translation_language: byId("translationLanguage").value || null,
    tts_language: byId("ttsLanguage").value || null,
  };

  if (!payload.video_url) {
    byId("formStatus").textContent = "Please enter a YouTube URL.";
    return;
  }

  const button = event.target.querySelector("button[type='submit']");
  button.disabled = true;
  byId("formStatus").textContent = "Processing... this may take a minute. Do not close this tab.";

  try {
    const response = await fetch("/api/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) {
      let errorMsg = "Failed to process video";
      if (typeof result.detail === 'string') {
        errorMsg = result.detail;
      } else if (typeof result.detail === 'object' && result.detail.message) {
        errorMsg = result.detail.message;
      } else if (typeof result.detail === 'object') {
        errorMsg = JSON.stringify(result.detail);
      }
      throw new Error(errorMsg);
    }

    saveAnalysis(result);
    window.location.href = "/transcript";
  } catch (error) {
    button.disabled = false;
    const errorMsg = error instanceof Error ? error.message : String(error);
    byId("formStatus").innerHTML = `Error: <span style="color: #d32f2f;">${errorMsg}</span>`;
    console.error("Processing error:", error);
  }
}

function renderProcessingPage() {
  const pending = localStorage.getItem("ytsum:pending") === "1";
  const error = localStorage.getItem("ytsum:error");
  const result = loadAnalysis();
  const steps = document.querySelectorAll(".progress-step");

  if (error) {
    byId("processingStatus").textContent = `Error: ${error}`;
    localStorage.removeItem("ytsum:error");
    return;
  }

  if (pending) {
    byId("processingStatus").textContent = "Request in progress. Keep this tab open.";
    steps.forEach((step, i) => {
      if (i < 3) {
        step.classList.add("active");
      }
    });
    return;
  }

  if (result) {
    byId("processingStatus").textContent = "Pipeline complete. Continue to transcript page.";
    steps.forEach((step) => step.classList.add("active"));
  }
}

function renderTranscriptPage() {
  const data = loadAnalysis();
  if (!data) {
    byId("transcriptText").value = "No transcript available. Process a video first.";
    return;
  }

  byId("videoTitle").textContent = data.title;
  byId("transcriptText").value = data.cleaned_transcript;

  byId("searchInput").addEventListener("input", (event) => {
    const q = event.target.value.toLowerCase();
    const lines = data.cleaned_transcript.split(/(?<=[.!?])\s+/);
    const matched = lines.filter((line) => line.toLowerCase().includes(q));
    byId("transcriptText").value = q ? matched.join(" ") : data.cleaned_transcript;
  });

  byId("downloadTranscript").addEventListener("click", () => {
    downloadText("transcript.txt", data.cleaned_transcript);
  });
}

function renderSummaryPage() {
  const data = loadAnalysis();
  if (!data) return;
  byId("summaryText").value = data.summary;
  byId("summaryMeta").textContent = `Type: ${data.analytics.summary_words} words | Compression: ${data.analytics.compression_ratio}%`;
  byId("downloadSummary").addEventListener("click", () => {
    downloadText("summary.txt", data.summary);
  });
}

function renderTranslationPage() {
  const data = loadAnalysis();
  if (!data) return;
  byId("translatedText").value = data.translated_summary || "No translation was requested for this run.";
}

function renderAudioPage() {
  const data = loadAnalysis();
  if (!data) return;
  const player = byId("audioPlayer");
  if (data.tts_audio_url) {
    player.src = data.tts_audio_url;
    byId("audioDownload").href = data.tts_audio_url;
  }
}

function renderAnalyticsPage() {
  const data = loadAnalysis();
  if (!data) return;
  byId("durationKpi").textContent = `${data.analytics.duration_seconds}s`;
  byId("transcriptKpi").textContent = data.analytics.transcript_words;
  byId("summaryKpi").textContent = data.analytics.summary_words;
  byId("compressionKpi").textContent = `${data.analytics.compression_ratio}%`;

  byId("keywords").innerHTML = data.keywords.map((k) => `<span class="chip">${k}</span>`).join("");
  byId("topics").innerHTML = data.topics.map((t) => `<span class="chip">${t}</span>`).join("");

  const list = byId("timestamps");
  list.innerHTML = data.timestamps
    .slice(0, 12)
    .map((item) => `<li><strong>${item.start}s</strong> ${item.text}</li>`)
    .join("");
}

async function renderHistoryPage() {
  const response = await fetch("/api/history");
  const rows = await response.json();
  const body = byId("historyRows");
  body.innerHTML = rows
    .map(
      (row) => `
      <tr>
        <td>${row.id}</td>
        <td>${row.title}</td>
        <td>${row.summary_type}</td>
        <td>${row.translation_language || "-"}</td>
        <td>${new Date(row.created_at).toLocaleString()}</td>
        <td><button data-id="${row.id}" class="secondary">Load</button></td>
      </tr>`,
    )
    .join("");

  body.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      const itemRes = await fetch(`/api/history/${id}`);
      const item = await itemRes.json();
      saveAnalysis({
        id: item.id,
        title: item.title,
        transcript: item.transcript,
        cleaned_transcript: item.transcript,
        summary: item.summary,
        translated_summary: item.translated_summary,
        tts_audio_url: item.tts_audio_url,
        analytics: item.analytics,
        keywords: item.keywords,
        topics: item.topics,
        timestamps: [],
      });
      window.location.href = "/transcript";
    });
  });
}

async function renderSettingsPage() {
  const res = await fetch("/api/settings");
  const settings = await res.json();

  byId("asrModel").value = settings.asr_model;
  byId("abstractiveModel").value = settings.abstractive_model;
  byId("translationModel").value = settings.translation_model;
  byId("enableTransformers").checked = settings.enable_transformers;

  byId("settingsForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      asr_model: byId("asrModel").value,
      abstractive_model: byId("abstractiveModel").value,
      translation_model: byId("translationModel").value,
      enable_transformers: byId("enableTransformers").checked,
    };

    const update = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (update.ok) {
      byId("settingsStatus").textContent = "Settings saved.";
    } else {
      byId("settingsStatus").textContent = "Failed to save settings.";
    }
  });
}

async function askQuestion(event) {
  event.preventDefault();
  const data = loadAnalysis();
  if (!data) return;

  const question = byId("qaQuestion").value.trim();
  if (!question) return;

  const response = await fetch("/api/qa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ analysis_id: data.id, question }),
  });

  const result = await response.json();
  byId("qaAnswer").value = result.answer || "No answer generated.";
}

function downloadText(name, content) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

document.addEventListener("DOMContentLoaded", () => {
  markActiveNav();
});
