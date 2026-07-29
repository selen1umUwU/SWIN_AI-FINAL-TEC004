/* ============================================
   SWINBURNE AI ADMISSION CONSULTANT — SCRIPT
   ============================================ */

document.addEventListener("DOMContentLoaded", () => {
  initLanguage();
  initTheme();
  initMobileMenu();
  initChatWidget();
  initFaqChips();
  initChatLinks();
  initDynamicSections();
});

/* ---------- 0a. SONG NGỮ VIỆT / ANH ----------
   Toàn bộ chữ cố định trên trang được gắn data-i18n="khoá" trong index.html;
   ở đây chỉ việc tra bảng dịch rồi ghi đè. Ngôn ngữ chọn xong được nhớ trong
   localStorage nên tải lại trang vẫn giữ nguyên.

   LƯU Ý: nội dung các card học bổng / ngành học lấy tự động từ website trường
   (vốn chỉ có tiếng Việt) nên phần đó vẫn hiển thị tiếng Việt. Chatbot cũng
   luôn trả lời tiếng Việt — đúng như yêu cầu. */
const TRANSLATIONS = {
  vi: {
    "html.lang": "vi",
    "util.campus": "Cơ sở",
    "util.events": "Sự kiện",
    "util.news": "Tin tức",
    "util.library": "Thư viện",
    "util.current": "Sinh viên hiện tại",
    "util.alumni": "Cựu sinh viên",
    "nav.programs": "Khoá học",
    "nav.scholarships": "Học bổng",
    "nav.faq": "Câu hỏi thường gặp",
    "nav.cta": "Tư vấn ngay",
    "theme.aria": "Chuyển chế độ sáng/tối",
    "theme.title": "Sáng / Tối",
    "menu.aria": "Mở menu",
    "hero.eyebrow": "Hệ thống tư vấn tuyển sinh AI · Vận hành 24/7",
    "hero.title1": "Thắp sáng tương lai",
    "hero.title2": "cùng Swinburne Việt Nam",
    "hero.bullet1": "Tư vấn tuyển sinh bằng AI, trả lời tức thì mọi lúc",
    "hero.bullet2": "Chương trình đại học <strong>TOP 300 thế giới</strong>",
    "hero.ctaChat": "Tư vấn ngay",
    "hero.ctaFaq": "Câu hỏi thường gặp",
    "hero.imgAlt": "Lễ tốt nghiệp Swinburne Việt Nam",
    "why.title": "Tại sao lựa chọn Swinburne Việt Nam?",
    "why.item1": "Nhận bằng từ trường Đại học TOP 300 thế giới (QS 2026)",
    "why.item2": "Chất lượng đào tạo kiểm định quốc tế",
    "why.item3": "Đào tạo kỹ năng công dân toàn cầu",
    "why.item4": "Kết nối trải nghiệm thực tế, doanh nghiệp",
    "why.item5": "Cơ hội việc làm tốt trong nước và quốc tế",
    "faq.title": "Câu hỏi thường gặp",
    "faq.subtitle": "Nhấn để hỏi trợ lý AI ngay lập tức",
    "faq.tuition": "Học phí",
    "faq.scholarship": "Học bổng",
    "faq.entry": "Điều kiện nhập học",
    "faq.transfer": "Du học chuyển tiếp",
    "faq.majors": "Ngành học",
    "faq.deadline": "Thời hạn hồ sơ",
    "programs.title": "Chương trình đào tạo tại Swinburne Việt Nam",
    "programs.subtitle": "Dữ liệu được cập nhật tự động từ swinburne-vn.edu.vn",
    "card.bachelor": "Cử nhân",
    "scholarships.title": "Học bổng nổi bật",
    "gallery.title": "Hoạt động sinh viên",
    "gallery.subtitle": "Khoảnh khắc từ cộng đồng Swinburne Việt Nam",
    "chat.open": "Mở trợ lý tư vấn AI",
    "chat.close": "Đóng chat",
    "chat.send": "Gửi",
    "chat.title": "Trợ lý tuyển sinh AI",
    "chat.greeting": "Xin chào 👋 Mình là trợ lý tuyển sinh AI của Swinburne Việt Nam. Bạn muốn hỏi về học phí, học bổng, ngành học hay điều kiện nhập học?",
    "chat.chipTuition": "Học phí?",
    "chat.chipScholarship": "Học bổng?",
    "chat.chipEntry": "Điều kiện nhập học?",
    "chat.placeholder": "Nhập câu hỏi của bạn...",
    "chat.typing": "Đang soạn câu trả lời...",
    "chat.error": "Xin lỗi, hiện chưa thể kết nối tới trợ lý AI. Vui lòng thử lại sau.",
    "chat.langNote": "(Trợ lý trả lời bằng tiếng Việt)",
    "footer.school": "Swinburne Việt Nam",
    "footer.admission": "Tuyển sinh",
    "footer.admission2026": "Tuyển sinh 2026",
    "footer.procedure": "Thủ tục tuyển sinh",
    "footer.contact": "Liên hệ",
    "footer.ai247": "Tư vấn AI 24/7",
    "footer.copyright": "© 2026 Swinburne University of Technology Vietnam. Hệ thống tư vấn tuyển sinh AI — Đồ án tốt nghiệp SE25/1.",
    "source.prefix": "Nguồn: cập nhật tự động từ",
    "source.link": "website trường",
  },
  en: {
    "html.lang": "en",
    "util.campus": "Campuses",
    "util.events": "Events",
    "util.news": "News",
    "util.library": "Library",
    "util.current": "Current students",
    "util.alumni": "Alumni",
    "nav.programs": "Courses",
    "nav.scholarships": "Scholarships",
    "nav.faq": "FAQ",
    "nav.cta": "Get advice",
    "theme.aria": "Toggle light/dark mode",
    "theme.title": "Light / Dark",
    "menu.aria": "Open menu",
    "hero.eyebrow": "AI admission consultant · Available 24/7",
    "hero.title1": "Light up your future",
    "hero.title2": "with Swinburne Vietnam",
    "hero.bullet1": "AI-powered admission advice, answered instantly anytime",
    "hero.bullet2": "A <strong>world TOP 300</strong> university programme",
    "hero.ctaChat": "Get advice",
    "hero.ctaFaq": "FAQ",
    "hero.imgAlt": "Swinburne Vietnam graduation ceremony",
    "why.title": "Why choose Swinburne Vietnam?",
    "why.item1": "Earn a degree from a world TOP 300 university (QS 2026)",
    "why.item2": "Internationally accredited teaching quality",
    "why.item3": "Global citizenship skills training",
    "why.item4": "Real-world and industry connections",
    "why.item5": "Strong career prospects at home and abroad",
    "faq.title": "Frequently asked questions",
    "faq.subtitle": "Tap to ask the AI assistant right away",
    "faq.tuition": "Tuition fees",
    "faq.scholarship": "Scholarships",
    "faq.entry": "Entry requirements",
    "faq.transfer": "Study abroad transfer",
    "faq.majors": "Majors",
    "faq.deadline": "Application deadline",
    "programs.title": "Programmes at Swinburne Vietnam",
    "programs.subtitle": "Automatically updated from swinburne-vn.edu.vn",
    "card.bachelor": "Bachelor",
    "scholarships.title": "Featured scholarships",
    "gallery.title": "Student life",
    "gallery.subtitle": "Moments from the Swinburne Vietnam community",
    "chat.open": "Open the AI advisor",
    "chat.close": "Close chat",
    "chat.send": "Send",
    "chat.title": "AI Admission Assistant",
    "chat.greeting": "Hi 👋 I'm the AI admission assistant of Swinburne Vietnam. Ask me about tuition fees, scholarships, majors or entry requirements.",
    "chat.chipTuition": "Tuition fees?",
    "chat.chipScholarship": "Scholarships?",
    "chat.chipEntry": "Entry requirements?",
    "chat.placeholder": "Type your question...",
    "chat.typing": "Writing an answer...",
    "chat.error": "Sorry, the AI assistant is unreachable right now. Please try again later.",
    "chat.langNote": "(The assistant replies in Vietnamese)",
    "footer.school": "Swinburne Vietnam",
    "footer.admission": "Admissions",
    "footer.admission2026": "Admissions 2026",
    "footer.procedure": "Admission procedure",
    "footer.contact": "Contact",
    "footer.ai247": "24/7 AI advice",
    "footer.copyright": "© 2026 Swinburne University of Technology Vietnam. AI admission consulting system — SE25/1 capstone project.",
    "source.prefix": "Source: automatically updated from",
    "source.link": "the university website",
  },
};

