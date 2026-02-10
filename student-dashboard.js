// ---------- GLOBAL ELEMENTS ----------
const navButtons = document.querySelectorAll(".nav .nav-item");
const sections = document.querySelectorAll(".section");
const hamburger = document.getElementById("hamburger");
const sidebar = document.getElementById("sidebar");
const logoutBtn = document.getElementById("logoutBtn");
const displayNameTop = document.getElementById("Username");
const topAvatar = document.getElementById("topAvatar");
const greetName = document.getElementById("greetName");
// ---------- SMARTLEARN AI ELEMENTS ----------
const askAiBtn = document.getElementById("askAiBtn");
const askAiPanel = document.getElementById("askAiPanel");
const closeAskAi = document.getElementById("closeAskAi");
const aiInput = document.getElementById("aiInput");
const aiSend = document.getElementById("aiSend");
const aiChatBox = document.getElementById("aiChatBox");



const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const chatSendBtn = document.getElementById("sendChat");
const chatInput = document.getElementById("chatInput");
const chatBox = document.getElementById("chatBox");

const defaultMale = "https://via.placeholder.com/128/6B7280/fff?text=👦";
const defaultFemale = "https://via.placeholder.com/128/F59EAD/111?text=👧";

// ---------- NAVIGATION ----------
function showSection(id) {
  navButtons.forEach((btn) =>
    btn.classList.toggle("active", btn.dataset.section === id)
  );

  sections.forEach((s) => {
    s.style.display = s.id === id ? "" : "none";
    s.classList.toggle("active-section", s.id === id);
  });

  // ✅ when report tab opens
  if (id === "quizzes") {
    loadQuizzes();
    loadLearningReport();
  }

  if (window.innerWidth <= 1000) sidebar.classList.add("closed");
}

navButtons.forEach((btn) =>
  btn.addEventListener("click", () => showSection(btn.dataset.section))
);
showSection("home");

hamburger?.addEventListener("click", () => sidebar.classList.toggle("closed"));

// ---------- USER PROFILE ----------
function loadUser() {
  const username = localStorage.getItem("sl_username");
  const avatar = localStorage.getItem("sl_avatar");
  const gender = localStorage.getItem("sl_gender");

  const displayNameTop = document.getElementById("Username");
  const topAvatar = document.getElementById("topAvatar");

  if (!username) {
    displayNameTop.textContent = "Student";
    topAvatar.textContent = "S";
    return;
  }

  displayNameTop.textContent = username;

  if (avatar && avatar.trim() !== "") {
    // Show uploaded image from server
    topAvatar.style.backgroundImage = `url('${avatar}')`;
    topAvatar.style.backgroundSize = "cover";
    topAvatar.style.backgroundColor = "transparent";
    topAvatar.textContent = "";
  } else {
    // No image avatar → show first letter
    const first = username.charAt(0).toUpperCase();
    topAvatar.textContent = first;
  }
}

loadUser();
//---------Dashboard--------

// ---------- LOGOUT ----------
logoutBtn?.addEventListener("click", () => {
  localStorage.clear();
  window.location.replace("index.html");
});




// ---------- UPLOAD HANDLER ----------
if (uploadArea) {
  uploadArea.addEventListener("click", () => fileInput.click());

  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = "#6366f1";
  });

  uploadArea.addEventListener(
    "dragleave",
    () => (uploadArea.style.borderColor = "rgba(31,41,55,0.04)")
  );

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) alert(`Demo: received file "${f.name}"`);
  });

  fileInput.addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (f) alert(`Demo: selected "${f.name}"`);
  });
}





// ---------- AI PANEL ----------
// OPEN PANEL
askAiBtn?.addEventListener('click', () => {
  askAiPanel.classList.add('open');
  askAiPanel.setAttribute('aria-hidden', 'false');

  aiChatBox.innerHTML =
    `<div class="msg ai">🤖 Hi! Ask me anything to get started.</div>`;

  aiInput.value = "";
});

// close PANEL
closeAskAi?.addEventListener("click", () => {

  askAiPanel.classList.remove("open");
  askAiPanel.setAttribute("aria-hidden", "true");

  aiChatBox.innerHTML =
    `<div class="msg ai">🤖 Hi! Ask me anything to get started.</div>`;

  aiInput.value = "";
});





// ==============================
// ADD MESSAGE (Professional UI)
// ==============================
function addMessage(sender, text) {

  const div = document.createElement('div');
  div.className = `msg ${sender}`;

  if (sender === "user") {

    div.textContent = `You: ${text}`;

  } else {

    let formattedText = text;

    // Fix numbered list formatting
    formattedText = formattedText.replace(/(\d+\.)/g, "\n\n$1 ");

    const html = marked.parse(formattedText);

    div.innerHTML = `🤖 <div class="ai-content">${html}</div>`;
  }

  aiChatBox.appendChild(div);
  aiChatBox.scrollTop = aiChatBox.scrollHeight;
}





