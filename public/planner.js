// Daily planner: one entry per calendar day, saved to localStorage.
const storageKey = "jd2d-planner-v1";
const firstHour = 6;
const lastHour = 22;

const $ = (id) => document.getElementById(id);

function loadAll() {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

let days = loadAll();

function saveAll() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(days));
  } catch {
    // Storage can be full or blocked (private mode); the page keeps working for this visit.
  }
}

const emptyDay = () => ({
  priorities: [
    { text: "", done: false },
    { text: "", done: false },
    { text: "", done: false },
  ],
  schedule: {},
  tasks: [],
  notes: "",
});

function isEmpty(day) {
  return (
    day.priorities.every((p) => !p.text && !p.done) &&
    Object.values(day.schedule).every((v) => !v) &&
    day.tasks.length === 0 &&
    !day.notes
  );
}

// Dates are local calendar days, keyed as YYYY-MM-DD.
function toKey(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
function fromKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

let currentKey = toKey(new Date());

function currentDay() {
  return days[currentKey] || emptyDay();
}

function update(change) {
  const day = currentDay();
  change(day);
  if (isEmpty(day)) delete days[currentKey];
  else days[currentKey] = day;
  saveAll();
  renderStats();
}

function formatHour(hour) {
  const suffix = hour < 12 ? "AM" : "PM";
  return `${hour % 12 || 12} ${suffix}`;
}

function renderHeader() {
  const date = fromKey(currentKey);
  const offset = Math.round((date - fromKey(toKey(new Date()))) / 86400000);
  const names = { "-1": "Yesterday", 0: "Today", 1: "Tomorrow" };
  $("day-name").textContent =
    names[offset] ?? date.toLocaleDateString(undefined, { weekday: "long" });
  $("day-date").textContent = date.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  $("day-input").value = currentKey;
  $("today-btn").disabled = offset === 0;
}

function renderPriorities() {
  const list = $("priority-list");
  list.replaceChildren();
  currentDay().priorities.forEach((priority, index) => {
    const card = document.createElement("div");
    card.className = `priority${priority.done ? " done" : ""}`;

    const top = document.createElement("div");
    top.className = "priority-top";
    const num = document.createElement("span");
    num.className = "priority-num";
    num.textContent = String(index + 1).padStart(2, "0");
    const check = document.createElement("input");
    check.type = "checkbox";
    check.className = "check";
    check.checked = priority.done;
    check.setAttribute("aria-label", `Priority ${index + 1} done`);
    top.append(num, check);

    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 120;
    input.value = priority.text;
    input.placeholder = ["The one big thing", "Next most important", "A win for later"][index];
    input.setAttribute("aria-label", `Priority ${index + 1}`);

    const hint = document.createElement("p");
    hint.className = "priority-hint";
    hint.textContent = index === 0 ? "If you only do one thing today." : "Keep it small and doable.";

    input.addEventListener("input", () =>
      update((day) => {
        day.priorities[index].text = input.value;
      }),
    );
    check.addEventListener("change", () => {
      card.classList.toggle("done", check.checked);
      update((day) => {
        day.priorities[index].done = check.checked;
      });
    });

    card.append(top, input, hint);
    list.append(card);
  });
}

function renderSchedule() {
  const list = $("schedule-list");
  list.replaceChildren();
  const schedule = currentDay().schedule;
  const isToday = currentKey === toKey(new Date());
  const nowHour = new Date().getHours();
  for (let hour = firstHour; hour <= lastHour; hour++) {
    const row = document.createElement("li");
    const value = schedule[hour] || "";
    row.className = "slot";
    row.classList.toggle("filled", Boolean(value));
    row.classList.toggle("now", isToday && hour === nowHour);

    const id = `slot-${hour}`;
    const label = document.createElement("label");
    label.htmlFor = id;
    label.textContent = formatHour(hour);
    const input = document.createElement("input");
    input.id = id;
    input.type = "text";
    input.maxLength = 120;
    input.value = value;
    input.placeholder = "—";
    input.addEventListener("input", () => {
      row.classList.toggle("filled", Boolean(input.value));
      update((day) => {
        if (input.value) day.schedule[hour] = input.value;
        else delete day.schedule[hour];
      });
    });

    row.append(label, input);
    list.append(row);
  }
}

function renderTasks() {
  const list = $("task-list");
  list.replaceChildren();
  const tasks = currentDay().tasks;
  tasks.forEach((task) => {
    const item = document.createElement("li");
    item.className = `task${task.done ? " done" : ""}`;

    const check = document.createElement("input");
    check.type = "checkbox";
    check.className = "check";
    check.checked = task.done;
    check.setAttribute("aria-label", `Done: ${task.text}`);
    check.addEventListener("change", () => {
      update((day) => {
        day.tasks.find((t) => t.id === task.id).done = check.checked;
      });
      renderTasks();
    });

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Remove: ${task.text}`);
    remove.addEventListener("click", () => {
      update((day) => {
        day.tasks = day.tasks.filter((t) => t.id !== task.id);
      });
      renderTasks();
      $("task-input").focus();
    });

    item.append(check, text, remove);
    list.append(item);
  });
  $("task-empty").hidden = tasks.length > 0;
  $("clear-done").hidden = !tasks.some((t) => t.done);
}

function renderStats() {
  const day = currentDay();
  const doneTasks = day.tasks.filter((t) => t.done).length;
  const doneP = day.priorities.filter((p) => p.done).length;
  const setP = day.priorities.filter((p) => p.text.trim()).length;
  $("stat-tasks").textContent = `${doneTasks} of ${day.tasks.length} tasks done`;
  $("stat-priorities").textContent = `${doneP} of ${Math.max(setP, doneP) || 3} priorities done`;
  const total = day.tasks.length + Math.max(setP, doneP);
  $("progress-bar").style.width = total ? `${((doneTasks + doneP) / total) * 100}%` : "0";
}

function render() {
  renderHeader();
  renderPriorities();
  renderSchedule();
  renderTasks();
  $("notes").value = currentDay().notes;
  renderStats();
}

function goTo(key) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
  currentKey = key;
  render();
}

document.querySelectorAll("[data-shift]").forEach((button) =>
  button.addEventListener("click", () => {
    const date = fromKey(currentKey);
    date.setDate(date.getDate() + Number(button.dataset.shift));
    goTo(toKey(date));
  }),
);
$("today-btn").addEventListener("click", () => goTo(toKey(new Date())));
$("day-input").addEventListener("change", (event) => goTo(event.target.value));

$("task-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = $("task-input");
  const text = input.value.trim();
  if (!text) return;
  update((day) => {
    day.tasks.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text, done: false });
  });
  input.value = "";
  renderTasks();
});
$("clear-done").addEventListener("click", () => {
  update((day) => {
    day.tasks = day.tasks.filter((t) => !t.done);
  });
  renderTasks();
});
$("notes").addEventListener("input", (event) =>
  update((day) => {
    day.notes = event.target.value;
  }),
);

// Pick up edits made in another tab.
window.addEventListener("storage", (event) => {
  if (event.key !== storageKey) return;
  days = loadAll();
  render();
});

render();
