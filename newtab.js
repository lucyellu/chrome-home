const STORAGE_KEY = "chromeHomeState";

const WALLPAPERS = [
  {
    file: "assets/wallpaper-dawn.svg",
    label: "Dawn ridge",
    credit: "Dawn Ridge"
  },
  {
    file: "assets/wallpaper-lake.svg",
    label: "Still lake",
    credit: "Still Lake"
  },
  {
    file: "assets/wallpaper-night.svg",
    label: "Night trail",
    credit: "Night Trail"
  }
];

const SEARCH_PROVIDERS = {
  google: { label: "Google", url: "https://www.google.com/search?q=" },
  bing: { label: "Bing", url: "https://www.bing.com/search?q=" },
  duckduckgo: { label: "DuckDuckGo", url: "https://duckduckgo.com/?q=" },
  brave: { label: "Brave", url: "https://search.brave.com/search?q=" }
};

const QUOTES = [
  ["Where focus goes, energy follows.", "Tony Robbins"],
  ["Do the next right thing with your whole attention.", "Unknown"],
  ["The successful warrior is the average person, with laser-like focus.", "Bruce Lee"],
  ["Simplicity is the ultimate sophistication.", "Leonardo da Vinci"],
  ["Almost everything will work again if you unplug it for a few minutes, including you.", "Anne Lamott"],
  ["You can do anything, but not everything.", "David Allen"],
  ["The secret of getting ahead is getting started.", "Mark Twain"],
  ["What you do every day matters more than what you do once in a while.", "Gretchen Rubin"]
];

const WEATHER_CODES = new Map([
  [0, ["sun", "Clear"]],
  [1, ["sun", "Mostly clear"]],
  [2, ["cloud", "Partly cloudy"]],
  [3, ["cloud", "Cloudy"]],
  [45, ["fog", "Fog"]],
  [48, ["fog", "Fog"]],
  [51, ["rain", "Drizzle"]],
  [53, ["rain", "Drizzle"]],
  [55, ["rain", "Drizzle"]],
  [61, ["rain", "Rain"]],
  [63, ["rain", "Rain"]],
  [65, ["rain", "Rain"]],
  [71, ["snow", "Snow"]],
  [73, ["snow", "Snow"]],
  [75, ["snow", "Snow"]],
  [80, ["rain", "Showers"]],
  [81, ["rain", "Showers"]],
  [82, ["rain", "Showers"]],
  [95, ["storm", "Storm"]]
]);

const DEFAULT_STATE = {
  name: "",
  focus: { text: "", done: false, date: "" },
  todos: [
    { id: "seed-1", text: "Pick a main focus", done: false },
    { id: "seed-2", text: "Clear one small task", done: false }
  ],
  shortcuts: [
    { id: "shortcut-1", name: "Gmail", url: "https://mail.google.com" },
    { id: "shortcut-2", name: "Calendar", url: "https://calendar.google.com" },
    { id: "shortcut-3", name: "Drive", url: "https://drive.google.com" }
  ],
  settings: {
    backgroundIndex: 0,
    searchProvider: "google",
    units: "fahrenheit",
    showWeather: true,
    showShortcuts: true,
    showTodo: true,
    showQuote: true,
    weatherLocation: ""
  },
  weather: null
};

let state = structuredClone(DEFAULT_STATE);

const $ = (selector) => document.querySelector(selector);

const els = {
  dashboard: $("#dashboard"),
  clock: $("#clock"),
  greeting: $("#greeting"),
  quoteRegion: $("#quoteRegion"),
  quoteText: $("#quoteText"),
  quoteAuthor: $("#quoteAuthor"),
  photoCredit: $("#photoCredit"),
  searchForm: $("#searchForm"),
  searchInput: $("#searchInput"),
  focusPrompt: $("#focusPrompt"),
  focusForm: $("#focusForm"),
  focusInput: $("#focusInput"),
  focusCurrent: $("#focusCurrent"),
  focusDone: $("#focusDone"),
  focusText: $("#focusText"),
  clearFocus: $("#clearFocus"),
  shortcutsRegion: $("#shortcutsRegion"),
  shortcutList: $("#shortcutList"),
  addShortcutButton: $("#addShortcutButton"),
  shortcutDialog: $("#shortcutDialog"),
  shortcutForm: $("#shortcutForm"),
  closeShortcutDialog: $("#closeShortcutDialog"),
  shortcutName: $("#shortcutName"),
  shortcutUrl: $("#shortcutUrl"),
  todoToggle: $("#todoToggle"),
  todoDrawer: $("#todoDrawer"),
  closeTodo: $("#closeTodo"),
  todoForm: $("#todoForm"),
  todoInput: $("#todoInput"),
  todoList: $("#todoList"),
  clearCompleted: $("#clearCompleted"),
  settingsButton: $("#settingsButton"),
  settingsDialog: $("#settingsDialog"),
  settingsForm: $("#settingsForm"),
  closeSettingsDialog: $("#closeSettingsDialog"),
  nameInput: $("#nameInput"),
  searchProvider: $("#searchProvider"),
  weatherLocation: $("#weatherLocation"),
  weatherUnits: $("#weatherUnits"),
  showWeather: $("#showWeather"),
  showShortcuts: $("#showShortcuts"),
  showTodo: $("#showTodo"),
  showQuote: $("#showQuote"),
  backgroundOptions: $("#backgroundOptions"),
  locateButton: $("#locateButton"),
  weatherButton: $("#weatherButton"),
  weatherIcon: $("#weatherIcon"),
  weatherSummary: $("#weatherSummary")
};