// ==============================
// CALL BACKEND
// ==============================
async function callSmartLearn(prompt) {

  try {

    const res = await fetch('http://localhost:5000/api/ai/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();

    return data.reply || 'No response';

  } catch {

    return '❌ AI Server Error';

  }
}


// ==============================
// SEND MESSAGE
// ==============================
aiSend?.addEventListener('click', async () => {

  const text = aiInput.value.trim();
  if (!text) return;

  aiInput.value = '';

  addMessage('user', text);

  // Professional thinking bubble
  const thinking = document.createElement('div');
  thinking.className = "msg ai";
  thinking.innerHTML = "🤖 <i>Thinking...</i>";
  aiChatBox.appendChild(thinking);

  const reply = await callSmartLearn(text);

  thinking.remove();

  addMessage('ai', reply);

});


// ==============================
// ENTER KEY SEND
// ==============================
aiInput?.addEventListener('keydown', e => {

  if (e.key === 'Enter') aiSend.click();

});


// ---------- YT VIDEO LOGIC (CLEAN & FINAL) ----------

// elements (DECLARE ONCE)
const ytSearchBtn = document.getElementById("ytSearchBtn");
const ytSearchInput = document.getElementById("ytSearchInput");
const videoGrid = document.getElementById("videoGrid");
const ytTabs = document.querySelectorAll(".video-tabs .tab");

let teacherVideosCache =[]
let currentSource = "teacher";
async function loadTeacherVideos() {
  try {
    videoGrid.innerHTML = "<p class='muted'>Loading teacher videos...</p>";

    const res = await fetch("http://127.0.0.1:5000/api/teacher/student", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("sl_token"),
      },
    });

    const videos = await res.json();
    teacherVideosCache = videos; // ✅ CACHE HERE

    videoGrid.innerHTML = "";

    if (!videos.length) {
      videoGrid.innerHTML =
        "<p class='muted'>No teacher videos available</p>";
      return;
    }

    videos.forEach(v => {
      const videoId = extractVideoId(v.youtubeUrl);

      videoGrid.innerHTML += `
        <div class="video-card">
          <iframe 
            src="https://www.youtube.com/embed/${videoId}" 
            allowfullscreen>
          </iframe>
          <h4>${v.title}</h4>
          <p>👨‍🏫 ${v.teacherId?.username || "Faculty"}</p>
        </div>
      `;
    });

  } catch (err) {
    console.error(err);
    videoGrid.innerHTML =
      "<p class='muted'>Failed to load teacher videos</p>";
  }
}

function extractVideoId(url) {
  if (!url) return "";

  // Handle full YouTube URL
  const regExp =
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

  const match = url.match(regExp);
  return match ? match[1] : "";
}

loadTeacherVideos();


// ---- Tab Switching ----
ytTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    ytTabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    currentSource = tab.dataset.source;

    if (currentSource === "teacher") {
      loadTeacherVideos();
    } else {
      videoGrid.innerHTML =
        "<p class='muted'>Search a topic to explore YouTube videos</p>";
    }
  });
});
function searchTeacherVideos(query) {
  const filtered = teacherVideosCache.filter(v =>
    v.title.toLowerCase().includes(query.toLowerCase())
  );

  videoGrid.innerHTML = "";

  if (!filtered.length) {
    videoGrid.innerHTML =
      "<p class='muted'>No matching teacher videos found</p>";
    return;
  }

  filtered.forEach(v => {
    const videoId = extractVideoId(v.youtubeUrl);

    videoGrid.innerHTML += `
      <div class="video-card">
        <iframe 
          src="https://www.youtube.com/embed/${videoId}" 
          allowfullscreen>
        </iframe>
        <h4>${v.title}</h4>
        <p>👨‍🏫 ${v.teacherId?.username || "Faculty"}</p>
      </div>
    `;
  });
}

// ---- YouTube Search (Backend API) ----
ytSearchBtn?.addEventListener("click", async () => {
  const query = ytSearchInput.value.trim();
  if (!query) return alert("Enter a topic");

  // ✅ Teacher Videos Search
  if (currentSource === "teacher") {
    searchTeacherVideos(query);
    return;
  }

  // ✅ YouTube Search
  videoGrid.innerHTML = "🔍 Searching videos...";

  try {
    const res = await fetch(
      `http://localhost:5000/api/youtube/search?q=${encodeURIComponent(query)}`
    );
    const videos = await res.json();

    videoGrid.innerHTML = videos.map(v => `
      <div class="video-card">
        <iframe 
          src="https://www.youtube.com/embed/${v.videoId}" 
          allowfullscreen>
        </iframe>
        <h4>${v.title}</h4>
        <p>${v.channel}</p>
      </div>
    `).join("");
  } catch (err) {
    console.error(err);
    videoGrid.innerHTML = "❌ Failed to load videos";
  }
});


// ======================
// 📅 STUDY PLANNER (FINAL WORKING)
// ======================

const API_BASE = "http://localhost:5000/api/planner";
const token = localStorage.getItem("sl_token");
let editTaskId = null;

