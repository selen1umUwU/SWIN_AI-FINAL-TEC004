"""
scraper.py
----------
Scraper CÀO TOÀN BỘ website https://swinburne-vn.edu.vn/ (không chỉ trang chủ).

Cách hoạt động:
1. Bắt đầu từ trang chủ, tìm tất cả link nội bộ (cùng domain) trên trang.
2. Crawl tiếp từng link đó theo kiểu BFS (loang dần ra), cho tới khi hết link
   mới hoặc chạm giới hạn MAX_PAGES.
3. Với mỗi trang, lấy tiêu đề (h1) + nội dung (p, li, h2, h3).
4. Tự động loại bỏ các đoạn text bị LẶP LẠI trên hầu hết các trang
   (menu, footer, banner...) — vì đó là rác, không phải nội dung thật.
5. Lưu ra:
   - scraped_data.json  -> dữ liệu có cấu trúc (url, title, content) — ĐỊNH DẠNG
     LƯU TRỮ CHÍNH, main.py sẽ đọc trực tiếp từ file này.
   - scraped_data.csv   -> bản CSV để xem nhanh bằng Excel (tuỳ chọn, không bắt buộc)

Áp dụng kiến thức:
- Week 6: requests + BeautifulSoup, status_code check, try/except
- Week 4: dùng map()/filter()/lambda để làm sạch & lọc dữ liệu
- Week 5: export JSON + txt, logging từng bước
"""

import csv
import json
import logging
import sys
import time
from collections import deque, Counter
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8")

# ---------- CẤU HÌNH ----------
DOMAIN = "swinburne-vn.edu.vn"
START_URL = f"https://{DOMAIN}/"

SEED_URLS = [
    START_URL,
    "https://swinburne-vn.edu.vn/research/dich-vu-ket-noi-phu-huynh-parents-engagement/",
    "https://swinburne-vn.edu.vn/research/parent-portal-cong-ket-noi-phu-huynh/",
]

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    )
}

MAX_PAGES = 150
REQUEST_DELAY = 0.8
REQUEST_TIMEOUT = 15

SKIP_EXTENSIONS = (
    ".pdf", ".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp",
    ".zip", ".rar", ".mp4", ".mp3", ".doc", ".docx", ".xls", ".xlsx",
)

SKIP_URL_PATTERNS = (
    "/event/", "/tin-tuc/", "/thu-vien/", "/tag/", "/author/",
    "/category/", "/feed/", "/page/", "/wp-json/", "/wp-content/",
)

MIN_CONTENT_LINES = 4

BOILERPLATE_THRESHOLD = 0.35

OUTPUT_DIR = Path("scraped_data")
OUTPUT_DIR.mkdir(exist_ok=True)

# ---------- LOGGING (Week 5 style) ----------
logging.basicConfig(
    filename=OUTPUT_DIR / "scraper.log",
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)


def log(msg: str):
    print(msg)
    logging.info(msg)


# ---------- FUNCTIONAL CLEANING HELPERS (Week 4 style) ----------
def clean_text(raw: str) -> str:
    """Loại khoảng trắng thừa / ký tự xuống dòng lộn xộn."""
    return " ".join(raw.replace("\xa0", " ").split())


def clean_text_list(raw_list) -> list:
    """map() làm sạch từng chuỗi, filter() loại bỏ chuỗi quá ngắn (rác)."""
    cleaned = map(clean_text, raw_list)
    return list(filter(lambda s: len(s) > 15, cleaned))


# ---------- LINK DISCOVERY ----------
def is_internal_html_link(url: str) -> bool:
    parsed = urlparse(url)
    if parsed.netloc and DOMAIN not in parsed.netloc:
        return False
    if parsed.scheme not in ("", "http", "https"):
        return False
    if any(parsed.path.lower().endswith(ext) for ext in SKIP_EXTENSIONS):
        return False
    if any(pat in parsed.path.lower() for pat in SKIP_URL_PATTERNS):
        return False
    return True


def extract_links(soup: BeautifulSoup, base_url: str) -> list:
    links = []
    for a in soup.select("a[href]"):
        href = a.get("href", "").strip()
        if not href or href.startswith("#"):
            continue
        full_url = urljoin(base_url, href)
        full_url = full_url.split("#")[0]
        if is_internal_html_link(full_url):
            links.append(full_url)
    return links


# ---------- FETCH ----------
def fetch_soup(url: str):
    try:
        resp = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
        if resp.status_code != 200:
            log(f"[BỎ QUA] {url} -> status_code={resp.status_code}")
            return None
        content_type = resp.headers.get("Content-Type", "")
        if "text/html" not in content_type:
            return None
        return BeautifulSoup(resp.content, "html.parser")
    except requests.RequestException as e:
        log(f"[LỖI KẾT NỐI] {url}: {e}")
        return None


# ---------- PARSE 1 TRANG ----------
def parse_page(url: str, soup: BeautifulSoup) -> dict:
    title_tag = soup.select_one("h1")
    title = clean_text(title_tag.get_text()) if title_tag else url

    scope = soup.select_one("article, main, .entry-content") or soup

    raw_blocks = [el.get_text() for el in scope.select("p, li, h2, h3")]
    content = clean_text_list(raw_blocks)

    return {"url": url, "title": title, "content": content}


