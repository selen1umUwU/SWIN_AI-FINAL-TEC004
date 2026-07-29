> **ĐÃ ÁP DỤNG — 29/07/2026.** Giữ file làm hồ sơ đóng action item A-08 và A-15.
> Hiện trạng: `FORCE_PRIMARY_FAILURE` có trong `backend/main.py` + `.env.example`;
> `marked.min.js` đã nằm ở `frontend/assets/` và cả `index.html` lẫn `campuses.html`
> đều nạp từ local; `script.js` đọc `provider` và hiện badge trên header widget chat.
> Cách chạy và cách đọc kết quả xem `eval/README.md`.
>
> Còn sót cùng loại rủi ro R-05: `index.html` và `campuses.html` vẫn tải font
> Roboto Condensed từ `fonts.googleapis.com`. Không làm chết chat widget như CDN
> `marked`, nhưng mạng hội trường chặn thì font nhảy về mặc định giữa lúc demo.

# Patch: cờ ép lỗi provider chính (đóng action item A-08)

Đây là thứ **duy nhất còn thiếu** để (a) chạy được benchmark failover và
(b) demo trực tiếp cơ chế failover trước hội đồng. Hiện `main.py` không có
cách nào bắt Gemini lỗi theo yêu cầu — đúng như rủi ro **R-03** đã ghi
trong biên bản M-03, nhưng A-08 chưa thực sự được implement.

## Sửa trong `backend/main.py`

### 1. Thêm ngay dưới dòng `GEMINI_MODEL = ...`

```python
GEMINI_MODEL = "gemini-3.1-flash-lite"
gemini_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

# --- Cờ demo/benchmark: ép provider chính lỗi để chứng minh failover ---
# Chỉ bật khi demo hoặc chạy evaluate.py --failover-run. Mặc định TẮT.
FORCE_PRIMARY_FAILURE = os.getenv("FORCE_PRIMARY_FAILURE", "0") == "1"
if FORCE_PRIMARY_FAILURE:
    print("[DEMO] FORCE_PRIMARY_FAILURE=1 -> Gemini sẽ bị ép lỗi, "
          "mọi truy vấn đi qua OpenRouter.")
```

### 2. Sửa đầu hàm `ask_gemini`

```python
def ask_gemini(question: str, history: list = ()) -> str:
    if FORCE_PRIMARY_FAILURE:
        # Mô phỏng HTTP 429 / quota exhausted của provider chính.
        raise RuntimeError("FORCED_FAILURE: mô phỏng lỗi 429 từ Gemini API")
    if gemini_client is None:
        raise RuntimeError("Chưa cấu hình GEMINI_API_KEY")
    ...
```

### 3. Thêm vào `.env.example`

```
# Đặt =1 để ép Gemini lỗi, dùng khi demo/benchmark cơ chế failover. Mặc định 0.
FORCE_PRIMARY_FAILURE=0
```

## Cách chạy 2 lần đo

```bash
# Lần 1 — vận hành bình thường
uvicorn main:app --port 8000
python evaluate.py

# Lần 2 — ép provider chính lỗi
FORCE_PRIMARY_FAILURE=1 uvicorn main:app --port 8000     # Windows: set FORCE_PRIMARY_FAILURE=1
python evaluate.py --failover-run
```

Lần 2 sẽ cho `failover_success_pct` và `provider_distribution` — hai con số
này là bằng chứng định lượng duy nhất cho luận điểm resilience của đồ án.

## Hai việc nhỏ nên làm cùng lúc (rẻ, chặn rủi ro demo)

1. **Gỡ CDN** — `frontend/index.html:268` vẫn nạp `marked` từ
   `cdn.jsdelivr.net`. Rủi ro **R-05** ghi là đã xử lý nhưng chưa. Tải
   `marked.min.js` về `frontend/assets/` rồi đổi thành
   `<script src="assets/marked.min.js"></script>`. Mạng hội trường chặn CDN
   là toàn bộ chat widget chết.
2. **Hiện provider trên UI** — backend đã trả `provider` trong response
   nhưng `script.js` không đọc. Thêm 1 dòng ghi tên provider lên header
   widget là failover **nhìn thấy được** khi demo, không cần mở log.
   Đây là action item A-15, Contribution Form đang khai là đã xong.