init();

async function init() {
  state = mergeState(DEFAULT_STATE, await loadState());
  resetDailyFocusIfNeeded();
  buildSettingsOptions();
  bindEvents();
  renderAll();
  tickClock();
  setInterval(tickClock, 1000);
  if (state.settings.showWeather) {
    refreshWeather(false);
  }
}

function mergeState(base, incoming) {
  return {
    ...structuredClone(base),
    ...incoming,
    focus: { ...base.focus, ...(incoming?.focus ?? {}) },
    settings: { ...base.settings, ...(incoming?.settings ?? {}) },
    todos: Array.isArray(incoming?.todos) ? incoming.todos : base.todos,
    shortcuts: Array.isArray(incoming?.shortcuts) ? incoming.shortcuts : base.shortcuts
  };
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function dayNumber() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const diff = Date.now() - start.getTime() + (start.getTimezoneOffset() - new Date().getTimezoneOffset()) * 60000;
  return Math.floor(diff / 86400000);
}

function resetDailyFocusIfNeeded() {
  if (state.focus.text && state.focus.date && state.focus.date !== todayKey()) {
    state.focus = { text: "", done: false, date: "" };
    saveState();
  }
}

function bindEvents() {
  els.searchForm.addEventListener("submit", handleSearch);
  els.focusForm.addEventListener("submit", handleFocusSubmit);
  els.focusDone.addEventListener("change", handleFocusToggle);
  els.clearFocus.addEventListener("click", () => {
    state.focus = { text: "", done: false, date: "" };
    saveAndRender();
  });

  els.todoToggle.addEventListener("click", openTodo);
  els.closeTodo.addEventListener("click", closeTodo);
  els.todoForm.addEventListener("submit", addTodo);
  els.clearCompleted.addEventListener("click", clearCompletedTodos);

  els.addShortcutButton.addEventListener("click", () => {
    els.shortcutForm.reset();
    openDialog(els.shortcutDialog);
    setTimeout(() => els.shortcutName.focus(), 40);
  });
  els.closeShortcutDialog.addEventListener("click", () => els.shortcutDialog.close());
  els.shortcutForm.addEventListener("submit", addShortcut);

  els.settingsButton.addEventListener("click", openSettings);
  els.closeSettingsDialog.addEventListener("click", () => els.settingsDialog.close());
  els.settingsForm.addEventListener("submit", saveSettings);
  els.locateButton.addEventListener("click", () => refreshWeather(true));
  els.weatherButton.addEventListener("click", () => refreshWeather(true));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeTodo();
    }
  });
}

function tickClock() {
  const now = new Date();
  els.clock.textContent = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const hour = now.getHours();
  const part = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const suffix = state.name ? `, ${state.name}` : "";
  els.greeting.textContent = `Good ${part}${suffix}.`;
}

function renderAll() {
  renderBackground();
  renderQuote();
  renderFocus();
  renderTodos();
  renderShortcuts();
  renderWeather();
  renderVisibility();
  syncSettingsForm();
}

function renderBackground() {
  const index = clampIndex(state.settings.backgroundIndex, WALLPAPERS.length);
  const wallpaper = WALLPAPERS[index];
  document.documentElement.style.setProperty("--wallpaper", `url("${wallpaper.file}")`);
  els.photoCredit.textContent = wallpaper.credit;
}

function renderQuote() {
  const quote = QUOTES[dayNumber() % QUOTES.length];
  els.quoteText.textContent = quote[0];
  els.quoteAuthor.textContent = quote[1];
}

