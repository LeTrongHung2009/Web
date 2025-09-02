// main.js
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// ==============================
// Base API URL
// ==============================
const API_BASE = "http://localhost:5000";

// ==============================
// Helpers
// ==============================
function openModal(modal) { modal?.showModal(); }
function closeModal(modal) { modal?.close(); }
function showToast(message, type = "success") {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove("bg-green-600", "bg-red-600");
  toast.classList.add(type === "success" ? "bg-green-600" : "bg-red-600");
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3000);
}
function showLoading(show = true) {
  $("#loading")?.classList.toggle("hidden", !show);
}

// Safe parse JSON (tránh lỗi khi server trả HTML lỗi)
async function safeJson(res) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  const text = await res.text();
  return { message: text };
}

// Lấy token từ localStorage
function getAuthHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ==============================
// Sidebar toggle
// ==============================
$("#menuToggle")?.addEventListener("click", () => {
  $("#sidebar")?.classList.toggle("-translate-x-full");
});

// ==============================
// Auth modals
// ==============================
$("#openLogin")?.addEventListener("click", () => openModal($("#loginModal")));
$("#closeLoginModal")?.addEventListener("click", () => closeModal($("#loginModal")));
$("#cancelLogin")?.addEventListener("click", () => closeModal($("#loginModal")));

$("#openRegister")?.addEventListener("click", () => openModal($("#registerModal")));
$("#closeRegisterModal")?.addEventListener("click", () => closeModal($("#registerModal")));
$("#cancelRegister")?.addEventListener("click", () => closeModal($("#registerModal")));

$("#closeOtpModal")?.addEventListener("click", () => closeModal($("#otpModal")));
$("#cancelOtp")?.addEventListener("click", () => closeModal($("#otpModal")));

// ==============================
// Logout
// ==============================
$("#logoutBtn")?.addEventListener("click", () => {
  localStorage.clear();
  updateAuthUI();
  showToast("Đăng xuất thành công");
});

// ==============================
// Login submit
// ==============================
$("#loginSubmit")?.addEventListener("click", async (e) => {
  e.preventDefault();
  const email = $("#loginEmail")?.value.trim().toLowerCase() || "";
  const password = $("#loginPassword")?.value.trim() || "";  // Trim password

  try {
    showLoading(true);
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await safeJson(res);
    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("name", data.name);
      localStorage.setItem("ban", data.ban);
      localStorage.setItem("group", data.group);
      updateAuthUI();
      closeModal($("#loginModal"));
      showToast("Đăng nhập thành công");
    } else {
      showToast(data.message || "Đăng nhập thất bại", "error");
    }
  } catch (err) {
    console.error(err);
    showToast("Lỗi kết nối server", "error");
  } finally {
    showLoading(false);
  }
});

// ==============================
// Register submit
// ==============================
$("#registerSubmit")?.addEventListener("click", async (e) => {
  e.preventDefault();
  const name = $("#regName")?.value.trim() || "";
  const email = ($("#regEmail")?.value || "").trim().toLowerCase();
  const password = $("#regPass")?.value.trim() || "";  // Trim password
  const ban = $("#regBan")?.value || "";
  const group = $("#regGroup")?.value || "";

  try {
    showLoading(true);
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, ban, group })
    });
    const data = await safeJson(res);
    if (res.ok) {
      showToast("Đăng ký thành công! OTP đã được gửi đến email của bạn.");
      localStorage.setItem("pendingEmail", email);
      closeModal($("#registerModal"));
      openModal($("#otpModal"));
    } else {
      showToast(data.message || "Đăng ký thất bại", "error");
    }
  } catch (err) {
    console.error(err);
    showToast("Lỗi kết nối server", "error");
  } finally {
    showLoading(false);
  }
});

