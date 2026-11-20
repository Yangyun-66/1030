import { auth, db, firebaseApp, googleProvider } from "./firebase.js";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

console.info(`Firebase initialized for ${firebaseApp.options.projectId}`);

const today = new Date();
today.setHours(0, 0, 0, 0);
let selected = new Date(today);
let viewed = new Date(today);
let items = [];
let habits = [];
let unsubscribeItems = null;
let unsubscribeHabits = null;
let currentUser = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const keyDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const dateFrom = (value) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};
const weekday = (date) => "日一二三四五六"[date.getDay()];
const fmtDay = (date) => `${date.getMonth() + 1} 月 ${date.getDate()} 日`;
const same = (a, b) => keyDate(a) === keyDate(b);
const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char],
  );

const toast = (message) => {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => element.classList.remove("show"), 2600);
};

const showError = (message, error) => {
  console.error(message, error);
  toast(message);
};

const itemCollection = (uid) => collection(db, "users", uid, "items");
const habitCollection = (uid) => collection(db, "users", uid, "habits");

function seedItems() {
  const plusDays = (days) => {
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    return keyDate(date);
  };
  return [
    { date: plusDays(0), time: "09:00", title: "晨間伸展與閱讀", type: "task", done: true, priority: "一般" },
    { date: plusDays(0), time: "10:30", title: "產品設計週會", type: "event", done: false, priority: "一般" },
    { date: plusDays(0), time: "13:00", title: "完成首頁線框稿", type: "task", done: false, priority: "高" },
    { date: plusDays(0), time: "15:30", title: "和朋友喝咖啡", type: "event", done: false, priority: "一般" },
    { date: plusDays(0), time: "17:00", title: "整理本週工作筆記", type: "task", done: true, priority: "低" },
    { date: plusDays(1), time: "11:00", title: "採買週末食材", type: "task", done: false, priority: "一般" },
    { date: plusDays(3), time: "09:30", title: "回診", type: "event", done: false, priority: "一般" },
    { date: plusDays(3), time: "14:00", title: "提交專案提案", type: "task", done: false, priority: "高" },
    { date: plusDays(7), time: "18:30", title: "晚餐聚會", type: "event", done: false, priority: "一般" },
  ];
}

const seedHabits = [
  { name: "喝足 8 杯水", icon: "💧", done: false, streak: "每天一點點" },
  { name: "閱讀 20 分鐘", icon: "📖", done: false, streak: "每天一點點" },
  { name: "伸展運動", icon: "🧘", done: false, streak: "每天一點點" },
];

function stopListeners() {
  unsubscribeItems?.();
  unsubscribeHabits?.();
  unsubscribeItems = null;
  unsubscribeHabits = null;
}

