(function () {
  const API_BASE = "http://127.0.0.1:5000/api/admin";
  const token = localStorage.getItem("sl_token") || "";

  // DOM elements
  const navItems = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".section");
  const searchInput = document.getElementById("searchInput");
  const roleFilter = document.getElementById("roleFilter");
  const refreshBtn = document.getElementById("refreshBtn");

  const userTableBody = document.getElementById("userTableBody");
  const approvalTableBody = document.getElementById("approvalTableBody");
  const moderationBody = document.getElementById("moderationBody");

  const statTotal = document.getElementById("statTotal");
  const statStudents = document.getElementById("statStudents");
  const statTeachers = document.getElementById("statTeachers");
  const statPending = document.getElementById("statPending");

  // modal
  const editModal = document.getElementById("editModal");
  const editId = document.getElementById("editId");
  const editUsername = document.getElementById("editUsername");
  const editEmail = document.getElementById("editEmail");
  const editRole = document.getElementById("editRole");
  const editStatus = document.getElementById("editStatus");
  const saveEdit = document.getElementById("saveEdit");
  const cancelEdit = document.getElementById("cancelEdit");

  let roleChart = null,
    approvalChart = null,
    userGrowthChart = null,
    usageChart = null;

  // navigation switch
  navItems.forEach((btn) => {
    btn.addEventListener("click", () => {
      navItems.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const id = btn.dataset.section;
      sections.forEach((s) => s.classList.remove("active-section"));
      document.getElementById(id).classList.add("active-section");
    });
  });

  // fetch wrapper
  async function authFetch(url, opts = {}) {
    opts.headers = opts.headers || {};
    opts.headers["Authorization"] = `Bearer ${token}`;
    opts.headers["Accept"] = "application/json";

    try {
      const res = await fetch(url, opts);
      if (!res.ok) {
        let msg = await res.text();
        try {
          msg = JSON.parse(msg).message;
        } catch {}
        throw new Error(msg);
      }
      if (res.status === 204) return null;
      return await res.json();
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  // load all users
  async function loadAll() {
    try {
      const users = await authFetch(`${API_BASE}/`);
      renderUsers(users || []);
      renderStats(users || []);
      renderCharts(users || []);
    } catch (e) {
      console.error(e);
      alert("Failed loading users");
    }
  }

  // render all users
  function renderUsers(users) {
    const q = (searchInput.value || "").toLowerCase();
    const role = roleFilter.value;

    const filtered = users.filter((u) => {
      if (role && u.role !== role) return false;
      if (
        q &&
        !(
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
        )
      )
        return false;
      return true;
    });

    userTableBody.innerHTML = "";
    filtered.forEach((u) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(u.username)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td>${escapeHtml(u.role)}</td>
        <td>${escapeHtml(
          u.status ||
            (u.approved ? "approved" : u.rejected ? "rejected" : "pending"),
        )}</td>
        <td>
          <button class="btn" data-id="${
            u._id
          }" data-action="edit">Edit</button>
          <button class="btn delete" data-id="${
            u._id
          }" data-action="delete">Delete</button>
        </td>
      `;
      userTableBody.appendChild(tr);
    });

    userTableBody
      .querySelectorAll("[data-action='edit']")
      .forEach((btn) =>
        btn.addEventListener("click", () => openEdit(btn.dataset.id)),
      );
    userTableBody
      .querySelectorAll("[data-action='delete']")
      .forEach((btn) =>
        btn.addEventListener("click", () => deleteUser(btn.dataset.id)),
      );
  }

  // load pending teachers only
async function loadPending() {
  try {
    const users = await authFetch(`${API_BASE}/`);
    const pending = users.filter(
      (u) =>
        u.role === "teacher" &&
        (u.status === "pending" || (!u.approved && !u.rejected)),
    );

    approvalTableBody.innerHTML = "";

    pending.forEach((t) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${escapeHtml(t.username)}</td>
        <td>${escapeHtml(t.email)}</td>
        <td>  
          ${
            t.idProof
              ? `<button class="view-link" data-file="${escapeAttr(t.idProof)}">View ID Proof</button>`
              : "No Document"
          }
        </td>
        <td>
          <button class="approve" data-id="${t._id}">Approve</button>
          <button class="reject" data-id="${t._id}">Reject</button>
        </td>
      `;

      approvalTableBody.appendChild(tr);
    });

    // ✅ View Proof
    approvalTableBody.querySelectorAll(".view-link").forEach((btn) => {
      btn.addEventListener("click", () => previewIdProof(btn.dataset.file));
    });

    // Approve / Reject
    approvalTableBody.querySelectorAll(".approve").forEach((btn) =>
      btn.addEventListener("click", () => approveTeacher(btn.dataset.id)),
    );

    approvalTableBody.querySelectorAll(".reject").forEach((btn) =>
      btn.addEventListener("click", () => rejectTeacher(btn.dataset.id)),
    );
  } catch (e) {
    console.error("ERROR: loadPending()", e);
  }
}

  // stats
  function renderStats(users) {
    statTotal.textContent = users.length;
    statStudents.textContent = users.filter((u) => u.role === "student").length;
    statTeachers.textContent = users.filter((u) => u.role === "teacher").length;
    statPending.textContent = users.filter(
      (u) =>
        u.role === "teacher" &&
        (u.status === "pending" || (!u.approved && !u.rejected)),
    ).length;
  }

  // charts
  function renderCharts(users) {
    const students = users.filter((u) => u.role === "student").length;
    const teachers = users.filter((u) => u.role === "teacher").length;
    const admins = users.filter((u) => u.role === "admin").length;

    const pending = users.filter(
      (u) => u.status === "pending" || (u.role === "teacher" && !u.approved),
    ).length;
    const approved = users.filter((u) => u.approved).length;
    const rejected = users.filter((u) => u.rejected).length;

    try {
      const ctxR = document.getElementById("roleChart").getContext("2d");
      if (roleChart) roleChart.destroy();
      roleChart = new Chart(ctxR, {
        type: "pie",
        data: {
          labels: ["Students", "Teachers", "Admins"],
          datasets: [{ data: [students, teachers, admins] }],
        },
      });
    } catch {}

    try {
      const ctxA = document.getElementById("approvalChart").getContext("2d");
      if (approvalChart) approvalChart.destroy();
      approvalChart = new Chart(ctxA, {
        type: "bar",
        data: {
          labels: ["Pending", "Approved", "Rejected"],
          datasets: [{ label: "Count", data: [pending, approved, rejected] }],
        },
      });
    } catch {}
  }

  async function approveTeacher(id) {
    const token = localStorage.getItem("sl_token");

    if (!token) {
      alert("Admin token missing! Please log in again.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/approve/${id}`, {
        method: "PUT",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (res.ok) {
        alert("Teacher approved successfully!");
        loadPending();
      } else {
        alert("Approve failed: " + data.message);
      }
    } catch (err) {
      alert("Approve failed: Server error");
    }
  }
async function rejectTeacher(id) {
  const token = localStorage.getItem("sl_token");

  if (!token) {
    alert("Admin token missing! Please log in again.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/reject/${id}`, {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    if (res.ok) {
      alert("Teacher rejected successfully!");
      loadPending();
      loadAll();
    } else {
      alert("Reject failed: " + (data.message || "Unknown error"));
    }
  } catch (err) {
    console.error(err);
    alert("Reject failed: Server error");
  }
}
async function previewIdProof(fileName) {
  const token = localStorage.getItem("sl_token");

  const res = await fetch(`${API_BASE}/id-proof/${fileName}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    alert(data.message || "Failed to load ID Proof");
    return;
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}

  // delete user
  async function deleteUser(id) {
    if (!confirm("Delete user?")) return;
    try {
      await authFetch(`${API_BASE}/${id}`, { method: "DELETE" });
      alert("User deleted");
      loadAll();
      loadPending();
    } catch (e) {
      alert("Delete failed");
      console.error(e);
    }
  }

  // open edit modal
  async function openEdit(id) {
    try {
      const u = await authFetch(`${API_BASE}/${id}`);

      editId.value = u._id;
      editUsername.value = u.username;
      editEmail.value = u.email;
      editRole.value = u.role;
      editStatus.value =
        u.status ||
        (u.approved ? "approved" : u.rejected ? "rejected" : "pending");

      editModal.classList.add("active");
    } catch (e) {
      alert("Failed loading user");
      console.error(e);
    }
  }

  saveEdit.addEventListener("click", async () => {
    const id = editId.value;

    const payload = {
      username: editUsername.value,
      email: editEmail.value,
      role: editRole.value,
      status: editStatus.value,
    };

    try {
      await authFetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      alert("User updated");
      editModal.classList.remove("active");
      loadAll();
      loadPending();
    } catch (e) {
      alert("Update failed");
      console.error(e);
    }
  });

  cancelEdit.addEventListener("click", () =>
    editModal.classList.remove("active"),
  );

  // logout
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("sl_token");
    localStorage.removeItem("sl_username");
    window.location.replace("index.html");
  });

  // helpers
  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, "%22");
  }

  // initial load
  loadAll();
  loadPending();

  // enable filters & refresh
  searchInput.addEventListener("input", loadAll);
  roleFilter.addEventListener("change", loadAll);
  refreshBtn.addEventListener("click", () => {
    searchInput.value = "";
    roleFilter.value = "";
    loadAll();
  });
})();
/*********************************
 * TEACHER LECTURES – ADMIN
 *********************************/

const lecturesSection = document.getElementById("teacher-lectures");
const lecturesGrid = document.querySelector(".lectures-grid");
const lectureSearchInput = document.querySelector(".lectures-actions input");
const statusFilter = document.querySelector(".lectures-actions select");
const refreshLecturesBtn = document.querySelector(".refresh-btn");

const ADMIN_VIDEO_API = "http://localhost:5000/api/admin/videos";
const adminToken = localStorage.getItem("sl_token");

/* -----------------------------
   Load Teacher Videos
------------------------------ */
async function loadTeacherLectures() {
  lecturesGrid.innerHTML = "⏳ Loading teacher lectures...";

  try {
    const res = await fetch(ADMIN_VIDEO_API, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    const videos = await res.json();
    renderTeacherLectures(videos);
  } catch (err) {
    console.error(err);
    lecturesGrid.innerHTML = "❌ Failed to load lectures";
  }
}

/* -----------------------------
   Render Cards
------------------------------ */
function renderTeacherLectures(videos) {
  if (!videos.length) {
    lecturesGrid.innerHTML = "🚫 No teacher lectures found";
    return;
  }

  lecturesGrid.innerHTML = videos
    .map((v) => {
      const videoId = extractVideoId(v.youtubeUrl);
      const isBlocked = v.status === "draft";

      return `
      <div class="lecture-card ${isBlocked ? "blocked" : ""}">
        <div class="video-frame">
          <iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen></iframe>
          <span class="status ${isBlocked ? "blocked" : "active"}">
            ${isBlocked ? "Blocked" : "Published"}
          </span>
        </div>

        <div class="lecture-content">
          <h3>${v.title}</h3>

          <p class="teacher-name">
            👨‍🏫 ${v.teacherId?.username || "Unknown Teacher"}
            <span>${v.teacherId?.email || ""}</span>
          </p>

          <div class="lecture-actions">
            <button class="btn edit" onclick="editLecture('${v._id}')">Edit</button>

            <button class="btn ${isBlocked ? "unblock" : "block"}"
              onclick="toggleLecture('${v._id}', ${!isBlocked})">
              ${isBlocked ? "Unblock" : "Block"}
            </button>

            <button class="btn delete" onclick="deleteLecture('${v._id}')">
              Delete
            </button>
          </div>
        </div>
      </div>
    `;
    })
    .join("");
}

/* -----------------------------
   Block / Unblock
------------------------------ */
async function toggleLecture(id, block) {
  if (
    !confirm(
      `Are you sure you want to ${block ? "block" : "unblock"} this lecture?`,
    )
  )
    return;

  try {
    await fetch(`${ADMIN_VIDEO_API}/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ block }),
    });

    loadTeacherLectures();
  } catch (err) {
    console.error(err);
    alert("❌ Failed to update lecture status");
  }
}