// ==============================
// OTP submit
// ==============================
$("#verifyOtp")?.addEventListener("click", async (e) => {
  e.preventDefault();
  const otp = $("#otpCode")?.value || "";
  const email = localStorage.getItem("pendingEmail");

  if (!otp || !email) {
    showToast("Vui lòng nhập OTP", "error");
    return;
  }

  try {
    showLoading(true);
    const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp })
    });
    const data = await safeJson(res);
    if (res.ok) {
      showToast("Xác thực OTP thành công!");
      localStorage.removeItem("pendingEmail");
      localStorage.setItem("token", data.token);
      localStorage.setItem("name", data.name);
      localStorage.setItem("ban", data.ban);
      localStorage.setItem("group", data.group);
      closeModal($("#otpModal"));
      updateAuthUI();
    } else {
      showToast(data.message || "OTP sai hoặc hết hạn", "error");
    }
  } catch (err) {
    console.error(err);
    showToast("Lỗi kết nối server", "error");
  } finally {
    showLoading(false);
  }
});

// ==============================
// Resend OTP
// ==============================
$("#resendOtp")?.addEventListener("click", async () => {
  const email = localStorage.getItem("pendingEmail");
  if (!email) return showToast("Không tìm thấy email", "error");

  try {
    showLoading(true);
    const res = await fetch(`${API_BASE}/api/auth/resend-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await safeJson(res);
    if (res.ok) {
      showToast("OTP đã được gửi lại!");
    } else {
      showToast(data.message || "Lỗi gửi OTP", "error");
    }
  } catch (err) {
    console.error(err);
    showToast("Lỗi kết nối server", "error");
  } finally {
    showLoading(false);
  }
});

// ==============================
// Auth UI
// ==============================
function updateAuthUI() {
  const token = localStorage.getItem("token");
  const ban = localStorage.getItem("ban");
  const name = localStorage.getItem("name");

  const authButtonsEl = $("#authButtons");
  const userPanelEl = $("#userPanel");
  const userNameEl = $("#userName");
  const membersTabEl = $("#membersTab");
  const membersLoginPromptEl = $("#membersLoginPrompt");
  const membersContentEl = $("#membersContent");
  const addMemberBtnEl = $("#addMemberBtn");
  const addEventBtnEl = $("#addEventBtn");
  const uploadDocBtnEl = $("#uploadDocBtn");

  if (token) {
    authButtonsEl?.classList.add("hidden");
    userPanelEl?.classList.remove("hidden");
    if (userNameEl) userNameEl.textContent = name || "";
    membersTabEl?.classList.remove("hidden");
    membersLoginPromptEl?.classList.add("hidden");
    membersContentEl?.classList.remove("hidden");

    if (ban === "Quản lý") { // Chỉ Quản lý mới thêm/sửa/xóa
      addEventBtnEl?.classList.remove("hidden");
      addMemberBtnEl?.classList.remove("hidden");
      uploadDocBtnEl?.classList.remove("hidden");
      $("#memberActionsHeader")?.classList.remove("hidden");
      $("#eventActionsHeader")?.classList.remove("hidden");
      $("#docActionsHeader")?.classList.remove("hidden");
    }
    loadMembers();
    loadEvents();
    loadDocs();
  } else {
    authButtonsEl?.classList.remove("hidden");
    userPanelEl?.classList.add("hidden");
    membersTabEl?.classList.add("hidden");
    membersContentEl?.classList.add("hidden");
    membersLoginPromptEl?.classList.remove("hidden");
    addEventBtnEl?.classList.add("hidden");
    uploadDocBtnEl?.classList.add("hidden");
    addMemberBtnEl?.classList.add("hidden");
    $("#memberActionsHeader")?.classList.add("hidden");
    $("#eventActionsHeader")?.classList.add("hidden");
    $("#docActionsHeader")?.classList.add("hidden");
  }
}

// ==============================
// Tabs
// ==============================
$$(".tab-btn")?.forEach(btn => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    $$(".tab-btn").forEach(b => b.removeAttribute("aria-current"));
    btn.setAttribute("aria-current", "true");
    $$("main section > div").forEach(d => d.classList.add("hidden"));
    $(`#tab-${tab}`)?.classList.remove("hidden");
    $("#pageTitle").textContent = btn.textContent;
    if (tab === "members") loadMembers();
    if (tab === "events") loadEvents();
    if (tab === "docs") loadDocs();
  });
});

