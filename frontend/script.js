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

/* ---------- 0a. SONG NGỮ VIỆT / ANH ---------- */
const TRANSLATIONS = {
  vi: {
    "html.lang": "vi",
    "util.campus": "Cơ sở",
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
    "campus.title": "Cơ sở Swinburne Việt Nam",
    "campus.subtitle": "Bốn cơ sở trên toàn quốc — Hà Nội, TP. Hồ Chí Minh, Đà Nẵng và Cần Thơ",
    "campus.hanoi": "Cơ sở Hà Nội",
    "campus.hcm": "Cơ sở TP. Hồ Chí Minh",
    "campus.danang": "Cơ sở Đà Nẵng",
    "campus.cantho": "Cơ sở Cần Thơ",
    "campus.tagNorth": "Miền Bắc",
    "campus.tagSouth": "Miền Nam",
    "campus.tagCentral": "Miền Trung",
    "campus.tagMekong": "Đồng bằng sông Cửu Long",
    "campus.address": "Địa chỉ",
    "campus.branch": "Cơ sở Hoà Lạc",
    "campus.hotline": "Hotline",
    "campus.majors": "Ngành đào tạo",
    "campus.allMajors": "Triển khai tất cả 15 chuyên ngành",
    "campus.majors8": "Triển khai 8 chuyên ngành:",
    "campus.majors5": "Triển khai 5 chuyên ngành:",
    "campus.note": "Cần tư vấn chọn cơ sở phù hợp?",
    "campus.noteCta": "Hỏi trợ lý AI",
    "source.prefix": "Nguồn: cập nhật tự động từ",
    "source.link": "website trường",
  },
  en: {
    "html.lang": "en",
    "util.campus": "Campuses",
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
    "campus.title": "Swinburne Vietnam campuses",
    "campus.subtitle": "Four campuses nationwide — Hanoi, Ho Chi Minh City, Da Nang and Can Tho",
    "campus.hanoi": "Hanoi campus",
    "campus.hcm": "Ho Chi Minh City campus",
    "campus.danang": "Da Nang campus",
    "campus.cantho": "Can Tho campus",
    "campus.tagNorth": "Northern Vietnam",
    "campus.tagSouth": "Southern Vietnam",
    "campus.tagCentral": "Central Vietnam",
    "campus.tagMekong": "Mekong Delta",
    "campus.address": "Address",
    "campus.branch": "Hoa Lac facility",
    "campus.hotline": "Hotline",
    "campus.majors": "Majors offered",
    "campus.allMajors": "All 15 majors offered",
    "campus.majors8": "8 majors offered:",
    "campus.majors5": "5 majors offered:",
    "campus.note": "Need help choosing a campus?",
    "campus.noteCta": "Ask the AI assistant",
    "source.prefix": "Source: automatically updated from",
    "source.link": "the university website",
  },
};

let currentLang = "vi";

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

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });

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

  document.querySelectorAll(".section__source[data-url]").forEach(renderSourceNote);

  document.querySelectorAll("#langSwitch .lang-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.lang === currentLang);
  });
}

function renderSourceNote(note) {
  note.innerHTML =
    `${t("source.prefix")} <a href="${note.dataset.url}" target="_blank" rel="noopener">${t("source.link")}</a>`;
}

/* ---------- 0. NỘI DUNG ĐỘNG TỪ scraped_data.json ---------- */
function initDynamicSections() {

  fillSectionFromApi("programs", "programsGrid", { keepMedia: true });

  fillSectionFromApi("scholarships", "scholarshipsGrid", { keepMedia: false });
}

async function fillSectionFromApi(topic, gridId, { keepMedia }) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  try {
    const res = await fetch(`/api/section/${topic}`);
    if (!res.ok) return;
    const data = await res.json();
    const items = (data.items || []).filter((it) => it.title || it.desc);
    if (items.length === 0) return;

    if (keepMedia) {
      updateMediaCards(grid, items);
    } else {
      renderTextCards(grid, items);
    }

    if (data.url) {
      const note = document.createElement("p");
      note.className = "section__source";
      note.dataset.url = data.url;
      renderSourceNote(note);
      grid.appendChild(note);
    }

    applyLanguage(currentLang);
  } catch (err) {
    console.error(`Không tải được nội dung động cho '${topic}':`, err);

  }
}

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
  if (!toggleBtn) return;
  const icon = toggleBtn.querySelector(".theme-toggle__icon");

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
  if (!menuBtn || !navLinks) return;

  menuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });

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

  if (!fab || !panel || !form || !input || !messages || !suggestions) return;

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
  const panel = document.getElementById("chatPanel");
  const input = document.getElementById("chatInput");
  const form = document.getElementById("chatForm");
  if (!panel || !input || !form) return;

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

function initChatLinks() {
  const panel = document.getElementById("chatPanel");
  const input = document.getElementById("chatInput");
  if (!panel || !input) return;

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