// ----------------------
// AUTH HEADERS
// ----------------------
function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// ======================
// 🌙 DARK MODE
// ======================
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("toggleDarkMode");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      localStorage.setItem(
        "sl_dark",
        document.body.classList.contains("dark")
      );
    });
  }

  if (localStorage.getItem("sl_dark") === "true") {
    document.body.classList.add("dark");
  }

  document.getElementById("editTaskModal")?.classList.add("hidden");
});

// ======================
// 📌 DASHBOARD UPCOMING
// ======================
async function loadDashboardUpcoming() {
  if (!token) return;

  const res = await fetch(`${API_BASE}/my-tasks`, {
    headers: authHeaders(),
  });
  const { tasks } = await res.json();

  const list = document.getElementById("dashboardUpcomingTasks");
  if (!list) return;

  list.innerHTML = "";

  tasks
    .filter(t => t.status === "pending")
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3)
    .forEach(t => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${t.title}</strong><div class="due">📅 ${t.date}</div>`;
      list.appendChild(li);
    });
}

// ======================
// 📋 LOAD PLANNER
// ======================
async function loadPlanner() {
  if (!token) return;

  const res = await fetch(`${API_BASE}/my-tasks`, {
    headers: authHeaders(),
  });
  const { tasks } = await res.json();

  const todayList = document.getElementById("plannerTodayTasks");
  const upcomingList = document.getElementById("plannerUpcomingTasks");

  todayList.innerHTML = "";
  upcomingList.innerHTML = "";

  const todayDate = new Date().toLocaleDateString("en-CA");


  tasks.forEach(task => {
    const li = document.createElement("li");
    li.className = "task-item";

    li.innerHTML = `
      <div>
        <strong>${task.subject}</strong> — ${task.title}
        <div class="meta">🕒 ${task.time} | 📅 ${task.date}</div>
        <span class="priority ${task.priority || "medium"}">
          ${task.priority || "medium"}
        </span>
      </div>
      <div class="actions">
        ${
          task.status !== "completed"
            ? `<button onclick="completeTask('${task._id}')">✔</button>`
            : "✅"
        }
        <button onclick="openEdit('${task._id}')"></button>
        <button onclick="deleteTask('${task._id}')">❌</button>
      </div>
    `;

    task.date === todayDate
      ? todayList.appendChild(li)
      : upcomingList.appendChild(li);
  });
}

// ======================
// ➕ ADD TASK (FIXED + RESET FORM)
// ======================
document.getElementById("saveTask")?.addEventListener("click", async () => {
  const subjectEl = document.getElementById("subject");
  const titleEl = document.getElementById("title");
  const priorityEl = document.getElementById("priority");
  const dateEl = document.getElementById("date");
  const timeEl = document.getElementById("time");

  await fetch(`${API_BASE}/add`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      subject: subjectEl.value,
      title: titleEl.value,
      priority: priorityEl.value,
      date: dateEl.value,
      time: timeEl.value,
    }),
  });

  // ✅ RESET FORM
  subjectEl.value = "";
  titleEl.value = "";
  priorityEl.value = "medium";
  dateEl.value = "";
  timeEl.value = "";

  loadPlanner();
  loadDashboardUpcoming();
});


// ======================
// ✏️ OPEN EDIT
// ======================
async function openEdit(taskId) {
  editTaskId = taskId;

  const res = await fetch(`${API_BASE}/my-tasks`, {
    headers: authHeaders(),
  });
  const { tasks } = await res.json();

  const task = tasks.find(t => t._id === taskId);
  if (!task) return;

  editSubject.value = task.subject;
  editTitle.value = task.title;
  editPriority.value = task.priority || "medium";
  editDate.value = task.date;
  editTime.value = task.time;

  editTaskModal.classList.remove("hidden");
}

// ======================
// 🔄 UPDATE TASK
// ======================
updateTaskBtn?.addEventListener("click", async () => {
  await fetch(`${API_BASE}/${editTaskId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({
      subject: editSubject.value,
      title: editTitle.value,
      priority: editPriority.value,
      date: editDate.value,
      time: editTime.value,
    }),
  });

  editTaskModal.classList.add("hidden");
  editTaskId = null;
  loadPlanner();
  loadDashboardUpcoming();
});

// ======================
// ❌ CANCEL EDIT
// ======================
closeEditModal?.addEventListener("click", () => {
  editTaskModal.classList.add("hidden");
  editTaskId = null;
});

// ======================
// ✔ COMPLETE
// ======================
async function completeTask(id) {
  await fetch(`${API_BASE}/${id}/status`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status: "completed" }),
  });

  loadPlanner();
  loadDashboardUpcoming();
}

// ======================
// ❌ DELETE
// ======================
async function deleteTask(id) {
  await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  loadPlanner();
  loadDashboardUpcoming();
}


// ======================
// 🚀 INIT
// ======================
loadPlanner();
loadDashboardUpcoming();

// =====================================================
// 📢 ANNOUNCEMENTS (FINAL & SAFE)
// =====================================================
const announcementList = document.getElementById("announcementList");
const ANNOUNCE_API = "http://localhost:5000/api/announcements";
const BASE_URL = "http://localhost:5000";