// ==============================
// Members Management
// ==============================
async function loadMembers(query = "") {
  try {
    showLoading(true);
    const res = await fetch(`${API_BASE}/api/members${query ? `?search=${encodeURIComponent(query)}` : ""}`, {
      headers: getAuthHeader()
    });
    const data = await res.json();
    if (res.ok) {
      const tbody = $("#memberBody");
      tbody.innerHTML = "";
      data.forEach(mem => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="px-5 py-3">${mem.name}</td>
          <td class="px-5 py-3">${mem.class || '-'}</td>
          <td class="px-5 py-3">${mem.ban}</td>
          <td class="px-5 py-3">${mem.group}</td>
          <td class="px-5 py-3">${new Date(mem.year).toLocaleDateString('vi-VN')}</td>
          ${localStorage.getItem("ban") === "Quản lý" ? `
            <td class="px-5 py-3">
              <button data-edit="${mem._id}" class="edit-member px-2 py-1 rounded bg-blue-500 text-white mr-2">Sửa</button>
              <button data-delete="${mem._id}" class="delete-member px-2 py-1 rounded bg-red-500 text-white">Xóa</button>
            </td>
          ` : ''}
        `;
        tbody.appendChild(tr);
      });
      // Attach event listeners for edit/delete
      $$(".edit-member").forEach(btn => btn.addEventListener("click", handleEditMember));
      $$(".delete-member").forEach(btn => btn.addEventListener("click", handleDeleteMember));
    } else {
      showToast("Lỗi tải danh sách thành viên", "error");
    }
  } catch (err) {
    showToast("Lỗi kết nối", "error");
  } finally {
    showLoading(false);
  }
}

// Add member button
$("#addMemberBtn")?.addEventListener("click", () => {
  $("#memberModalTitle").textContent = "➕ Thêm thành viên";
  $("#memName").value = "";
  $("#memClass").value = "";
  $("#memBan").value = "";
  $("#memGroup").value = "";
  $("#memYear").value = "";
  $("#memIndex").value = "";
  openModal($("#memberModal"));
});

// Close member modal
$("#closeMemberModal")?.addEventListener("click", () => closeModal($("#memberModal")));
$("#cancelMember")?.addEventListener("click", () => closeModal($("#memberModal")));

// Save member
$("#saveMember")?.addEventListener("click", async (e) => {
  e.preventDefault();
  const id = $("#memIndex").value;
  const member = {
    name: $("#memName").value,
    class: $("#memClass").value,
    ban: $("#memBan").value,
    group: $("#memGroup").value,
    year: $("#memYear").value
  };

  try {
    showLoading(true);
    const url = id ? `${API_BASE}/api/members/${id}` : `${API_BASE}/api/members`;
    const method = id ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(member)
    });
    if (res.ok) {
      showToast(id ? "Cập nhật thành viên thành công" : "Thêm thành viên thành công");
      closeModal($("#memberModal"));
      loadMembers();
    } else {
      const data = await res.json();
      showToast(data.message || "Lỗi lưu thành viên", "error");
    }
  } catch (err) {
    showToast("Lỗi kết nối", "error");
  } finally {
    showLoading(false);
  }
});

// Edit member
async function handleEditMember(e) {
  const id = e.target.dataset.edit;
  try {
    showLoading(true);
    const res = await fetch(`${API_BASE}/api/members/${id}`, {
      headers: getAuthHeader()
    });
    const data = await res.json();
    if (res.ok) {
      $("#memberModalTitle").textContent = "✏️ Sửa thành viên";
      $("#memName").value = data.name;
      $("#memClass").value = data.class || "";
      $("#memBan").value = data.ban;
      $("#memGroup").value = data.group;
      $("#memYear").value = new Date(data.year).toISOString().split('T')[0];
      $("#memIndex").value = id;
      openModal($("#memberModal"));
    } else {
      showToast(data.message || "Lỗi tải dữ liệu thành viên", "error");
    }
  } catch (err) {
    showToast("Lỗi kết nối", "error");
  } finally {
    showLoading(false);
  }
}

// Delete member
async function handleDeleteMember(e) {
  const id = e.target.dataset.delete;
  if (!confirm("Xác nhận xóa thành viên?")) return;
  try {
    showLoading(true);
    const res = await fetch(`${API_BASE}/api/members/${id}`, {
      method: "DELETE",
      headers: getAuthHeader()
    });
    if (res.ok) {
      showToast("Xóa thành viên thành công");
      loadMembers();
    } else {
      showToast("Lỗi xóa thành viên", "error");
    }
  } catch (err) {
    showToast("Lỗi kết nối", "error");
  } finally {
    showLoading(false);
  }
}

// Search member
$("#searchMember")?.addEventListener("input", (e) => loadMembers(e.target.value));

// ==============================
// Events Management
// ==============================
async function loadEvents(query = "") {
  try {
    showLoading(true);
    const res = await fetch(`${API_BASE}/api/events${query ? `?search=${encodeURIComponent(query)}` : ""}`, {
      headers: getAuthHeader()
    });
    const data = await res.json();
    if (res.ok) {
      const tbody = $("#eventBody");
      tbody.innerHTML = "";
      data.forEach(ev => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="px-5 py-3">${ev.title}</td>
          <td class="px-5 py-3">${new Date(ev.date).toLocaleDateString('vi-VN')}</td>
          <td class="px-5 py-3">${ev.location}</td>
          ${localStorage.getItem("ban") === "Quản lý" ? `
            <td class="px-5 py-3">
              <button data-edit="${ev._id}" class="edit-event px-2 py-1 rounded bg-blue-500 text-white mr-2">Sửa</button>
              <button data-delete="${ev._id}" class="delete-event px-2 py-1 rounded bg-red-500 text-white">Xóa</button>
            </td>
          ` : ''}
        `;
        tbody.appendChild(tr);
      });
      $$(".edit-event").forEach(btn => btn.addEventListener("click", handleEditEvent));
      $$(".delete-event").forEach(btn => btn.addEventListener("click", handleDeleteEvent));
    } else {
      showToast("Lỗi tải danh sách sự kiện", "error");
    }
  } catch (err) {
    showToast("Lỗi kết nối", "error");
  } finally {
    showLoading(false);
  }
}