/* -----------------------------
   Delete Video
------------------------------ */
async function deleteLecture(id) {
  if (!confirm("⚠️ Delete this lecture permanently?")) return;

  try {
    await fetch(`${ADMIN_VIDEO_API}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    loadTeacherLectures();
  } catch (err) {
    alert("❌ Failed to delete lecture");
  }
}

/* -----------------------------
   Search + Filter
------------------------------ */
lectureSearchInput.addEventListener("input", filterLectures);
statusFilter.addEventListener("change", filterLectures);

async function filterLectures() {
  const query = lectureSearchInput.value.trim().toLowerCase();
  const status = statusFilter.value;

  try {
    const res = await fetch(ADMIN_VIDEO_API, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    let videos = await res.json();

    videos = videos.filter((v) => {
      const title = v.title?.toLowerCase() || "";
      const teacherName = v.teacherId?.username?.toLowerCase() || "";
      const teacherEmail = v.teacherId?.email?.toLowerCase() || "";

      const matchesSearch =
        title.includes(query) ||
        teacherName.includes(query) ||
        teacherEmail.includes(query);

      const matchesStatus =
        status === "All" ||
        (status === "Active" && v.status === "published") ||
        (status === "Blocked" && v.status === "draft");

      return matchesSearch && matchesStatus;
    });

    renderTeacherLectures(videos);
  } catch (err) {
    console.error("Search failed:", err);
  }
}

/* -----------------------------
   Refresh
------------------------------ */
refreshLecturesBtn.addEventListener("click", loadTeacherLectures);

/* -----------------------------
   Edit Placeholder
------------------------------ */
function editLecture(id) {
  alert("✏️ Edit lecture modal coming next");
}

/* -----------------------------
   Utils
------------------------------ */
function extractVideoId(url) {
  const reg =
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url?.match(reg);
  return match ? match[1] : "";
}
/* -----------------------------
   Auto-load Teacher Lectures when tab clicked
------------------------------ */
document
  .querySelector('[data-section="teacher-lectures"]')
  .addEventListener("click", () => {
    loadTeacherLectures();
  });

/* -----------------------------
   Auto-load when tab clicked
------------------------------ */
document
  .querySelector('[data-section="moderation"]')
  .addEventListener("click", () => {
    loadAdminAnnouncements();
  });

async function loadAdminAnnouncements() {
  try {
    const res = await fetch(
      "http://localhost:5000/api/announcements/admin/all",
      {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("sl_token"),
        },
      },
    );

    const announcements = await res.json();

    const container = document.getElementById("moderationBody");
    container.innerHTML = "";

    if (!announcements.length) {
      container.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center;">No announcements found</td>
        </tr>
      `;
      return;
    }

    announcements.forEach((a) => {
      container.innerHTML += `
        <tr>
          <td>${a.message}</td>
          <td>${a.postedBy?.username || "Deleted User"}</td>
          <td>Announcement</td>
          <td>
            <button onclick="deleteAnnouncement('${a._id}')">
              🗑 Delete
            </button>
          </td>
        </tr>
      `;
    });
  } catch (err) {
    console.error("Failed to load announcements", err);
  }
}
async function deleteAnnouncement(id) {
  if (!confirm("Delete this announcement?")) return;

  await fetch(`http://localhost:5000/api/announcements/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("sl_token"),
    },
  });

  loadAdminAnnouncements();
}

// doubts

const token = localStorage.getItem("sl_token");

if (!token) {
  alert("Admin not logged in");
  window.location.href = "/login.html";
}

async function loadDoubtAnalytics() {
  const res = await fetch("http://localhost:5000/api/admin/doubts/analytics", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  document.getElementById("totalDoubts").innerText = data.total;
  document.getElementById("pendingDoubts").innerText = data.pending;
  document.getElementById("answeredDoubts").innerText = data.answered;
}

async function loadAdminDoubts() {
  const res = await fetch("http://localhost:5000/api/admin/doubts", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    console.error("Failed to load admin doubts");
    return;
  }

  const doubts = await res.json();

  const tbody = document.getElementById("doubtAnalyticsBody");
  tbody.innerHTML = "";

  doubts.forEach((d) => {
    tbody.innerHTML += `
      <tr>
        <td>${d.student?.username || "Unknown"}</td>
        <td>${d.question}</td>
        <td>${d.isAnswered ? "Answered" : "Pending"}</td>
        <td>${new Date(d.createdAt).toLocaleDateString()}</td>
        <td>
          <button onclick="deleteDoubt('${d._id}')">🗑</button>
        </td>
      </tr>
    `;
  });
}

async function deleteDoubt(id) {
  if (!confirm("Delete this doubt?")) return;

  const res = await fetch(`http://localhost:5000/api/admin/doubts/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.ok) {
    loadAdminDoubts();
    loadDoubtAnalytics();
  } else {
    console.error("Failed to delete doubt");
  }
}