# ---------- CRAWL TOÀN SITE (BFS) ----------
def crawl_site() -> list:
    visited = set()
    queue = deque(SEED_URLS)
    pages = []

    while queue and len(visited) < MAX_PAGES:
        url = queue.popleft()
        if url in visited:
            continue
        visited.add(url)

        log(f"Đang crawl ({len(visited)}/{MAX_PAGES}): {url}")
        soup = fetch_soup(url)
        if soup is None:
            continue

        page_data = parse_page(url, soup)
        if page_data["content"]:
            pages.append(page_data)

        for link in extract_links(soup, url):
            if link not in visited and link not in queue:
                queue.append(link)

        time.sleep(REQUEST_DELAY)

    log(f"Crawl xong: {len(pages)} trang có nội dung / {len(visited)} trang đã ghé.")
    return pages


# ---------- LOẠI BỎ RÁC LẶP LẠI (menu/footer/banner) ----------
def remove_boilerplate(pages: list) -> list:
    """
    Nếu 1 đoạn text giống hệt nhau xuất hiện trên nhiều trang khác nhau
    (>= BOILERPLATE_THRESHOLD tỉ lệ số trang), gần như chắc chắn đó là
    menu/footer/banner lặp lại mọi trang -> loại bỏ khỏi nội dung.
    """
    total_pages = len(pages)
    if total_pages == 0:
        return pages

    counter = Counter()
    for page in pages:
        for line in set(page["content"]):
            counter[line] += 1

    boilerplate = {
        line for line, count in counter.items()
        if count / total_pages >= BOILERPLATE_THRESHOLD
    }
    log(f"Phát hiện {len(boilerplate)} dòng boilerplate (menu/footer) bị loại bỏ.")

    cleaned_pages = []
    for page in pages:
        filtered = [line for line in page["content"] if line not in boilerplate]
        if filtered:
            cleaned_pages.append({**page, "content": filtered})
    return cleaned_pages


# ---------- PERSISTENCE (Week 5 style) ----------
def export_json(pages: list, filename: str = "scraped_data.json"):
    path = OUTPUT_DIR / filename
    with open(path, "w", encoding="utf-8") as f:
        json.dump(pages, f, ensure_ascii=False, indent=2)
    log(f"Đã lưu {len(pages)} trang vào {path}")


def export_csv(pages: list, filename: str = "scraped_data.csv"):
    if not pages:
        return
    path = OUTPUT_DIR / filename
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(["url", "title", "content"])
        for page in pages:
            writer.writerow([page["url"], page["title"], " | ".join(page["content"])])
    log(f"Đã lưu {len(pages)} trang vào {path}")


def export_to_neon(pages: list) -> bool:
    """
    Đẩy kết quả scrape lên bảng scraped_pages trên Neon.

    Backend đọc dữ liệu từ DB chứ không đọc file, nên đây mới là bước làm cho
    nội dung mới thực sự có hiệu lực. Không kết nối được DB thì chỉ cảnh báo,
    file JSON/CSV vẫn đã lưu xong nên không mất công crawl.
    """
    try:
        import models
        import page_store
        from database import engine

        models.Base.metadata.create_all(bind=engine)
        saved = page_store.save_pages(pages)
        log(f"Đã đẩy {saved} trang lên bảng scraped_pages trên Neon.")
        return True
    except Exception as e:
        log(f"[CẢNH BÁO] Không đẩy được dữ liệu lên Neon: {e}")
        log("Chạy lại sau, hoặc gọi POST /api/scraped-data/sync khi server đã chạy.")
        return False


def verify_integrity(pages: list, filename: str = "scraped_data.json") -> bool:
    path = OUTPUT_DIR / filename
    try:
        with open(path, encoding="utf-8") as f:
            reloaded = json.load(f)
        ok = len(reloaded) == len(pages)
        log(f"Kiểm tra tính toàn vẹn: {'OK' if ok else 'LỖI'} "
            f"({len(reloaded)}/{len(pages)} trang)")
        return ok
    except Exception as e:
        log(f"[LỖI VERIFY] {e}")
        return False


# ---------- MAIN ----------
def scrape_swinburne_data():
    log("=" * 60)
    log(f"BẮT ĐẦU CRAWL TOÀN BỘ {START_URL}")
    log("=" * 60)

    pages = crawl_site()
    pages = remove_boilerplate(pages)

    before = len(pages)
    pages = [p for p in pages if len(p["content"]) >= MIN_CONTENT_LINES]
    log(f"Loại {before - len(pages)} trang stub (< {MIN_CONTENT_LINES} dòng nội dung).")

    export_json(pages)
    export_csv(pages)
    verify_integrity(pages)
    export_to_neon(pages)

    total_lines = sum(len(p["content"]) for p in pages)
    log(f"HOÀN TẤT. Tổng {len(pages)} trang, {total_lines} dòng nội dung sạch.")


if __name__ == "__main__":
    scrape_swinburne_data()
