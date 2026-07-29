# Swinburne Vietnam — AI Admission Consulting Website

Đồ án tốt nghiệp SE25/1 — Hệ thống tư vấn tuyển sinh AI cho Swinburne Việt Nam.

## Cấu trúc thư mục

```
swinburne-project/
├── backend/
│   ├── main.py            # FastAPI app: endpoint /chat, retrieval BM25, fallback Gemini -> OpenRouter, phục vụ luôn frontend
│   ├── database.py        # Kết nối Postgres (Neon.tech) qua SQLAlchemy
│   ├── models.py          # 3 model: ChatHistory, ScrapedPage, ScrapeRun
│   ├── page_store.py      # Đọc/ghi bảng scraped_pages và scrape_runs trên Neon
│   ├── scraper.py         # Crawl toàn bộ swinburne-vn.edu.vn -> Neon + backend/scraped_data/
│   ├── scraped_data/      # scraped_data.json, scraped_data.csv, scraper.log (do scraper.py sinh ra)
│   ├── requirements.txt   # Danh sách thư viện Python cần cài
│   └── .env.example       # Mẫu file .env (copy thành .env và điền key thật)
│
├── frontend/
│   ├── index.html         # Trang chính (navbar, hero, FAQ, chương trình, học bổng, gallery, chat widget)
│   ├── campuses.html      # Trang giới thiệu 4 cơ sở (Hà Nội, Đà Nẵng, TP.HCM, Cần Thơ)
│   ├── style.css          # Theme đỏ-đen Swinburne, dark/light mode, responsive
│   ├── script.js          # Xử lý theme toggle, chat widget, gọi API /chat
│   └── assets/            # Logo, ảnh, icon (đã có sẵn)
│
└── eval/                  # Bộ đo hiệu năng chatbot (xem eval/README.md)
    ├── eval_queries.jsonl # 53 câu hỏi kiểm thử + đáp án chuẩn
    ├── evaluate.py        # Chấm điểm từng câu, tổng hợp chỉ số, vẽ biểu đồ
    └── results/           # Kết quả mỗi lần chạy (bị .gitignore)
```

## Cách chạy

### 1. Cài đặt backend

```bash
cd backend
pip install -r requirements.txt --break-system-packages
```

Tạo file `.env` (copy từ `.env.example`) và điền:
```
GEMINI_API_KEY=...
OPENROUTER_API_KEY=...
DATABASE_URL=postgresql://...@...neon.tech/...?sslmode=require
```