// Add event button
$("#addEventBtn")?.addEventListener("click", () => {
  $("#eventModalTitle").textContent = "📅 Thêm sự kiện";
  $("#evTitle").value = "";
  $("#evDate").value = "";
  $("#evLocation").value = "";
  $("#evIndex").value = "";
  openModal($("#eventModal"));
});

// Close event modal
$("#closeEventModal")?.addEventListener("click", () => closeModal($("#eventModal")));
$("#cancelEvent")?.addEventListener("click", () => closeModal($("#eventModal")));

// Save event
$("#saveEvent")?.addEventListener("click", async (e) => {
  e.preventDefault();
  const id = $("#evIndex").value;
  const event = {
    title: $("#evTitle").value,
    date: $("#evDate").value,
    location: $("#evLocation").value
  };

  try {
    showLoading(true);
    const url = id ? `${API_BASE}/api/events/${id}` : `${API_BASE}/api/events`;
    const method = id ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(event)
    });
    if (res.ok) {
      showToast(id ? "Cập nhật sự kiện thành công" : "Thêm sự kiện thành công");
      closeModal($("#eventModal"));
      loadEvents();
    } else {
      const data = await res.json();
      showToast(data.message || "Lỗi lưu sự kiện", "error");
    }
  } catch (err) {
    showToast("Lỗi kết nối", "error");
  } finally {
    showLoading(false);
  }
});

