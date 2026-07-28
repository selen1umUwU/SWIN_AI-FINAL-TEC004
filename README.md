# Swinburne Vietnam — AI Admission Consulting Website

Đồ án tốt nghiệp SE25/1 — Hệ thống tư vấn tuyển sinh AI cho Swinburne Việt Nam.

## Cấu trúc thư mục

```
swinburne-project/
├── backend/
│   ├── main.py            # FastAPI app: endpoint /chat, retrieval theo từ khoá, fallback Gemini -> OpenRouter
│   ├── database.py        # Kết nối Postgres (Neon.tech) qua SQLAlchemy
│   ├── models.py          # Model ChatHistory (lưu lịch sử chat)
│   ├── scraper.py         # Crawl toàn bộ swinburne-vn.edu.vn -> scraped_data.json
│   ├── requirements.txt   # Danh sách thư viện Python cần cài
│   └── .env.example       # Mẫu file .env (copy thành .env và điền key thật)
│
└── frontend/
    ├── index.html          # Trang chính (navbar, hero, FAQ, chương trình, học bổng, gallery, chat widget)
    ├── style.css           # Theme đỏ-đen Swinburne, dark/light mode, responsive
    ├── script.js           # Xử lý theme toggle, chat widget, gọi API /chat
    └── assets/             # Logo, ảnh, icon (đã có sẵn)
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

### 2. Chạy scraper (lấy dữ liệu thật từ website trường)

```bash
python scraper.py
```
Sẽ mất vài phút vì crawl nhiều trang. Kết quả sinh ra `scraped_data.json` ngay trong thư mục `backend/`.

### 3. Gắn frontend vào backend

`main.py` phục vụ frontend tĩnh qua `StaticFiles(directory="static", html=True)`.
Cần copy toàn bộ nội dung thư mục `frontend/` vào một thư mục tên `static/` **cùng cấp** với `main.py`:

```bash
cp -r ../frontend static
```

Kết quả cuối cùng trong `backend/`:
```
backend/
├── main.py
├── database.py
├── models.py
├── scraper.py
├── scraped_data.json   (sinh ra sau khi chạy scraper.py)
├── static/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── assets/
```

### 4. Chạy server

```bash
uvicorn main:app --reload
```

Mở trình duyệt tại `http://127.0.0.1:8000`.

## Kiến trúc xử lý AI (đã cập nhật)

Mỗi câu hỏi sẽ:
1. Lọc ra tối đa 6 trang liên quan nhất từ `scraped_data.json` theo trùng khớp từ khoá (`retrieve_relevant_pages`).
2. Dựng system prompt riêng cho câu hỏi đó (`build_system_prompt`) — chỉ chứa phần dữ liệu liên quan, tránh vượt giới hạn context.
3. Gọi **API 1: Gemini** trước. Nếu lỗi (hết quota, timeout...) → tự động chuyển **API 2: OpenRouter** (model free `nvidia/nemotron-3-nano-30b-a3b:free`).
4. Nếu cả 2 đều lỗi → trả về câu thông báo kèm hotline.
5. Lưu lịch sử chat vào Postgres (Neon.tech).

## Lưu ý

- Đổi số hotline trong `main.py` (biến `FINAL_FALLBACK_MESSAGE`) nếu `0773 131 319` không phải số thật.
- `MAX_PAGES_PER_QUERY`, `MAX_KB_CHARS` trong `main.py` có thể chỉnh nếu cần nhiều/ít ngữ cảnh hơn mỗi câu trả lời.