async function loadAnnouncements() {
  if (!announcementList) return;

  try {
    const res = await fetch(ANNOUNCE_API, {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("sl_token"),
      },
    });

    if (!res.ok) throw new Error("Failed to fetch announcements");

    const announcements = await res.json();
    announcementList.innerHTML = "";

    if (!announcements.length) {
      announcementList.innerHTML = "<p class='muted'>No announcements</p>";
      return;
    }

    announcements.forEach(a => {
      const card = document.createElement("div");
      card.className = "announcement-card";

      const attachmentURL = a.attachment
        ? a.attachment.startsWith("http")
          ? a.attachment
          : BASE_URL + a.attachment
        : null;

      card.innerHTML = `
        <p>${a.message}</p>
        ${
          attachmentURL
            ? `<a href="${attachmentURL}" target="_blank" rel="noopener noreferrer" class="attachment">
                📎 View Attachment
               </a>`
            : ""
        }
        <span class="announcement-meta">
          ${new Date(a.createdAt).toLocaleString()}
        </span>
      `;

      announcementList.appendChild(card);
    });
  } catch (e) {
    console.error("Announcement error:", e);
    announcementList.innerHTML = "<p class='muted'>Failed to load</p>";
  }
}

loadAnnouncements();
setInterval(loadAnnouncements, 60000);

const submitBtn = document.getElementById("submitDoubt");
const doubtInput = document.getElementById("doubtInput");

submitBtn.addEventListener("click", async () => {
  const question = doubtInput.value.trim();
  if (!question) return alert("Please enter a doubt");

  try {
    await fetch("http://localhost:5000/api/doubts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("sl_token")}`,
      },
      body: JSON.stringify({ question }),
    });

    doubtInput.value = "";
    loadMyDoubts();
  } catch (err) {
    console.error(err);
  }
});

async function loadMyDoubts() {
  const container = document.getElementById("myDoubts");
  if (!container) return;

  const res = await fetch("http://localhost:5000/api/doubts/my", {
    headers: {
      Authorization: "Bearer " + localStorage.getItem("sl_token"),
    },
  });

  const doubts = await res.json();
  container.innerHTML = "";

  if (!Array.isArray(doubts)) return;

  doubts.forEach(d => {
    container.innerHTML += `
      <div class="doubt-card ${d.status === "pending" ? "pending" : ""}">
        <p class="question"><strong>Q:</strong> ${d.question}</p>

        <button class="delete-doubt" onclick="deleteDoubt('${d._id}')">🗑</button>

        ${
          d.answer
            ? `<div class="reply">
                <span class="teacher">👨‍🏫 ${d.answeredBy?.username || "Teacher"}</span>
                <p>${d.answer}</p>
              </div>`
            : `<span class="waiting">⏳ Waiting for teacher reply...</span>`
        }
      </div>
    `;
  });
}

loadMyDoubts();