`.env.example` còn một biến tuỳ chọn là `FORCE_PRIMARY_FAILURE` (mặc định `0`) —
xem mục [Bộ đo hiệu năng](#bộ-đo-hiệu-năng-eval).

### 2. Chạy scraper (lấy dữ liệu thật từ website trường)

```bash
python scraper.py
```
Sẽ mất vài phút vì crawl nhiều trang. Dữ liệu ghi thẳng lên bảng `scraped_pages`
của Neon, đồng thời sinh bản sao dưới máy trong thư mục `backend/scraped_data/`
(`scraped_data.json`, `scraped_data.csv`, `scraper.log`) — thư mục này do
`scraper.py` tự tạo, không phải đặt tay.

### 3. Chạy server

```bash
uvicorn main:app --reload
```

Mở trình duyệt tại `http://127.0.0.1:8000`. Không cần copy frontend đi đâu cả:
`main.py` trỏ thẳng `FRONTEND_DIR` sang `../frontend` rồi mount thư mục đó, nên
sửa file trong `frontend/` là F5 thấy ngay.

## Dữ liệu nằm ở đâu

Tất cả đều nằm trên cùng một database Neon:

| Bảng | Nội dung |
|---|---|
| `chat_history` | Lịch sử hỏi đáp, dùng cho trí nhớ ngắn hạn của chatbot |
| `scraped_pages` | Dữ liệu crawl từ website trường — **nguồn chính** backend đọc |
| `scrape_runs` | Log từng lần chạy scraper (thời gian, số trang, toàn văn log) |

`scraped_data.json` và `scraper.log` trong `backend/scraped_data/` chỉ là bản sao
dưới máy: file JSON dùng để nạp lần đầu khi bảng còn rỗng và làm phương án dự
phòng khi mất kết nối DB. Sau khi deploy lên Render thì không mở được file trong
container, nên xem dữ liệu và log phải qua Neon hoặc qua các endpoint bên dưới.

## Endpoint

| Endpoint | Tác dụng |
|---|---|
| `POST /chat` | Hỏi chatbot |
| `GET /api/section/{topic}` | Nội dung động cho frontend (`programs`, `scholarships`, `tuition`) |
| `GET /api/scraped-data` | Xem dữ liệu crawl đang nằm trong Neon |
| `POST /api/scraped-data/sync` | Đẩy lại `scraped_data.json` lên Neon rồi nạp vào bộ nhớ |
| `GET /api/scrape-logs` | Xem log các lần chạy scraper (`?full=true` để lấy nguyên văn) |

## Kiến trúc xử lý AI

Mỗi câu hỏi sẽ:
1. Xếp hạng trang liên quan bằng BM25 + IDF trên dữ liệu trong `scraped_pages`,
   có bỏ dấu tiếng Việt nên gõ "hoc bong" vẫn khớp "học bổng".
2. Trong các trang đó chỉ lấy những **đoạn** thật sự khớp câu hỏi, kèm các đoạn
   liền kề để tiêu đề không bị tách khỏi danh sách nội dung của nó.
3. Ghép thêm từ khoá của vài câu hỏi trước trong phiên chat (trọng số thấp) để
   hiểu được câu hỏi nối tiếp kiểu "điều kiện để nhận nó là gì?".
4. Dựng system prompt riêng cho câu hỏi đó (`build_system_prompt`).
5. Gọi **API 1: Gemini** trước. Nếu lỗi (hết quota, timeout...) → tự động chuyển
   **API 2: OpenRouter** (model free `nvidia/nemotron-3-nano-30b-a3b:free`).
6. Nếu cả 2 đều lỗi → trả về câu thông báo kèm hotline.
7. Lưu lịch sử chat vào `chat_history`.

## Bộ đo hiệu năng (eval/)

Thư mục `eval/` chấm điểm chatbot bằng 53 câu hỏi có đáp án chuẩn, chia 6 nhóm
(đúng phạm vi, ngoài phạm vi, thiếu dữ liệu trong KB, tấn công prompt...). Chạy
`python evaluate.py` khi server đang bật, kết quả ra `eval/results/<timestamp>/`
gồm số liệu tổng hợp và biểu đồ. Chi tiết cách chạy, ý nghĩa từng chỉ số và giới
hạn của phương pháp đo nằm trong [`eval/README.md`](eval/README.md).

Biến môi trường `FORCE_PRIMARY_FAILURE=1` ép `ask_gemini()` trong `main.py` ném
lỗi ngay, mô phỏng Gemini trả HTTP 429 để đo cơ chế failover sang OpenRouter:

```bash
set FORCE_PRIMARY_FAILURE=1 && python -m uvicorn main:app --port 8000
```

Cờ này **chỉ dùng khi demo hoặc chạy `evaluate.py --failover-run`**, mặc định tắt
(`0`). Nhớ tắt lại trước khi chạy bình thường, nếu không mọi câu hỏi đều đi vòng
qua API dự phòng.

## Lưu ý

- Đổi số hotline trong `main.py` (biến `FINAL_FALLBACK_MESSAGE`) nếu `0387 148 555` không phải số thật.
- `MAX_PAGES_PER_QUERY`, `MAX_KB_CHARS` trong `main.py` có thể chỉnh nếu cần nhiều/ít ngữ cảnh hơn mỗi câu trả lời.
- Mỗi lần chạy `scraper.py` sẽ **xoá sạch `scraped_pages` rồi ghi lại**, nên đừng
  sửa tay nội dung trong Neon nếu còn định crawl lại.
- Nội dung ngành học bản tiếng Anh nằm trong `PROGRAM_EN` ở `script.js` — do dự án
  tự soạn, vì website trường không có bản tiếng Anh cho phần này.