async function seedCollectionIfEmpty(collectionRef, defaults, uid) {
  const snapshot = await getDocs(collectionRef);
  if (!snapshot.empty) return;
  const batch = writeBatch(db);
  defaults.forEach((value) => {
    const ref = doc(collectionRef);
    batch.set(ref, {
      ...value,
      uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
}

async function loadUserData(user) {
  const profileRef = doc(db, "users", user.uid);
  let profile = await getDoc(profileRef);
  const displayName = (user.displayName || "使用者").slice(0, 100);

  if (!profile.exists()) {
    await setDoc(profileRef, {
      uid: user.uid,
      name: displayName,
      initialized: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    profile = await getDoc(profileRef);
  } else if (profile.data().name !== displayName) {
    await updateDoc(profileRef, { name: displayName, updatedAt: serverTimestamp() });
    profile = await getDoc(profileRef);
  }

  if (!profile.data().initialized) {
    await Promise.all([
      seedCollectionIfEmpty(itemCollection(user.uid), seedItems(), user.uid),
      seedCollectionIfEmpty(habitCollection(user.uid), seedHabits, user.uid),
    ]);
    await updateDoc(profileRef, { initialized: true, updatedAt: serverTimestamp() });
  }

  unsubscribeItems = onSnapshot(
    itemCollection(user.uid),
    (snapshot) => {
      items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      render();
    },
    (error) => showError("讀取行程失敗，請確認 Firestore 規則已部署。", error),
  );
  unsubscribeHabits = onSnapshot(
    habitCollection(user.uid),
    (snapshot) => {
      habits = snapshot.docs.map((habit) => ({ id: habit.id, ...habit.data() }));
      renderHabits();
    },
    (error) => showError("讀取習慣失敗，請確認 Firestore 規則已部署。", error),
  );
}

function renderHeader() {
  $("#fullDate").textContent = `星期${weekday(today)}・${today.getFullYear()} 年 ${today.getMonth() + 1} 月 ${today.getDate()} 日`;
  $("#dayName").textContent = `星期${weekday(selected)}`;
  $("#dayDate").textContent = fmtDay(selected);
}

function renderItems() {
  const list = items
    .filter((item) => item.date === keyDate(selected))
    .sort((a, b) => a.time.localeCompare(b.time));
  $("#itemList").innerHTML =
    list
      .map(
        (item) => `<div class="item"><span class="time">${escapeHtml(item.time)}</span><input class="check" type="checkbox" data-id="${escapeHtml(item.id)}" ${item.done ? "checked" : ""} aria-label="完成${escapeHtml(item.title)}"><div><div class="item-title">${item.priority === "高" && !item.done ? '<span class="priority">▲ 高</span>' : ""}${escapeHtml(item.title)}</div><div class="item-meta">${item.type === "event" ? "行程" : "待辦任務"}${item.type === "task" ? `・截止 ${fmtDay(dateFrom(item.date))}` : ""}</div></div><div class="item-actions"><span class="tag ${item.type === "event" ? "event" : "task"}">${item.type === "event" ? "行程" : "任務"}</span><button class="delete-btn" data-delete="${escapeHtml(item.id)}" aria-label="刪除${escapeHtml(item.title)}" title="刪除">×</button></div></div>`,
      )
      .join("") || '<div class="subtle" style="text-align:center;padding:24px">今天還沒有安排，留一點空白也很好 🌿</div>';

  const done = list.filter((item) => item.done).length;
  $("#progressLabel").textContent = `${done} / ${list.length} 完成`;
  $("#progressBar").style.width = list.length ? `${(done / list.length) * 100}%` : "0%";
  $$(".check").forEach((checkbox) =>
    checkbox.addEventListener("change", async () => {
      try {
        await updateDoc(doc(db, "users", currentUser.uid, "items", checkbox.dataset.id), {
          done: checkbox.checked,
          updatedAt: serverTimestamp(),
        });
        toast(checkbox.checked ? "已完成，做得好！" : "已恢復為未完成");
      } catch (error) {
        showError("更新行程失敗。", error);
      }
    }),
  );
  $$('[data-delete]').forEach((button) =>
    button.addEventListener("click", async () => {
      const item = items.find((entry) => entry.id === button.dataset.delete);
      if (!item || !confirm(`確定要刪除「${item.title}」嗎？`)) return;
      try {
        await deleteDoc(doc(db, "users", currentUser.uid, "items", item.id));
        toast("項目已刪除");
      } catch (error) {
        showError("刪除行程失敗。", error);
      }
    }),
  );
  renderCalendar();
}

function renderCalendar() {
  const year = viewed.getFullYear();
  const month = viewed.getMonth();
  $("#monthTitle").textContent = `${year} 年 ${month + 1} 月`;
  const first = new Date(year, month, 1);
  const offset = first.getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const previousDays = new Date(year, month, 0).getDate();
  let html = "";

  for (let row = 0; row < 6; row += 1) {
    html += "<tr>";
    for (let column = 0; column < 7; column += 1) {
      const index = row * 7 + column - offset + 1;
      let date;
      let muted = false;
      if (index < 1) {
        date = new Date(year, month - 1, previousDays + index);
        muted = true;
      } else if (index > days) {
        date = new Date(year, month + 1, index - days);
        muted = true;
      } else {
        date = new Date(year, month, index);
      }
      const dateKey = keyDate(date);
      const dayItems = items.filter((item) => item.date === dateKey);
      const classes = [muted ? "muted" : "", same(date, today) ? "today" : "", same(date, selected) ? "selected" : ""].join(" ");
      html += `<td class="${classes}" data-date="${dateKey}"><span class="num">${date.getDate()}</span><span class="dots">${dayItems.slice(0, 3).map((item) => `<i class="${item.type === "task" ? "taskdot" : ""}"></i>`).join("")}</span></td>`;
    }
    html += "</tr>";
    if (row === 4 && offset + days <= 35) break;
  }

  $("#calendarBody").innerHTML = html;
  $$("#calendarBody td").forEach((cell) =>
    cell.addEventListener("click", () => {
      selected = dateFrom(cell.dataset.date);
      viewed = new Date(selected);
      render();
    }),
  );
  const preview = items
    .filter((item) => item.date === keyDate(selected))
    .sort((a, b) => a.time.localeCompare(b.time));
  $("#previewDate").textContent = `${fmtDay(selected)}${same(selected, today) ? "・今天" : ""}`;
  $("#previewCount").textContent = `${preview.length} 項`;
  $("#previewLines").innerHTML =
    preview
      .slice(0, 3)
      .map((item) => `<div class="preview-line"><b>${escapeHtml(item.time)}</b>${escapeHtml(item.title)}</div>`)
      .join("") || '<div class="preview-line">尚無安排</div>';
}

function renderHabits() {
  $("#habitList").innerHTML = habits
    .map(
      (habit) => `<div class="habit"><div class="habit-top"><span>${escapeHtml(habit.name)}</span><span class="habit-icon">${escapeHtml(habit.icon)}</span></div><div style="display:flex;align-items:center;justify-content:space-between"><small>${escapeHtml(habit.streak)}</small><input type="checkbox" data-habit="${escapeHtml(habit.id)}" ${habit.done ? "checked" : ""} aria-label="${escapeHtml(habit.name)}完成"></div></div>`,
    )
    .join("");
  $$("[data-habit]").forEach((checkbox) =>
    checkbox.addEventListener("change", async () => {
      try {
        await updateDoc(doc(db, "users", currentUser.uid, "habits", checkbox.dataset.habit), {
          done: checkbox.checked,
          updatedAt: serverTimestamp(),
        });
        toast(checkbox.checked ? "習慣已打卡 🌱" : "已取消打卡");
      } catch (error) {
        showError("更新習慣失敗。", error);
      }
    }),
  );
  $("#weekCount").textContent = habits.filter((habit) => habit.done).length;
}

function render() {
  renderHeader();
  renderItems();
  renderHabits();
}

$("#googleSignInBtn").addEventListener("click", async () => {
  $("#authError").textContent = "";
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Google sign-in failed", error);
    $("#authError").textContent =
      error.code === "auth/unauthorized-domain"
        ? "此網站網域尚未加入 Firebase Authentication 的授權網域。"
        : "登入失敗，請稍後再試。";
  }
});

$("#signOutBtn").addEventListener("click", async () => {
  stopListeners();
  try {
    await signOut(auth);
  } catch (error) {
    showError("登出失敗。", error);
  }
});

onAuthStateChanged(auth, async (user) => {
  stopListeners();
  currentUser = user;
  const gate = $("#authGate");
  gate.hidden = Boolean(user);
  $("#signOutBtn").hidden = !user;
  $("#userName").textContent = user?.displayName || "尚未登入";
  $("#userStatus").textContent = user ? "已登入・資料即時同步" : "登入以同步行程";
  $("#userAvatar").textContent = user?.displayName?.[0] || "G";
  items = [];
  habits = [];
  render();
  if (!user) return;
  try {
    await loadUserData(user);
  } catch (error) {
    $("#authGate").hidden = false;
    $("#authError").textContent = "無法連線 Firestore，請稍後再試。";
    showError("Firebase 資料同步初始化失敗。", error);
  }
});

$("#prevDay").onclick = () => {
  selected.setDate(selected.getDate() - 1);
  viewed = new Date(selected);
  render();
};
$("#nextDay").onclick = () => {
  selected.setDate(selected.getDate() + 1);
  viewed = new Date(selected);
  render();
};
$("#prevMonth").onclick = () => {
  viewed.setMonth(viewed.getMonth() - 1);
  renderCalendar();
};
$("#nextMonth").onclick = () => {
  viewed.setMonth(viewed.getMonth() + 1);
  renderCalendar();
};
$("#todayJump").onclick = () => {
  selected = new Date(today);
  viewed = new Date(today);
  render();
};

const dialog = $("#addDialog");
function openDialog() {
  if (!currentUser) return;
  $("#itemDate").value = keyDate(selected);
  dialog.showModal();
  $("#itemTitle").focus();
}
$("#addBtn").onclick = openDialog;
$("#addTaskInline").onclick = openDialog;
$("#closeDialog").onclick = () => dialog.close();
$("#cancelDialog").onclick = () => dialog.close();
$("#itemForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentUser) return;
  try {
    const date = $("#itemDate").value;
    await addDoc(itemCollection(currentUser.uid), {
      uid: currentUser.uid,
      title: $("#itemTitle").value.trim(),
      type: $("#itemType").value,
      date,
      time: $("#itemTime").value || "09:00",
      priority: $("#itemPriority").value,
      done: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    selected = dateFrom(date);
    viewed = new Date(selected);
    dialog.close();
    event.target.reset();
    $("#itemTime").value = "10:00";
    toast("已加入並同步至雲端");
  } catch (error) {
    showError("新增行程失敗。", error);
  }
});

$("#closeReminder").onclick = () => $("#reminderBox").remove();
$("#bell").onclick = () => {
  const box = $("#reminderBox");
  if (box) {
    box.scrollIntoView({ behavior: "smooth", block: "center" });
    box.style.outline = "2px solid #f3c59d";
    setTimeout(() => (box.style.outline = ""), 900);
  } else {
    toast("目前沒有新的提醒");
  }
};
$("#habitLink").onclick = () => toast("這裡可以查看每日習慣紀錄");
$(".nav button").parentElement?.querySelectorAll(".nav button").forEach((button) => {
  button.onclick = () => {
    $$(".nav button").forEach((navButton) => navButton.classList.remove("active"));
    button.classList.add("active");
    const target =
      button.dataset.view === "calendar"
        ? "calendarCard"
        : button.dataset.view === "habits"
          ? "habitsCard"
          : "todayCard";
    document.getElementById(target).scrollIntoView({ behavior: "smooth", block: "start" });
  };
});

$("#weekDots").innerHTML = Array.from(
  { length: 7 },
  (_, index) => `<span class="${index < 4 ? "on" : ""} ${index === 5 ? "today" : ""}"></span>`,
).join("");
render();
