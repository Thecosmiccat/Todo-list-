const STORAGE_KEY = "easyTodo.tasks";

const elements = {
  calendar: document.getElementById("calendar"),
  monthLabel: document.getElementById("monthLabel"),
  prevMonth: document.getElementById("prevMonth"),
  nextMonth: document.getElementById("nextMonth"),
  taskForm: document.getElementById("taskForm"),
  taskText: document.getElementById("taskText"),
  taskDate: document.getElementById("taskDate"),
  taskTime: document.getElementById("taskTime"),
  tasksList: document.getElementById("tasks"),
  itemCount: document.getElementById("itemCount"),
  clearFilter: document.getElementById("clearFilter"),
  
};

const state = {
  tasks: [],
  viewDate: new Date(),
  selectedDate: null,
  notificationsAllowed: false,
};

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state.tasks = raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn("Failed to load tasks:", error);
    state.tasks = [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTime(time) {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = Number(h);
  const minute = Number(m);
  const ampm = hour >= 12 ? "PM" : "AM";
  const nHour = ((hour + 11) % 12) + 1;
  return `${nHour}:${String(minute).padStart(2, "0")} ${ampm}`;
}



function getTasksForDay(dateKey) {
  return state.tasks.filter((t) => t.date === dateKey);
}

function getTasksToShow() {
  if (!state.selectedDate) return state.tasks;
  return getTasksForDay(state.selectedDate);
}

function setSelectedDate(dateKey) {
  state.selectedDate = dateKey;
  renderCalendar();
  renderTasks();
}

function clearSelectedDate() {
  state.selectedDate = null;
  renderCalendar();
  renderTasks();
}

function clampMonth(date) {
  const d = new Date(date);
  d.setDate(1);
  return d;
}

function addMonths(date, count) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + count);
  return d;
}

function buildCalendar() {
  const year = state.viewDate.getFullYear();
  const month = state.viewDate.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = formatDate(new Date());

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const nodes = [];

  dayLabels.forEach((day) => {
    const cell = document.createElement("div");
    cell.className = "label";
    cell.textContent = day;
    nodes.push(cell);
  });

  for (let i = 0; i < startWeekday; i += 1) {
    const cell = document.createElement("div");
    cell.className = "day";
    cell.dataset.empty = "true";
    nodes.push(cell);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const key = formatDate(date);
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "day";
    cell.textContent = day;
    cell.dataset.date = key;

    if (key === todayKey) {
      cell.classList.add("today");
    }

    if (state.selectedDate === key) {
      cell.classList.add("selected");
    }

    const count = getTasksForDay(key).length;
    if (count) {
      const badge = document.createElement("span");
      badge.textContent = count;
      badge.style.fontSize = "10px";
      badge.style.padding = "2px 6px";
      badge.style.borderRadius = "999px";
      badge.style.background = "rgba(125, 148, 161, 0.18)";
      badge.style.color = "var(--accent)";
      badge.style.marginTop = "6px";
      badge.style.pointerEvents = "none";
      cell.appendChild(badge);
    }

    cell.addEventListener("click", () => {
      setSelectedDate(key);
    });

    nodes.push(cell);
  }

  elements.calendar.replaceChildren(...nodes);
  elements.monthLabel.textContent = state.viewDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function renderCalendar() {
  buildCalendar();
}

function renderTasks() {
  const tasks = getTasksToShow();

  elements.tasksList.innerHTML = "";
  elements.itemCount.textContent = tasks.length;

  if (tasks.length === 0) {
    const empty = document.createElement("li");
    empty.className = "task";
    empty.textContent = state.selectedDate
      ? "No reminders for this day. Add one!"
      : "No reminders yet. Add one above.";
    elements.tasksList.appendChild(empty);
    return;
  }

  tasks
    .sort((a, b) => {
      const aKey = a.date + (a.time || "");
      const bKey = b.date + (b.time || "");
      return aKey.localeCompare(bKey);
    })
    .forEach((task) => {
      const item = document.createElement("li");
      item.className = "task";
      item.dataset.done = task.done ? "true" : "false";

      const head = document.createElement("div");
      head.className = "task__head";

      const title = document.createElement("h3");
      title.className = "task__title";
      title.textContent = task.text;

          const meta = document.createElement("div");
          meta.className = "task__meta";
          meta.textContent = `${task.date} ${task.time ? "• " + formatTime(task.time) : ""}`;

      head.append(title, meta);

      const controls = document.createElement("div");
      controls.className = "task__controls";

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.textContent = task.done ? "Undo" : "Done";
      toggle.addEventListener("click", () => {
        task.done = !task.done;
        saveTasks();
        renderTasks();
      });

      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Delete";
      remove.style.color = "var(--danger)";
      remove.addEventListener("click", () => {
        state.tasks = state.tasks.filter((t) => t.id !== task.id);
        saveTasks();
        renderCalendar();
        renderTasks();
      });

      controls.append(toggle, remove);

      item.append(head, controls);
      elements.tasksList.appendChild(item);
    });
}

function checkReminders() {
  // notifications removed — function kept empty to avoid errors
}

function init() {
  loadTasks();

  const today = new Date();
  elements.taskDate.value = formatDate(today);

  renderCalendar();
  renderTasks();

  elements.prevMonth.addEventListener("click", () => {
    state.viewDate = clampMonth(addMonths(state.viewDate, -1));
    renderCalendar();
  });

  elements.nextMonth.addEventListener("click", () => {
    state.viewDate = clampMonth(addMonths(state.viewDate, 1));
    renderCalendar();
  });

  elements.taskForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const text = elements.taskText.value.trim();
    const date = elements.taskDate.value;
    const time = elements.taskTime.value;
    if (!text || !date) return;

    const task = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      text,
      date,
      time,
      done: false,
    };

    state.tasks.push(task);
    saveTasks();

    elements.taskText.value = "";
    elements.taskTime.value = "";

    if (!state.selectedDate || state.selectedDate === date) {
      setSelectedDate(date);
    } else {
      renderTasks();
    }

    renderCalendar();
  });

  elements.clearFilter.addEventListener("click", () => {
    clearSelectedDate();
  });

  

  

  // Notifications removed: no permission requests or scheduled checks.
}

init();
