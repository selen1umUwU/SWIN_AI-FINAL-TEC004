/* ============================================
   SWINBURNE AI ADMISSION CONSULTANT — SCRIPT
   ============================================ */

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initMobileMenu();
  initChatWidget();
  initFaqChips();
  initChatLinks();
  initDynamicSections();
});

/* ---------- 0. NỘI DUNG ĐỘNG TỪ scraped_data.json ----------
   Tự điền nội dung các section (học bổng, ngành học) từ backend
   /api/section/<topic>. Backend trả về danh sách {title, value, desc} — tức là
   TÊN từng học bổng / từng ngành lấy từ dữ liệu scrape được, kèm 1 câu mô tả
   ngắn — nên card hiển thị gọn gàng chứ không đổ nguyên đoạn văn thô lên trang.
   Mỗi lần chạy lại scraper + khởi động server, nội dung này tự cập nhật.
   Nếu backend lỗi hoặc không có dữ liệu -> giữ nguyên card cứng có sẵn (fallback). */
function initDynamicSections() {
  // Card ngành học có ảnh -> chỉ thay CHỮ, giữ nguyên ảnh sẵn có trong assets/.
  fillSectionFromApi("programs", "programsGrid", { keepMedia: true });
  // Card học bổng vốn không có ảnh -> dựng lại hoàn toàn từ dữ liệu.
  fillSectionFromApi("scholarships", "scholarshipsGrid", { keepMedia: false });
}

async function fillSectionFromApi(topic, gridId, { keepMedia }) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  try {
    const res = await fetch(`/api/section/${topic}`);
    if (!res.ok) return; // giữ nội dung cứng làm fallback
    const data = await res.json();
    const items = (data.items || []).filter((it) => it.title || it.desc);
    if (items.length === 0) return; // không có dữ liệu -> giữ fallback

    if (keepMedia) {
      updateMediaCards(grid, items);
    } else {
      renderTextCards(grid, items);
    }

    // Ghi rõ nguồn để người dùng biết đây là dữ liệu cập nhật tự động từ web trường
    if (data.url) {
      const note = document.createElement("p");
      note.className = "section__source";
      note.innerHTML =
        `Nguồn: cập nhật tự động từ <a href="${data.url}" target="_blank" rel="noopener">website trường</a>`;
      grid.appendChild(note);
    }
  } catch (err) {
    console.error(`Không tải được nội dung động cho '${topic}':`, err);
    // Lỗi mạng -> giữ nguyên card cứng, không làm gì thêm
  }
}

/* Card CÓ ảnh: giữ nguyên thẻ <img> của card cứng, chỉ ghi đè tiêu đề + mô tả.
   Nếu dữ liệu có nhiều mục hơn số card sẵn có thì nhân bản card và dùng lại
   lần lượt các ảnh đang có — không bao giờ tự bịa đường dẫn ảnh mới (sẽ vỡ ảnh). */
function updateMediaCards(grid, items) {
  const templates = Array.from(grid.querySelectorAll(".card"));
  if (templates.length === 0) return;

  const cards = items.map((item, i) => {
    const card = i < templates.length
      ? templates[i]
      : templates[i % templates.length].cloneNode(true);

    const heading = card.querySelector("h3");
    const paragraph = card.querySelector(".card__body p, p");
    if (heading) heading.textContent = item.title;
    if (paragraph) paragraph.textContent = item.desc;
    return card;
  });

  grid.replaceChildren(...cards);
}

/* Card KHÔNG có ảnh (học bổng): dựng mới từ tên học bổng + giá trị + mô tả. */
function renderTextCards(grid, items) {
  const cards = items.map((item) => {
    const card = document.createElement("article");
    card.className = "card card--accent";

    if (item.title) {
      const heading = document.createElement("h3");
      heading.textContent = item.title;
      card.appendChild(heading);
    }
    if (item.value) {
      const value = document.createElement("p");
      value.className = "card__value";
      value.textContent = item.value;
      card.appendChild(value);
    }
    if (item.desc) {
      const desc = document.createElement("p");
      desc.textContent = item.desc;
      card.appendChild(desc);
    }
    return card;
  });

  grid.replaceChildren(...cards);
}