async function deleteDoubt(id) {
  if (!confirm("Delete this doubt?")) return;

  const res = await fetch(`http://localhost:5000/api/doubts/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("sl_token"),
    },
  });

  if (res.ok) loadMyDoubts();
}

// ===============================
// 📝 NOTES CONFIG (ONLY NOTES)
// ===============================
const NOTES_API_BASE = "http://localhost:5000/api/notes";

const notesToken = localStorage.getItem("sl_token");

// ===============================
// LOAD NOTES ON PAGE LOAD
// ===============================
document.addEventListener("DOMContentLoaded", loadNotes);

async function loadNotes() {
  try {
    const res = await fetch(`${NOTES_API_BASE}/my`, {
      headers: {
        Authorization: `Bearer ${notesToken}`,
      },
    });

    if (!res.ok) throw new Error("Failed to load notes");

    const notes = await res.json();
    renderNotes(notes);
  } catch (err) {
    console.error("Notes load error:", err);
  }
}


// ===============================
// RENDER NOTES
// ===============================
function renderNotes(notes) {
  const list = document.getElementById("notesList");
  list.innerHTML = "";

  if (!notes.length) {
    list.innerHTML = "<li class='muted'>No notes uploaded yet</li>";
    return;
  }

  // 🔹 Group by subject
  const grouped = {};
  notes.forEach(n => {
    grouped[n.subject] = grouped[n.subject] || [];
    grouped[n.subject].push(n);
  });

  Object.keys(grouped).forEach(subject => {
    list.innerHTML += `<li class="subject-title">📁 ${subject}</li>`;

    grouped[subject].forEach(note => {
      list.innerHTML += `
        <li class="note-item">
          <span><strong>${note.title}</strong></span>
          <span class="note-actions">
            <a href="http://localhost:5000/${note.fileUrl}" target="_blank">View</a>
            <button onclick="editNote('${note._id}')">✏️</button>
            <button onclick="deleteNote('${note._id}')">🗑</button>
          </span>
        </li>
      `;
    });
  });
}


// ===============================
// SEARCH NOTES
// ===============================
// ===============================
// SEARCH NOTES (FIXED ✅)
// ===============================
const searchNotesInput = document.getElementById("searchNotes");

if (searchNotesInput) {
  let t;

  searchNotesInput.addEventListener("input", () => {
    clearTimeout(t);

    t = setTimeout(async () => {
      const q = searchNotesInput.value.trim();

      // empty -> reload all notes
      if (!q) return loadNotes();

      try {
        const res = await fetch(
          `${NOTES_API_BASE}/search?q=${encodeURIComponent(q)}`,
          {
            headers: {
              Authorization: `Bearer ${notesToken}`,
            },
          }
        );

        // Some APIs return [] directly, some return {notes: []}
        const data = await res.json();
        const notes = Array.isArray(data) ? data : (data.notes || []);

        renderNotes(notes);
      } catch (err) {
        console.error("Search notes error:", err);
      }
    }, 300); // debounce
  });
}




// ===============================
// UPLOAD MODAL
// ===============================
function openUploadModal() {
  document.getElementById("uploadModal").style.display = "flex";
}

function closeUploadModal() {
  document.getElementById("uploadModal").style.display = "none";
}

// ===============================
// UPLOAD NOTE
// ===============================
async function uploadNote() {
  const fd = new FormData();
  fd.append("title", noteTitle.value);
  fd.append("subject", noteSubject.value);
  fd.append("file", noteFile.files[0]);

  await fetch(`${NOTES_API_BASE}/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${notesToken}`,
    },
    body: fd,
  });

  closeUploadModal();
  loadNotes();
}


// ===============================
// DELETE NOTE
// ===============================
async function deleteNote(id) {
  if (!confirm("Delete this note?")) return;

  await fetch(`${NOTES_API_BASE}/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${notesToken}`,
    },
  });

  loadNotes();
}

async function editNote(id) {
  const newTitle = prompt("Edit note title:");
  const newSubject = prompt("Edit subject:");

  if (!newTitle || !newSubject) return;

  await fetch(`${NOTES_API_BASE}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${notesToken}`,
    },
    body: JSON.stringify({
      title: newTitle,
      subject: newSubject,
    }),
  });

  loadNotes();
}

// ===============================
// Quiz Model
// ===============================

let currentQuiz = null;
let currentQuizId = null;


function openQuizModal() {
  document.getElementById("aiQuizModal").style.display = "flex";
}

function closeQuizModal() {
  document.getElementById("aiQuizModal").style.display = "none";
}

async function generateAiQuiz() {
  const topic = document.getElementById("quizTopic").value.trim();
  const difficulty = document.getElementById("quizDifficulty").value;
  const numQuestions = document.getElementById("quizCount").value;
  const type = document.getElementById("quizType").value;

  if (!topic) {
    alert("Please enter a topic");
    return;
  }

  const res = await fetch("http://localhost:5000/api/quiz/generate-ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("sl_token")}`
    },
    body: JSON.stringify({
      topic,
      difficulty,
      numQuestions,
      type
    })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.message || "AI quiz generation failed");
    return;
  }

  console.log("AI Quiz:", data.quiz);

  closeQuizModal();
  alert("✅ AI Quiz Generated Successfully!");
  loadQuizzes(); // 🔥 THIS IS WHAT YOU MISSED

}
async function loadQuizzes() {
  const res = await fetch("http://localhost:5000/api/quiz", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("sl_token")}`
    }
  });

  const data = await res.json();
  renderQuizzes(data.quizzes);
}


async function startQuiz(quizId) {
  const res = await fetch(`http://localhost:5000/api/quiz/${quizId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("sl_token")}`
    }
  });

  const data = await res.json();

  currentQuiz = data.quiz;        // ✅ SAVE QUIZ GLOBALLY
  currentQuizId = data.quiz._id;

  document.getElementById("quizTitle").innerText = currentQuiz.title;
  
  const pdfTopic = document.getElementById("pdfTopic");
  if (pdfTopic) {
    pdfTopic.innerText = currentQuiz.title;
  }


  const form = document.getElementById("quizForm");
  form.innerHTML = "";

  currentQuiz.questions.forEach((q, index) => {
    const div = document.createElement("div");
    let html = `<p class="quiz-question"><b>Q${index + 1}. ${q.q}</b></p>`;


    if (q.type === "MCQ" || q.type === "TRUE_FALSE") {
      html += q.options
        .map(
          (opt, i) => `
          <label>
            <input type="radio" name="q${index}" value="${i}" required />
            ${opt}
          </label><br/>
        `,
        )
        .join("");
    }

    // ⭐ SHORT MODE = READ ONLY (NO TEXTAREA)
  if (q.type === "SHORT") {

    html += `
      <div class="short-readonly">
        📝 Short Answer Question (Study Mode)
      </div>
    `;

  }


    html += `<hr/>`;
    div.innerHTML = html;
    form.appendChild(div);
  });

  document.getElementById("quizPlayer").style.display = "block";

  const isShortQuiz = currentQuiz.questions.every(q => q.type === "SHORT");

  document.querySelector("[onclick='submitCurrentQuiz()']").style.display = isShortQuiz ? "none" : "inline-block";

}
  // 👉 here you render questions UI

