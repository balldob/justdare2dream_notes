// Notes app: all notes live in one localStorage entry.
const storageKey = "jd2d-notes-v1";

const $ = (id) => document.getElementById(id);

function loadNotes() {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

let notes = loadNotes();
let currentId = null;
let query = "";

function saveNotes() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(notes));
    return true;
  } catch {
    // Storage can be full or blocked (private mode); edits still work for this visit.
    return false;
  }
}

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const current = () => notes.find((note) => note.id === currentId);
const titleOf = (note) => note.title.trim() || firstLine(note.body) || "Untitled";

function firstLine(text) {
  return text.trim().split("\n")[0].slice(0, 80);
}

function formatDate(time) {
  const date = new Date(time);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return `Today, ${date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
  }
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}

// Pinned notes first, then most recently edited.
function sortedNotes() {
  return [...notes].sort((a, b) => b.pinned - a.pinned || b.updated - a.updated);
}

function renderList() {
  const list = $("note-list");
  list.replaceChildren();
  const needle = query.toLowerCase();
  const shown = sortedNotes().filter(
    (note) => !needle || `${note.title}\n${note.body}`.toLowerCase().includes(needle),
  );

  for (const note of shown) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "note-item";
    button.setAttribute("aria-current", String(note.id === currentId));

    const title = document.createElement("span");
    title.className = "note-item-title";
    if (note.pinned) {
      const pin = document.createElement("span");
      pin.className = "pin-mark";
      pin.textContent = "✦";
      pin.setAttribute("aria-label", "Pinned");
      title.append(pin);
    }
    const titleText = document.createElement("span");
    titleText.textContent = titleOf(note);
    title.append(titleText);

    const preview = document.createElement("span");
    preview.className = "note-item-preview";
    const rest = note.title.trim() ? note.body : note.body.trim().split("\n").slice(1).join(" ");
    preview.textContent = rest.trim().replace(/\s+/g, " ") || "No extra text";

    const date = document.createElement("span");
    date.className = "note-item-date";
    date.textContent = formatDate(note.updated);

    button.append(title, preview, date);
    button.addEventListener("click", () => openNote(note.id));
    item.append(button);
    list.append(item);
  }

  const empty = $("list-empty");
  empty.hidden = shown.length > 0;
  empty.textContent = notes.length ? `No notes match “${query}”.` : "No notes yet. Start your first one.";
  $("note-count").textContent = `${notes.length} ${notes.length === 1 ? "note" : "notes"}`;
}

function renderEditor() {
  const note = current();
  $("editor-empty").hidden = Boolean(note);
  $("editor-fields").hidden = !note;
  $("workspace").classList.toggle("editing", Boolean(note));
  if (!note) return;
  if ($("title").value !== note.title) $("title").value = note.title;
  if ($("body").value !== note.body) $("body").value = note.body;
  $("pin").setAttribute("aria-pressed", String(note.pinned));
  $("pin").textContent = note.pinned ? "Pinned ✦" : "Pin";
  renderMeta(note);
}

function renderMeta(note, saved = true) {
  $("saved").innerHTML = "";
  const label = document.createElement("b");
  label.textContent = saved ? "Saved" : "Not saved";
  $("saved").append(label, ` · ${formatDate(note.updated)}`);
  const words = note.body.trim() ? note.body.trim().split(/\s+/).length : 0;
  $("word-count").textContent = `${words} ${words === 1 ? "word" : "words"} · ${note.body.length} characters`;
}

function openNote(id) {
  currentId = id;
  renderList();
  renderEditor();
  $("body").focus();
}

function editCurrent(change) {
  const note = current();
  if (!note) return;
  change(note);
  note.updated = Date.now();
  const saved = saveNotes();
  renderList();
  renderMeta(note, saved);
}

$("new-note").addEventListener("click", () => {
  const note = { id: newId(), title: "", body: "", pinned: false, created: Date.now(), updated: Date.now() };
  notes.push(note);
  saveNotes();
  query = "";
  $("search").value = "";
  currentId = note.id;
  renderList();
  renderEditor();
  $("title").focus();
});

$("search").addEventListener("input", (event) => {
  query = event.target.value.trim();
  renderList();
});

$("title").addEventListener("input", (event) =>
  editCurrent((note) => {
    note.title = event.target.value;
  }),
);
$("body").addEventListener("input", (event) =>
  editCurrent((note) => {
    note.body = event.target.value;
  }),
);

$("pin").addEventListener("click", () => {
  editCurrent((note) => {
    note.pinned = !note.pinned;
  });
  renderEditor();
});

$("delete").addEventListener("click", () => {
  const note = current();
  if (!note || !confirm(`Delete “${titleOf(note)}”? This can't be undone.`)) return;
  notes = notes.filter((n) => n.id !== note.id);
  saveNotes();
  currentId = null;
  renderList();
  renderEditor();
});

$("back").addEventListener("click", () => {
  currentId = null;
  renderList();
  renderEditor();
});

// Pick up edits made in another tab.
window.addEventListener("storage", (event) => {
  if (event.key !== storageKey) return;
  notes = loadNotes();
  if (!current()) currentId = null;
  renderList();
  renderEditor();
});

// Open the most recent note on wide screens; small screens start on the list.
if (notes.length && window.matchMedia("(min-width: 901px)").matches) {
  currentId = sortedNotes()[0].id;
}
renderList();
renderEditor();