/* ---------- 1. DARK / LIGHT MODE ---------- */
function initTheme() {
  const root = document.documentElement;
  const toggleBtn = document.getElementById("themeToggle");
  const icon = toggleBtn.querySelector(".theme-toggle__icon");

  // Load saved preference, default to dark (Swinburne red-black)
  const saved = localStorage.getItem("swin-theme") || "dark";
  root.setAttribute("data-theme", saved);
  updateIcon(saved);

  toggleBtn.addEventListener("click", () => {
    const current = root.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("swin-theme", next);
    updateIcon(next);
  });

  function updateIcon(theme) {
    icon.textContent = theme === "dark" ? "◐" : "◑";
  }
}

/* ---------- 2. MOBILE MENU ---------- */
function initMobileMenu() {
  const menuBtn = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");

  menuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });

  // Close menu when a link is clicked
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => navLinks.classList.remove("open"));
  });
}

/* ---------- 3. CHAT WIDGET ---------- */
function initChatWidget() {
  const fab = document.getElementById("chatFab");
  const panel = document.getElementById("chatPanel");
  const closeBtn = document.getElementById("chatClose");
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");
  const messages = document.getElementById("chatMessages");
  const suggestions = document.getElementById("chatSuggestions");

  fab.addEventListener("click", () => {
    panel.classList.toggle("open");
    panel.setAttribute("aria-hidden", !panel.classList.contains("open"));
    if (panel.classList.contains("open")) input.focus();
  });

  closeBtn.addEventListener("click", () => {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const question = input.value.trim();
    if (!question) return;
    sendMessage(question);
    input.value = "";
  });

  suggestions.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      sendMessage(chip.dataset.question);
    });
  });

  function addMessage(text, sender) {
    const bubble = document.createElement("div");
    bubble.className = `msg msg--${sender}`;
    const p = document.createElement("p");
    p.innerHTML = marked.parse(text);
    bubble.appendChild(p);
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
    return bubble;
  }

  async function sendMessage(question) {
    // Ẩn hẳn toàn bộ nút gợi ý ngay khi người dùng gửi câu hỏi đầu tiên
    // (dù bấm chip gợi ý hay tự gõ), không hiện lại nữa.
    suggestions.style.display = "none";

    addMessage(question, "user");

    const typingBubble = addMessage("Đang soạn câu trả lời...", "bot");

    try {
      // TODO: replace with real backend endpoint, e.g. FastAPI /chat
      const answer = await fetchAIReply(question);
      typingBubble.querySelector("p").innerHTML = marked.parse(answer);
    } catch (err) {
      typingBubble.querySelector("p").textContent =
        "Xin lỗi, hiện chưa thể kết nối tới trợ lý AI. Vui lòng thử lại sau.";
      console.error("Chat error:", err);
    }
  }

  // Gọi backend FastAPI thật (/chat) — đã kết nối Gemini + Beeknoee fallback.
  async function fetchAIReply(question) {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, session_id: getSessionId() }),
    });
    if (!res.ok) {
      throw new Error(`Server trả về lỗi ${res.status}`);
    }
    const data = await res.json();
    return data.answer;
  }
}

/* ---------- 4. FAQ CHIPS ON PAGE -> OPEN CHAT WITH QUESTION ---------- */
function initFaqChips() {
  const chips = document.querySelectorAll(".faq-chip");
  const fab = document.getElementById("chatFab");
  const panel = document.getElementById("chatPanel");
  const input = document.getElementById("chatInput");
  const form = document.getElementById("chatForm");

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      panel.classList.add("open");
      panel.setAttribute("aria-hidden", "false");
      input.value = chip.dataset.question;
      form.dispatchEvent(new Event("submit", { cancelable: true }));
    });
  });
}

/* ---------- 6. ANY "#chat" LINK -> OPEN CHAT PANEL ---------- */
// href="#chat" trỏ tới 1 id không tồn tại trên trang (widget thật có
// id="chatWidget"), nên trình duyệt không làm gì cả. Thay vào đó, mọi link
// trỏ tới "#chat" (nút "Tư vấn ngay" ở navbar, hero, footer...) sẽ mở
// trực tiếp ô chat bằng JS.
function initChatLinks() {
  const panel = document.getElementById("chatPanel");
  const input = document.getElementById("chatInput");

  document.querySelectorAll('a[href="#chat"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      panel.classList.add("open");
      panel.setAttribute("aria-hidden", "false");
      input.focus();
    });
  });
}

/* ---------- 7. SESSION ID (for chat history, used once DB is connected) ---------- */
function getSessionId() {
  let id = localStorage.getItem("swin-chat-session");
  if (!id) {
    id = "sess_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
    localStorage.setItem("swin-chat-session", id);
  }
  return id;
}