loadDoubtAnalytics();
loadAdminDoubts();

//-------------------------------------
const SETTINGS_API = "http://localhost:5000/api/admin-settings";

const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

document.addEventListener("DOMContentLoaded", loadSettings);

async function loadSettings() {
  const res = await fetch(SETTINGS_API, { headers: headers() });
  const s = await res.json();

  document.getElementById("platformName").value =
    s.platformName || "SmartLearn";
  document.getElementById("supportEmail").value =
    s.supportEmail || "smartlearn526@gmail.com";

  document.getElementById("maintenanceMode").checked = !!s.maintenanceMode;
  document.getElementById("enableSignup").checked = !!s.allowNewSignups;

  document.getElementById("emailVerification").checked =
    !!s.requireEmailVerification;
  document.getElementById("sessionTimeout").value =
    s.sessionTimeoutMinutes ?? 60;
  document.getElementById("maxAttempts").value = s.maxLoginAttempts ?? 5;

  document.getElementById("maxUpload").value = String(s.maxUploadMB ?? 10);
  document.getElementById("allowedTypes").value = s.allowedTypes || "pdf";
  document.getElementById("autoCleanup").checked = !!s.autoCleanup;
}

async function saveAllSettings(payload) {
  const res = await fetch(SETTINGS_API, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Save failed");
  alert("Saved ✅");
}

// Platform Save
document.getElementById("savePlatform").addEventListener("click", () => {
  saveAllSettings({
    platformName: document.getElementById("platformName").value.trim(),
    supportEmail: document.getElementById("supportEmail").value.trim(),
    maintenanceMode: document.getElementById("maintenanceMode").checked,
    allowNewSignups: document.getElementById("enableSignup").checked,
  });
});

// Security Save
document.getElementById("saveSecurity").addEventListener("click", () => {
  saveAllSettings({
    requireEmailVerification:
      document.getElementById("emailVerification").checked,
    sessionTimeoutMinutes: Number(
      document.getElementById("sessionTimeout").value || 60,
    ),
    maxLoginAttempts: Number(document.getElementById("maxAttempts").value || 5),
  });
});

// Uploads Save
document.getElementById("saveUploads").addEventListener("click", () => {
  saveAllSettings({
    maxUploadMB: Number(document.getElementById("maxUpload").value || 10),
    allowedTypes: document.getElementById("allowedTypes").value,
    autoCleanup: document.getElementById("autoCleanup").checked,
  });
});