// Edit event
async function handleEditEvent(e) {
  const id = e.target.dataset.edit;
  try {
    showLoading(true);
    const res = await fetch(`${API_BASE}/api/events/${id}`, {
      headers: getAuthHeader()
    });
    const data = await res.json();
    if (res.ok) {
      $("#eventModalTitle").textContent = "✏️ Sửa sự kiện";
      $("#evTitle").value = data.title;
      $("#evDate").value = new Date(data.date).toISOString().split('T')[0];
      $("#evLocation").value = data.location;
      $("#evIndex").value = id;
      openModal($("#eventModal"));
    } else {
      showToast(data.message || "Lỗi tải dữ liệu sự kiện", "error");
    }
  } catch (err) {
    showToast("Lỗi kết nối", "error");
  } finally {
    showLoading(false);
  }
}

// Delete event
async function handleDeleteEvent(e) {
  const id = e.target.dataset.delete;
  if (!confirm("Xác nhận xóa sự kiện?")) return;
  try {
    showLoading(true);
    const res = await fetch(`${API_BASE}/api/events/${id}`, {
      method: "DELETE",
      headers: getAuthHeader()
    });
    if (res.ok) {
      showToast("Xóa sự kiện thành công");
      loadEvents();
    } else {
      showToast("Lỗi xóa sự kiện", "error");
    }
  } catch (err) {
    showToast("Lỗi kết nối", "error");
  } finally {
    showLoading(false);
  }
}

// Search event
$("#searchEvent")?.addEventListener("input", (e) => loadEvents(e.target.value));

// ==============================
// Docs Management
// ==============================
async function loadDocs(query = "") {
  try {
    showLoading(true);
    const res = await fetch(`${API_BASE}/api/docs${query ? `?search=${encodeURIComponent(query)}` : ""}`, {
      headers: getAuthHeader()
    });
    const data = await res.json();
    if (res.ok) {
      const tbody = $("#docBody");
      tbody.innerHTML = "";
      data.forEach((doc, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="px-5 py-3">${doc.filename}</td>
          <td class="px-5 py-3">${new Date(doc.uploadDate).toLocaleDateString('vi-VN')}</td>
          <td class="px-5 py-3"><a href="${API_BASE}/uploads/${doc.filename}" download class="text-blue-500 hover:underline">Tải về</a></td>
          ${localStorage.getItem("ban") === "Quản lý" ? `
            <td class="px-5 py-3">
              <button data-delete="${doc._id}" class="delete-doc px-2 py-1 rounded bg-red-500 text-white">Xóa</button>
            </td>
          ` : ''}
        `;
        tbody.appendChild(tr);
      });
      $$(".delete-doc").forEach(btn => btn.addEventListener("click", handleDeleteDoc));
    } else {
      showToast("Lỗi tải danh sách tài liệu", "error");
    }
  } catch (err) {
    showToast("Lỗi kết nối", "error");
  } finally {
    showLoading(false);
  }
}

// Upload doc
$("#docFile")?.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  try {
    showLoading(true);
    const res = await fetch(`${API_BASE}/api/docs`, {
      method: "POST",
      headers: getAuthHeader(),
      body: formData
    });
    if (res.ok) {
      showToast("Tải lên tài liệu thành công");
      loadDocs();
    } else {
      const data = await res.json();
      showToast(data.message || "Lỗi tải lên", "error");
    }
  } catch (err) {
    showToast("Lỗi kết nối", "error");
  } finally {
    showLoading(false);
    $("#docFile").value = "";
  }
});

// Delete doc
async function handleDeleteDoc(e) {
  const id = e.target.dataset.delete;
  if (!confirm("Xác nhận xóa tài liệu?")) return;
  try {
    showLoading(true);
    const res = await fetch(`${API_BASE}/api/docs/${id}`, {
      method: "DELETE",
      headers: getAuthHeader()
    });
    if (res.ok) {
      showToast("Xóa tài liệu thành công");
      loadDocs();
    } else {
      showToast("Lỗi xóa tài liệu", "error");
    }
  } catch (err) {
    showToast("Lỗi kết nối", "error");
  } finally {
    showLoading(false);
  }
}

// Search doc
$("#searchDoc")?.addEventListener("input", (e) => loadDocs(e.target.value));

// ==============================
// Initial render
// ==============================
updateAuthUI();