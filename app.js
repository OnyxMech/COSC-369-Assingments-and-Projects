// User story 01: Add a basic event
const STORAGE_KEY = "calendar-events";
const HOUR_HEIGHT = 48; // must match --hour in style.css
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

let events = loadEvents();
let weekStart = startOfWeek(new Date());

const form = document.getElementById("event-form");
const errorBox = document.getElementById("form-errors");
const grid = document.getElementById("week-grid");
const weekLabel = document.getElementById("week-label");

/* ---------- storage ---------- */
function loadEvents() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveEvents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

/* ---------- date helpers ---------- */
function startOfWeek(d) {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  s.setDate(s.getDate() - ((s.getDay() + 6) % 7)); // Monday
  return s;
}

function toISODate(d) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function parseISODate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(n) {
  const h = String(Math.floor(n / 60)).padStart(2, "0");
  const m = String(n % 60).padStart(2, "0");
  return `${h}:${m}`;
}

/* ---------- validation ---------- */
function validate({ title, date, start, end }) {
  const errors = [];
  if (!title) errors.push("Title is required.");
  if (!date) errors.push("Date is required.");
  if (!start) errors.push("Start time is required.");
  if (start && end && toMinutes(end) <= toMinutes(start)) {
    errors.push("End time must be after the start time.");
  }
  return errors;
}

function showErrors(errors) {
  errorBox.replaceChildren();
  if (errors.length === 0) {
    errorBox.hidden = true;
    return;
  }
  const ul = document.createElement("ul");
  errors.forEach((msg) => {
    const li = document.createElement("li");
    li.textContent = msg;
    ul.appendChild(li);
  });
  errorBox.appendChild(ul);
  errorBox.hidden = false;
}

/* ---------- add event ---------- */
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = {
    title: document.getElementById("title").value.trim(),
    date: document.getElementById("date").value,
    start: document.getElementById("start").value,
    end: document.getElementById("end").value,
  };

  const errors = validate(data);
  showErrors(errors);
  if (errors.length > 0) return;

  // If no end time is given, default to one hour after the start.
  if (!data.end) data.end = fromMinutes(Math.min(toMinutes(data.start) + 60, 24 * 60 - 1));

  events.push({ id: Date.now(), ...data });
  saveEvents();

  weekStart = startOfWeek(parseISODate(data.date)); // jump to the event's week
  render();
  form.reset();
  document.getElementById("date").value = data.date;
});

/* ---------- render week ---------- */
function render() {
  grid.replaceChildren();

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    days.push(d);
  }

  const fmt = { month: "short", day: "numeric" };
  weekLabel.textContent =
    `${days[0].toLocaleDateString(undefined, fmt)} – ${days[6].toLocaleDateString(undefined, fmt)}, ${days[6].getFullYear()}`;

  // header row
  grid.appendChild(document.createElement("div")); // corner
  const todayISO = toISODate(new Date());
  days.forEach((d, i) => {
    const head = document.createElement("div");
    head.className = "day-head" + (toISODate(d) === todayISO ? " today" : "");
    head.textContent = `${DAY_NAMES[i]} ${d.getDate()}`;
    grid.appendChild(head);
  });

  // time labels
  const timeCol = document.createElement("div");
  timeCol.className = "time-col";
  for (let h = 1; h < 24; h++) {
    const label = document.createElement("span");
    label.className = "hour-label";
    label.style.top = `${h * HOUR_HEIGHT}px`;
    label.textContent = fromMinutes(h * 60);
    timeCol.appendChild(label);
  }
  grid.appendChild(timeCol);

  // day columns with events
  days.forEach((d) => {
    const col = document.createElement("div");
    col.className = "day-col";
    events
      .filter((ev) => ev.date === toISODate(d))
      .forEach((ev) => col.appendChild(createEventElement(ev)));
    grid.appendChild(col);
  });
}

function createEventElement(ev) {
  const startMin = toMinutes(ev.start);
  const endMin = toMinutes(ev.end);
  const el = document.createElement("div");
  el.className = "event";
  el.style.top = `${(startMin / 60) * HOUR_HEIGHT}px`;
  el.style.height = `${Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 20)}px`;

  const title = document.createElement("strong");
  title.textContent = ev.title; // textContent avoids HTML injection
  const time = document.createElement("small");
  time.textContent = `${ev.start} – ${ev.end}`;
  el.append(title, time);
  return el;
}

/* ---------- week navigation ---------- */
document.getElementById("prev-week").addEventListener("click", () => {
  weekStart.setDate(weekStart.getDate() - 7);
  render();
});
document.getElementById("next-week").addEventListener("click", () => {
  weekStart.setDate(weekStart.getDate() + 7);
  render();
});

/* ---------- init ---------- */
document.getElementById("date").value = toISODate(new Date());
render();