function renderFocus() {
  const hasFocus = Boolean(state.focus.text);
  els.focusPrompt.classList.toggle("hidden", hasFocus);
  els.focusCurrent.classList.toggle("hidden", !hasFocus);
  els.focusText.textContent = state.focus.text;
  els.focusDone.checked = state.focus.done;
}

function renderTodos() {
  els.todoList.replaceChildren();
  if (!state.todos.length) {
    const empty = document.createElement("li");
    empty.className = "todo-empty";
    empty.textContent = "Nothing here yet.";
    els.todoList.append(empty);
    return;
  }

  for (const todo of state.todos) {
    const item = document.createElement("li");
    item.className = `todo-item${todo.done ? " done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;
    checkbox.setAttribute("aria-label", `Mark ${todo.text} complete`);
    checkbox.addEventListener("change", () => {
      todo.done = checkbox.checked;
      saveAndRender();
    });

    const text = document.createElement("span");
    text.textContent = todo.text;

    const remove = document.createElement("button");
    remove.className = "icon-button ghost";
    remove.type = "button";
    remove.title = "Delete task";
    remove.setAttribute("aria-label", `Delete ${todo.text}`);
    remove.append(makeIcon("x"));
    remove.addEventListener("click", () => {
      state.todos = state.todos.filter((entry) => entry.id !== todo.id);
      saveAndRender();
    });

    item.append(checkbox, text, remove);
    els.todoList.append(item);
  }
}

function renderShortcuts() {
  els.shortcutList.replaceChildren();
  for (const shortcut of state.shortcuts) {
    const link = document.createElement("a");
    link.className = "shortcut";
    link.href = normalizeUrl(shortcut.url);
    link.title = shortcut.url;

    const badge = document.createElement("small");
    badge.textContent = shortcut.name.slice(0, 1).toUpperCase();

    const text = document.createElement("span");
    text.textContent = shortcut.name;

    link.append(badge, text);
    link.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      state.shortcuts = state.shortcuts.filter((entry) => entry.id !== shortcut.id);
      saveAndRender();
    });
    els.shortcutList.append(link);
  }
}

function renderWeather() {
  if (!state.weather) {
    els.weatherIcon.textContent = "--";
    els.weatherSummary.textContent = "Weather";
    return;
  }
  els.weatherIcon.textContent = state.weather.icon;
  els.weatherSummary.textContent = `${Math.round(state.weather.temperature)}° ${state.weather.place}`;
}

function renderVisibility() {
  els.weatherButton.classList.toggle("hidden", !state.settings.showWeather);
  els.shortcutsRegion.classList.toggle("hidden", !state.settings.showShortcuts);
  els.todoToggle.classList.toggle("hidden", !state.settings.showTodo);
  els.quoteRegion.classList.toggle("hidden", !state.settings.showQuote);
}

function buildSettingsOptions() {
  els.searchProvider.replaceChildren();
  for (const [value, provider] of Object.entries(SEARCH_PROVIDERS)) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = provider.label;
    els.searchProvider.append(option);
  }

  els.backgroundOptions.replaceChildren();
  WALLPAPERS.forEach((wallpaper, index) => {
    const button = document.createElement("button");
    button.className = "background-option";
    button.type = "button";
    button.title = wallpaper.label;
    button.setAttribute("aria-label", wallpaper.label);
    button.style.backgroundImage = `url("${wallpaper.file}")`;
    button.addEventListener("click", () => {
      state.settings.backgroundIndex = index;
      saveAndRender();
    });
    els.backgroundOptions.append(button);
  });
}

function syncSettingsForm() {
  els.nameInput.value = state.name;
  els.searchProvider.value = state.settings.searchProvider;
  els.weatherLocation.value = state.settings.weatherLocation;
  els.weatherUnits.value = state.settings.units;
  els.showWeather.checked = state.settings.showWeather;
  els.showShortcuts.checked = state.settings.showShortcuts;
  els.showTodo.checked = state.settings.showTodo;
  els.showQuote.checked = state.settings.showQuote;
  [...els.backgroundOptions.children].forEach((child, index) => {
    child.classList.toggle("active", index === clampIndex(state.settings.backgroundIndex, WALLPAPERS.length));
  });
}

function handleSearch(event) {
  event.preventDefault();
  const query = els.searchInput.value.trim();
  if (!query) return;
  const provider = SEARCH_PROVIDERS[state.settings.searchProvider] ?? SEARCH_PROVIDERS.google;
  window.location.assign(provider.url + encodeURIComponent(query));
}

function handleFocusSubmit(event) {
  event.preventDefault();
  const text = els.focusInput.value.trim();
  if (!text) return;
  state.focus = { text, done: false, date: todayKey() };
  els.focusInput.value = "";
  saveAndRender();
}

function handleFocusToggle() {
  state.focus.done = els.focusDone.checked;
  saveState();
  renderFocus();
}

function addTodo(event) {
  event.preventDefault();
  const text = els.todoInput.value.trim();
  if (!text) return;
  state.todos.unshift({ id: crypto.randomUUID(), text, done: false });
  els.todoInput.value = "";
  saveAndRender();
}

function clearCompletedTodos() {
  state.todos = state.todos.filter((todo) => !todo.done);
  saveAndRender();
}

function addShortcut(event) {
  event.preventDefault();
  const name = els.shortcutName.value.trim();
  const url = normalizeUrl(els.shortcutUrl.value.trim());
  if (!name || !url) return;
  state.shortcuts.push({ id: crypto.randomUUID(), name, url });
  saveAndRender();
  els.shortcutDialog.close();
}

function openSettings() {
  syncSettingsForm();
  openDialog(els.settingsDialog);
}

function saveSettings(event) {
  event.preventDefault();
  state.name = els.nameInput.value.trim();
  state.settings.searchProvider = els.searchProvider.value;
  state.settings.weatherLocation = els.weatherLocation.value.trim();
  state.settings.units = els.weatherUnits.value;
  state.settings.showWeather = els.showWeather.checked;
  state.settings.showShortcuts = els.showShortcuts.checked;
  state.settings.showTodo = els.showTodo.checked;
  state.settings.showQuote = els.showQuote.checked;
  saveAndRender();
  els.settingsDialog.close();
  if (state.settings.showWeather) {
    refreshWeather(true);
  }
}

async function refreshWeather(forceGeolocation) {
  if (!state.settings.showWeather) return;
  els.weatherSummary.textContent = "Updating";
  try {
    const place = state.settings.weatherLocation;
    const coords = place && !forceGeolocation ? await geocode(place) : await locate();
    const unit = state.settings.units === "celsius" ? "celsius" : "fahrenheit";
    const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
    weatherUrl.searchParams.set("latitude", coords.latitude);
    weatherUrl.searchParams.set("longitude", coords.longitude);
    weatherUrl.searchParams.set("current", "temperature_2m,weather_code");
    weatherUrl.searchParams.set("temperature_unit", unit);
    const response = await fetch(weatherUrl);
    if (!response.ok) throw new Error("Weather request failed");
    const payload = await response.json();
    const code = payload.current?.weather_code ?? 0;
    const [icon, label] = WEATHER_CODES.get(code) ?? ["cloud", "Weather"];
    state.weather = {
      icon: iconForWeather(icon),
      label,
      place: coords.name,
      temperature: payload.current?.temperature_2m ?? 0,
      updatedAt: Date.now()
    };
    saveAndRender();
  } catch (error) {
    state.weather = null;
    els.weatherIcon.textContent = "--";
    els.weatherSummary.textContent = "Set weather";
  }
}

async function geocode(place) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", place);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");
  const response = await fetch(url);
  if (!response.ok) throw new Error("Location lookup failed");
  const payload = await response.json();
  const match = payload.results?.[0];
  if (!match) throw new Error("Location not found");
  return {
    latitude: match.latitude,
    longitude: match.longitude,
    name: match.name
  };
}

function locate() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation unavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          name: "Local"
        });
      },
      reject,
      { maximumAge: 30 * 60 * 1000, timeout: 8000 }
    );
  });
}

function openTodo() {
  els.todoDrawer.classList.add("open");
  els.todoDrawer.setAttribute("aria-hidden", "false");
  setTimeout(() => els.todoInput.focus(), 80);
}

function closeTodo() {
  els.todoDrawer.classList.remove("open");
  els.todoDrawer.setAttribute("aria-hidden", "true");
}

function openDialog(dialog) {
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
}

function saveAndRender() {
  saveState();
  renderAll();
}

async function loadState() {
  if (globalThis.chrome?.storage?.local) {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] ?? {};
  }
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveState() {
  if (globalThis.chrome?.storage?.local) {
    chrome.storage.local.set({ [STORAGE_KEY]: state });
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function normalizeUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function clampIndex(value, length) {
  const index = Number(value);
  return Number.isInteger(index) && index >= 0 && index < length ? index : 0;
}

function iconForWeather(kind) {
  return {
    sun: "☀",
    cloud: "☁",
    fog: "≋",
    rain: "☂",
    snow: "✳",
    storm: "⚡"
  }[kind] ?? "☁";
}

function makeIcon(type) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", type === "x" ? "M18 6 6 18M6 6l12 12" : "M12 5v14M5 12h14");
  svg.append(path);
  return svg;
}