async function submitQuiz(quizId, answers) {
  const res = await fetch(`http://localhost:5000/api/quiz/${quizId}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("sl_token")}`
    },
    body: JSON.stringify({ answers })
  });

  const data = await res.json();
  alert(`Score: ${data.score}\n\nAI Feedback:\n${data.aiFeedback}`);
}
async function deleteQuiz(id) {
  if (!confirm("Delete this quiz?")) return;

  await fetch(`http://localhost:5000/api/quiz/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("sl_token")}`
    }
  });

  loadQuizzes();
}

function renderQuizzes(quizzes) {
  const quizList = document.getElementById("quizList");
  quizList.innerHTML = "";

  if (!quizzes || quizzes.length === 0) {
    quizList.innerHTML = "<p>No quizzes available yet.</p>";
    return;
  }

  quizzes.forEach((quiz) => {
    const card = document.createElement("div");
    card.className = "quiz-card";

    card.innerHTML = `
  <div class="quiz-card-top">
    <h3 class="quiz-card-title">${quiz.title}</h3>
    <span class="pill">${quiz.isAiGenerated ? "🤖 AI Generated" : "✍️ Manual"}</span>
  </div>

  <div class="quiz-meta">
    <span class="pill gray">🧾 Questions: ${quiz.questions.length}</span>
  </div>

  <div class="quiz-actions">
    <button class="btn btn-primary" onclick="startQuiz('${quiz._id}')">Start Quiz</button>
    <button class="btn btn-danger" onclick="deleteQuiz('${quiz._id}')">Delete</button>
  </div>
`;

    quizList.appendChild(card);
  });
}
// ===============================
// ✅ SUBMIT CURRENT QUIZ (MISSING FIX)
// ===============================
function submitCurrentQuiz() {

  if (!currentQuiz) {
    alert("Quiz not loaded");
    return;
  }

  const isShortQuiz = currentQuiz.questions.every(q => q.type === "SHORT");

  // ⭐ BLOCK submission
  if (isShortQuiz) {
    alert("Short Answer quizzes are read-only.");
    return;
  }

  const answers = [];

  currentQuiz.questions.forEach((q, index) => {

    const selected = document.querySelector(
      `input[name="q${index}"]:checked`
    );

    if (!selected) {
      alert("Please answer all questions");
      throw new Error("Incomplete quiz");
    }

    answers.push(Number(selected.value));

  });

  submitQuiz(currentQuizId, answers);
}

function closeQuizPlayer() {
  document.getElementById("quizPlayer").style.display = "none";

  const quizList = document.getElementById("quizList");
  quizList.style.display = "grid";   // ✅ IMPORTANT (not block)
}

async function downloadPDF() {
  if (!currentQuiz) {
    alert("Quiz not loaded");
    return;
  }

  const pdfContainer = document.getElementById("pdfContainer");
  const pdfTopic = document.getElementById("pdfTopic");
  const pdfQuizContent = document.getElementById("pdfQuizContent");

  pdfTopic.innerText = currentQuiz.title;

  let cleanHTML = "";
  currentQuiz.questions.forEach((q, index) => {
    cleanHTML += `<div class="pdf-question">
      <p><strong>Q${index + 1}. ${q.q}</strong></p>`;

    if ((q.type === "MCQ" || q.type === "TRUE_FALSE") && Array.isArray(q.options)) {
      q.options.forEach(opt => {
        cleanHTML += `<p>• ${opt}</p>`;
      });
    }

    if (q.type === "SHORT") {
      cleanHTML += `<div class="answer-line"></div><div class="answer-line"></div>`;
    }

    cleanHTML += `</div>`;
  });

  pdfQuizContent.innerHTML = cleanHTML;

  // ✅ Make it renderable for capture (not just opacity)
  pdfContainer.style.visibility = "visible";
  pdfContainer.style.opacity = "1";
  pdfContainer.style.zIndex = "9999";

  await document.fonts?.ready;
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  console.log("pdfContainer height:", pdfContainer.getBoundingClientRect().height);

  await html2pdf()
    .set({
      margin: 10,
      filename: `${currentQuiz.title}.pdf`,
      html2canvas: { scale: 2, useCORS: true, scrollY: 0, windowWidth: pdfContainer.scrollWidth },

      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] }
    })
    .from(pdfContainer)
    .save();

  // ✅ Hide again
  pdfContainer.style.opacity = "0";
  pdfContainer.style.visibility = "hidden";
  pdfContainer.style.zIndex = "-1";
}


document.addEventListener("DOMContentLoaded", loadQuizzes);