let currentLang = "vi";

/** Dịch 1 khoá sang ngôn ngữ đang chọn (không có thì trả lại chính khoá đó). */
function t(key) {
  return (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key]) || key;
}

function initLanguage() {
  const saved = localStorage.getItem("swin-lang");
  applyLanguage(TRANSLATIONS[saved] ? saved : "vi");

  document.querySelectorAll("#langSwitch .lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => applyLanguage(btn.dataset.lang));
  });
}

function applyLanguage(lang) {
  currentLang = TRANSLATIONS[lang] ? lang : "vi";
  localStorage.setItem("swin-lang", currentLang);
  document.documentElement.setAttribute("lang", t("html.lang"));

  // Chữ thuần: an toàn nhất, dùng cho hầu hết phần tử.
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  // Vài chỗ cần thẻ <strong> bên trong. Chuỗi dịch nằm ngay trong file này
  // (không phải dữ liệu người dùng nhập) nên gán innerHTML là an toàn.
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", t(el.dataset.i18nAria));
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.setAttribute("title", t(el.dataset.i18nTitle));
  });
  document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
    el.setAttribute("alt", t(el.dataset.i18nAlt));
  });

  // Dòng ghi nguồn có kèm link -> dựng lại theo ngôn ngữ mới.
  document.querySelectorAll(".section__source[data-url]").forEach(renderSourceNote);

  // Đánh dấu nút ngôn ngữ đang bật
  document.querySelectorAll("#langSwitch .lang-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.lang === currentLang);
  });
}

function renderSourceNote(note) {
  note.innerHTML =
    `${t("source.prefix")} <a href="${note.dataset.url}" target="_blank" rel="noopener">${t("source.link")}</a>`;
}

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
      note.dataset.url = data.url;   // để đổi ngôn ngữ còn dựng lại được
      renderSourceNote(note);
      grid.appendChild(note);
    }

    // Card vừa dựng lại có thể chứa phần tử cần dịch (vd: nhãn "Cử nhân").
    applyLanguage(currentLang);
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

    const typingBubble = addMessage(t("chat.typing"), "bot");

    try {
      const answer = await fetchAIReply(question);
      typingBubble.querySelector("p").innerHTML = marked.parse(answer);
    } catch (err) {
      typingBubble.querySelector("p").textContent = t("chat.error");
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
