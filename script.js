// TaskFlow — application logic
const STORAGE_KEY = "taskflow_tasks_v1";
const THEME_KEY = "taskflow_theme_v1";

const $ = (selector) => document.querySelector(selector);
const taskList = $("#taskList");
const modal = $("#taskModal");
const form = $("#taskForm");
let tasks = loadTasks();
let activeView = "all";
let activeFilter = "all";
let activeCategory = "";
let layout = "list";
let toastTimer;

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch { return []; }
}
function saveTasks() { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}
function localDateString(date = new Date()) {
  const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, "0"), d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function formatDate(value) {
  if (!value) return "No due date";
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function isOverdue(task) { return !task.completed && task.dueDate && task.dueDate < localDateString(); }
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
}
function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const overdue = tasks.filter(isOverdue).length;
  const rate = total ? Math.round(completed / total * 100) : 0;
  $("#totalCount").textContent = total;
  $("#completedCount").textContent = completed;
  $("#pendingCount").textContent = pending;
  $("#overdueCount").textContent = overdue;
  $("#completionRate").textContent = `${rate}%`;
  $("#progressLabel").innerHTML = `${rate}% <span>done</span>`;
  $("#progressFill").style.width = `${rate}%`;
  $("#allTabCount").textContent = total;
  $("#todoTabCount").textContent = pending;
  $("#doneTabCount").textContent = completed;
}
function getVisibleTasks() {
  const search = $("#searchInput").value.trim().toLowerCase();
  let result = [...tasks];
  if (activeView === "today") result = result.filter(t => t.dueDate === localDateString() && !t.completed);
  if (activeView === "upcoming") result = result.filter(t => t.dueDate && t.dueDate > localDateString() && !t.completed);
  if (activeView === "completed") result = result.filter(t => t.completed);
  if (activeCategory) result = result.filter(t => t.category === activeCategory);
  if (activeFilter === "pending") result = result.filter(t => !t.completed);
  if (activeFilter === "completed") result = result.filter(t => t.completed);
  if (search) result = result.filter(t => `${t.title} ${t.description} ${t.category}`.toLowerCase().includes(search));
  const sort = $("#sortSelect").value;
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  result.sort((a, b) => {
    if (sort === "priority") return priorityOrder[a.priority] - priorityOrder[b.priority];
    if (sort === "created") return b.createdAt - a.createdAt;
    if (sort === "alphabetical") return a.title.localeCompare(b.title);
    return (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31");
  });
  return result;
}
function renderTasks() {
  updateStats();
  const visible = getVisibleTasks();
  taskList.classList.toggle("grid-layout", layout === "grid");
  taskList.innerHTML = visible.map(task => `
    <article class="task-card ${task.completed ? "is-completed" : ""}">
      <input class="task-check" type="checkbox" aria-label="Mark ${escapeHTML(task.title)} complete" data-action="toggle" data-id="${task.id}" ${task.completed ? "checked" : ""}>
      <div class="task-main">
        <p class="task-title">${escapeHTML(task.title)}</p>
        ${task.description ? `<p class="task-description">${escapeHTML(task.description)}</p>` : ""}
        <div class="task-meta">
          <span class="task-tag">${escapeHTML(task.category)}</span>
          <span class="priority-tag ${task.priority}">${task.priority[0].toUpperCase() + task.priority.slice(1)} priority</span>
          <span class="due-tag ${isOverdue(task) ? "overdue" : ""}">${isOverdue(task) ? "Overdue · " : "◷ "}${formatDate(task.dueDate)}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="task-action" data-action="edit" data-id="${task.id}" title="Edit task" aria-label="Edit task">✎</button>
        <button class="task-action" data-action="delete" data-id="${task.id}" title="Delete task" aria-label="Delete task">×</button>
      </div>
    </article>`).join("");
  $("#emptyState").classList.toggle("hidden", visible.length > 0);
  taskList.classList.toggle("hidden", visible.length === 0);
  $("#breadcrumbView").textContent = activeCategory || viewLabel(activeView);
  $("#taskSectionTitle").textContent = activeCategory ? `${activeCategory} tasks` : activeView === "all" ? "Your tasks" : viewLabel(activeView);
  $("#taskSectionDescription").textContent = `${visible.length} ${visible.length === 1 ? "task" : "tasks"} to keep you moving forward.`;
  document.querySelectorAll(".nav-link[data-view]").forEach(btn => btn.classList.toggle("active", !activeCategory && btn.dataset.view === activeView));
  document.querySelectorAll(".nav-link[data-category]").forEach(btn => btn.classList.toggle("active", btn.dataset.category === activeCategory));
  document.querySelectorAll(".filter-chip").forEach(btn => btn.classList.toggle("active", btn.dataset.filter === activeFilter));
}
function viewLabel(view) {
  return ({ all: "Overview", today: "My day", upcoming: "Upcoming", completed: "Completed" })[view] || "Overview";
}
function openModal(task = null) {
  form.reset();
  $("#taskId").value = task?.id || "";
  $("#modalTitle").textContent = task ? "Edit task" : "Create a new task";
  $("#saveTaskButton").innerHTML = task ? "Save changes <span>→</span>" : "Create task <span>→</span>";
  if (task) {
    $("#taskTitle").value = task.title;
    $("#taskDescription").value = task.description || "";
    $("#taskCategory").value = task.category;
    $("#taskPriority").value = task.priority;
    $("#taskDueDate").value = task.dueDate || "";
  }
  modal.classList.remove("hidden");
  setTimeout(() => $("#taskTitle").focus(), 50);
}
function closeModal() { modal.classList.add("hidden"); form.reset(); }
function addCategory() {
  const name = prompt("Enter a category name:");
  if (!name || !name.trim()) return;
  const category = name.trim().slice(0, 24);
  const select = $("#taskCategory");
  if ([...select.options].some(o => o.value.toLowerCase() === category.toLowerCase())) {
    showToast("That category already exists."); return;
  }
  const option = new Option(category, category);
  select.add(option);
  const button = document.createElement("button");
  button.className = "nav-link";
  button.dataset.category = category;
  button.innerHTML = `<span class="category-dot purple"></span> ${escapeHTML(category)}`;
  $("#categoryNav").append(button);
  showToast(`"${category}" category added.`);
}
form.addEventListener("submit", event => {
  event.preventDefault();
  const title = $("#taskTitle").value.trim();
  if (!title) return;
  const id = $("#taskId").value;
  const existing = tasks.find(t => t.id === id);
  const task = {
    id: id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    title,
    description: $("#taskDescription").value.trim(),
    category: $("#taskCategory").value,
    priority: $("#taskPriority").value,
    dueDate: $("#taskDueDate").value,
    completed: existing?.completed || false,
    createdAt: existing?.createdAt || Date.now()
  };
  if (existing) tasks = tasks.map(t => t.id === id ? task : t);
  else tasks.unshift(task);
  saveTasks(); renderTasks(); closeModal();
  showToast(existing ? "Task updated successfully." : "Task created successfully.");
});
taskList.addEventListener("click", event => {
  const control = event.target.closest("[data-action]");
  if (!control) return;
  const task = tasks.find(t => t.id === control.dataset.id);
  if (!task) return;
  if (control.dataset.action === "edit") openModal(task);
  if (control.dataset.action === "delete") {
    if (!confirm(`Delete "${task.title}"?`)) return;
    tasks = tasks.filter(t => t.id !== task.id);
    saveTasks(); renderTasks(); showToast("Task deleted.");
  }
});
taskList.addEventListener("change", event => {
  const control = event.target.closest('[data-action="toggle"]');
  if (!control) return;
  const task = tasks.find(t => t.id === control.dataset.id);
  if (!task) return;
  task.completed = control.checked;
  saveTasks(); renderTasks();
  showToast(task.completed ? "Nice work! Task completed." : "Task moved back to to-do.");
});
document.querySelectorAll(".nav-link[data-view]").forEach(btn => btn.addEventListener("click", () => {
  activeView = btn.dataset.view; activeCategory = ""; activeFilter = "all"; renderTasks();
  $("#sidebar").classList.remove("open");
}));
$("#categoryNav").addEventListener("click", event => {
  const btn = event.target.closest("[data-category]");
  if (!btn) return;
  activeCategory = btn.dataset.category; activeView = "all"; activeFilter = "all"; renderTasks();
  $("#sidebar").classList.remove("open");
});
document.querySelectorAll(".filter-chip").forEach(btn => btn.addEventListener("click", () => {
  activeFilter = btn.dataset.filter; renderTasks();
}));
document.querySelectorAll(".view-button").forEach(btn => btn.addEventListener("click", () => {
  layout = btn.dataset.layout;
  document.querySelectorAll(".view-button").forEach(b => b.classList.toggle("active", b === btn));
  renderTasks();
}));
$("#sortSelect").addEventListener("change", renderTasks);
$("#searchInput").addEventListener("input", renderTasks);
$("#openTaskModal").addEventListener("click", () => openModal());
$("#emptyAddButton").addEventListener("click", () => openModal());
$("#closeModal").addEventListener("click", closeModal);
$("#cancelModal").addEventListener("click", closeModal);
modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });
$("#addCategoryBtn").addEventListener("click", addCategory);
$("#menuButton").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
$("#themeToggle").addEventListener("click", () => {
  const dark = document.body.classList.toggle("dark");
  localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  $("#themeText").textContent = dark ? "Light mode" : "Dark mode";
  $("#themeIcon").textContent = dark ? "☀" : "☾";
});
if (localStorage.getItem(THEME_KEY) === "dark") {
  document.body.classList.add("dark");
  $("#themeText").textContent = "Light mode";
  $("#themeIcon").textContent = "☀";
}
$("#currentDate").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }).toUpperCase();
renderTasks();