//-------------------------------------------------//
document.addEventListener("DOMContentLoaded", async () => {
  const displayName = document.getElementById("displayName");
  const email = document.getElementById("email");
  const toggleSound = document.getElementById("toggleSound");
  const saveProfile = document.getElementById("saveProfile");

  // ✅ Fetch settings
  try {
    const res = await fetch("http://localhost:5000/api/settings/me", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("sl_token")}`, // JWT
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Fetch failed");

    displayName.value = data.username || "";
    email.value = data.email || "";
    email.readOnly = true;

    toggleSound.checked = !!data.preferences?.sound;
  } catch (err) {
    console.log("Settings error:", err.message);
  }

  // ✅ Update settings
  saveProfile.addEventListener("click", async () => {
    try {
      const payload = {
        username: displayName.value.trim(),
        preferences: {
          sound: toggleSound.checked,
        },
      };

      const res = await fetch("http://localhost:5000/api/settings/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("sl_token")}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");

      alert("✅ Profile updated successfully!");
    } catch (err) {
      alert("❌ " + err.message);
    }
  });
});
//-------------------report-----------------------------------
let performanceChart;

async function loadLearningReport() {
  const token = localStorage.getItem("sl_token");
  if (!token) return;

  await new Promise((r) => setTimeout(r, 200));

  const res = await fetch("http://localhost:5000/api/report/my", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const contentType = res.headers.get("content-type") || "";
  if (!res.ok) {
    const text = await res.text();
    console.log("REPORT API ERROR:", res.status, text);
    return;
  }
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    console.log("NOT JSON RESPONSE:", text);
    return;
  }
  const data = await res.json();

  if (!data.success) return console.log(data.message);

  // KPIs
  document.getElementById("totalQuizzes").innerText = data.kpis.totalQuizzes;
  document.getElementById("avgScore").innerText = `${data.kpis.avgScore}%`;
  document.getElementById("learningTime").innerText = data.kpis.learningTimeText;
  document.getElementById("streak").innerText = `${data.kpis.streak} days`;

  // Topic-wise performance
  const topicList = document.getElementById("topicList");
  topicList.innerHTML = "";

  if (!data.topics.length) {
    topicList.innerHTML = `<li class="muted">No topic data yet <span class="avg">—</span></li>`;
  } else {
    data.topics.slice(0, 6).forEach((t) => {
      const cls = t.avg >= 80 ? "good" : t.avg >= 65 ? "avg" : "poor";
      topicList.innerHTML += `<li>${t.subject} <span class="${cls}">${t.avg}%</span></li>`;
    });
  }

  // Strength / Weakness
  document.getElementById("strengthText").innerHTML =
    `<strong>Strength:</strong> ${data.insights.strengths.length ? data.insights.strengths.join(", ") : "—"}`;

  document.getElementById("weakText").innerHTML =
    `<strong>Needs Improvement:</strong> ${data.insights.weaknesses.length ? data.insights.weaknesses.join(", ") : "—"}`;

  // Recent activity
  const activityList = document.getElementById("activityList");
  activityList.innerHTML = "";

  if (!data.activity.length) {
    activityList.innerHTML = `<li class="muted">No recent activity</li>`;
  } else {
    data.activity.forEach((txt) => {
      activityList.innerHTML += `<li>${txt}</li>`;
    });
  }

  // Chart
  const labels = data.trend.map((x) => x.label);
  const scores = data.trend.map((x) => x.score);

  const chartEmpty = document.getElementById("chartEmpty");

  if (!labels.length) {
    chartEmpty.style.display = "block";
    if (performanceChart) performanceChart.destroy();
    return;
  } else {
    chartEmpty.style.display = "none";
  }

  const ctx = document.getElementById("performanceChart").getContext("2d");
  if (performanceChart) performanceChart.destroy();

  performanceChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{ label: "Score (%)", data: scores, tension: 0.35, fill: true }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, max: 100 } },
    },
  });
}




// ===============================
// ✅ DASHBOARD (HOME) WORKING LOADER
// ===============================

// ✅ Dashboard fixed base (do not depend on API_BASE anywhere)
const DASH_API = "http://localhost:5000/api";
const REPORT_BASE = `${DASH_API}/report`;
const PLANNER_BASE = `${DASH_API}/planner`;

const SL_TOKEN = localStorage.getItem("sl_token");

// -------------------------------
// ✅ SMALL HELPER
// -------------------------------
async function apiFetch(url) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${SL_TOKEN}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "API failed");
  return data;
}

// -------------------------------
// 1) LOAD REPORT DATA -> /api/report/my
// -------------------------------
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value;
}

async function loadHomeReport() {
  const data = await apiFetch(`${REPORT_BASE}/my`);

  setText("statQuizzes", data.kpis?.totalQuizzes ?? 0);
  setText("statAvg", (data.kpis?.avgScore ?? 0) + "%");
  setText("statTime", data.kpis?.learningTimeText ?? "0m");
  setText("statStreak", data.kpis?.streak ?? 0);

  const ul = document.getElementById("recentActivity");
  if (ul) {
    ul.innerHTML = "";
    const activity = data.activity || [];
    ul.innerHTML = activity.length
      ? activity.map((t) => `<li>${t}</li>`).join("")
      : `<li class="muted">No recent activity</li>`;
  }

  if (data.trend?.length) updateHomeChart(data.trend);
}

// -------------------------------
// 2) LOAD TASKS -> /api/planner/my-tasks
// -------------------------------
async function loadHomeTasks() {
  const data = await apiFetch(`${PLANNER_BASE}/my-tasks`);

  const ul = document.getElementById("dashboardUpcomingTasks");
  if (!ul) return;

  ul.innerHTML = "";

  const tasks = data.tasks || [];
  if (!tasks.length) {
    ul.innerHTML = `<li class="muted">No upcoming tasks</li>`;
    return;
  }

  tasks.slice(0, 5).forEach((t) => {
    ul.innerHTML += `
      <li>
        <div>
          <div class="task-title">${t.title || "Task"}</div>
          <div class="task-meta">
            ${(t.subject || "General")} • ${(t.date || "")} ${(t.time || "")}
          </div>
        </div>
        <div class="task-pill">${(t.priority || "medium").toUpperCase()}</div>
      </li>
    `;
  });
}

// -------------------------------
// 3) CHART (Chart.js)
// -------------------------------
let homeChart;
function updateHomeChart(trend) {
  const canvas = document.getElementById("homeProgressChart");
  if (!canvas || typeof Chart === "undefined") return;

  const labels = trend.map((x) => x.label);
  const values = trend.map((x) => x.score);

  if (homeChart) homeChart.destroy();

  homeChart = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [{ label: "Score", data: values, tension: 0.35, fill: false }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, max: 100 } },
    },
  });
}

// -------------------------------
// 4) MAIN LOADER
// -------------------------------
async function loadHomeDashboard() {
  try {
    await Promise.all([loadHomeReport(), loadHomeTasks()]);
    console.log("✅ Dashboard loaded");
  } catch (err) {
    console.error("❌ Dashboard load failed:", err.message);
  }
}

// ✅ Load on first page open
document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector("#home.active-section")) {
    loadHomeDashboard();
  }
});

// ✅ Load when user clicks Dashboard tab
document.querySelectorAll("[data-section]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.getAttribute("data-section") === "home") {
      loadHomeDashboard();
    }
  });
});


async function setDashboardUsernameFromDB() {
  const token = localStorage.getItem("sl_token");
  if (!token) return;

  try {
    const res = await fetch("http://localhost:5000/api/settings/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch user");

    const username = data.username || "Student"; // <-- This will be "Vasu"

    // 🔹 Top greeting (already correct, but keep in sync)
    const greetName = document.getElementById("greetName");
    if (greetName) greetName.textContent = username;

    // 🔹 Purple profile card (your problem)
    const profileName = document.getElementById("profileName");
    if (profileName) profileName.textContent = username;

    // 🔹 Top right avatar name (optional)
    const topName = document.getElementById("Username");
    if (topName) topName.textContent = username;

  } catch (err) {
    console.log("Username fetch error:", err.message);
  }
}
document.addEventListener("DOMContentLoaded", () => {
  setDashboardUsernameFromDB();
});
document.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-section]");
  if (!btn) return;

  const target = btn.getAttribute("data-section");

  // ✅ Open planner section
  if (target === "planner") {
    showSection("planner");     // must match your section id="planner"
    loadPlanner?.();            // load tasks (if function exists)
    return;
  }

  
 
});




async function loadSupportEmail() {
  const link = document.getElementById("supportEmailLink");
  if (!link) return;

  // default fallback
  const fallback = "smartlearn526@gmail.com";
  link.textContent = fallback;
  link.href = `mailto:${fallback}?subject=SmartLearn Support`;

  try {
    const res = await fetch("http://localhost:5000/api/public/settings");
    if (!res.ok) return;

    const data = await res.json();
    const email = data.supportEmail || fallback;

    link.textContent = email;
    link.href = `mailto:${email}?subject=SmartLearn Support`;
  } catch (err) {
    console.error("Support email load failed:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadSupportEmail);
//------------------------------------------------------------------------------//


const MATERIALS_API = "http://localhost:5000/api/student-materials";
const FILE_BASE = "http://localhost:5000";


function normalizePath(p = "") {
  const fixed = String(p).replace(/\\/g, "/");
  return fixed.startsWith("/") ? fixed : `/${fixed}`;
}

async function loadStudentMaterials() {
  const box = document.getElementById("teacherMaterialsList");
  if (!box) return;

  box.innerHTML = "<p class='muted'>Loading materials...</p>";

  try {
    const res = await fetch(MATERIALS_API, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed");

    const materials = data.materials || [];
    if (!materials.length) {
      box.innerHTML = "<p class='muted'>No learning materials uploaded yet.</p>";
      return;
    }

    box.innerHTML = materials.map(m => {
      const url = FILE_BASE + normalizePath(m.fileUrl);

      return `
        <div class="mat-card">
          <div class="mat-main">
            <h4>${m.title}</h4>
            <p class="muted">${m.subject} • ${m.contentType}</p>
            <p class="muted">By: ${m.uploadedBy?.username || "Teacher"}</p>
          </div>
          <a class="mat-btn" href="${url}" target="_blank" download>Download</a>
        </div>
      `;
    }).join("");
  } catch (err) {
    console.error(err);
    box.innerHTML = "<p class='error'>Failed to load learning materials.</p>";
  }
}

document.addEventListener("DOMContentLoaded", loadStudentMaterials);
