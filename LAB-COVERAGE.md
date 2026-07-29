# Đối chiếu đồ án SwinAI với 9 bài lab TEC004 (Week 2–11)

Các bài lab dạy kỹ thuật trên một project mẫu về **thị trường nhà đất Hà Nội**
(`housing_models.py`, `market_analysis.py`, `app.py`…). Đồ án tốt nghiệp SE25/1 là
**hệ thống tư vấn tuyển sinh AI** — khác đề tài, nhưng phải chứng minh được cùng
bộ kỹ thuật đó.

Bảng dưới là hiện trạng thật của code trong repo (không phải kế hoạch).

| Week | Kỹ thuật lab yêu cầu | Trạng thái | Bằng chứng trong repo |
|---|---|---|---|
| 2 | OOP: class, constructor có validate, method phân tích | ⚠️ Một phần | `models.py` (3 class SQLAlchemy), `main.py:37` (Pydantic). Đều là class **khai báo**, không có constructor tự viết kèm validate |
| 3 | Kế thừa, `super()`, override, `isinstance()`, đa hình | ❌ Thiếu | Không có class con nào trong toàn bộ project |
| 4 | `map`/`filter`/`lambda`/`reduce`, closure, comprehension, decorator tự viết | ⚠️ Một phần | `scraper.py:106-107` có `map()`+`filter()`+`lambda`; comprehension dùng khắp nơi. **Thiếu**: `reduce()`, closure factory, decorator tự viết (`@lru_cache` ở `main.py:87` là decorator có sẵn) |
| 5 | JSON export/import, CSV, logging, kiểm tra toàn vẹn | ✅ Đủ | `scraper.py`: `export_json()`, `export_csv()`, `logging` ra `scraper.log`, `verify_integrity()` |
| 6 | `requests` + BeautifulSoup, check status, làm sạch, try/except, lưu JSON/CSV | ✅ Vượt yêu cầu | `scraper.py` crawl BFS 150 trang, tự loại boilerplate, retry, `remove_boilerplate()` |
| 7 | Pandas DataFrame, cột tính toán, `.describe()`, `.groupby()`, matplotlib | ❌ Thiếu | Không có `import pandas` ở đâu cả. `evaluate.py` tính thống kê bằng module `statistics` và vẽ bằng matplotlib |
| 9 | Selenium: WebDriver, explicit wait, infinite scroll, xử lý pop-up | ❌ Thiếu | Chỉ scrape tĩnh bằng `requests` |
| 10 | SQLite, `CREATE TABLE`, `INSERT` tham số hoá, `pd.read_sql_query()` | ⚠️ Một phần | Có CSDL quan hệ thật (PostgreSQL/Neon qua SQLAlchemy) và có migration JSON → DB (`page_store.save_pages()`). **Thiếu**: `sqlite3`, `pd.read_sql_query()` |
| 11 | Multi-threading, tích hợp AI, `ALTER TABLE`, dashboard Streamlit | ⚠️ Một phần | **AI: vượt xa yêu cầu** — 2 provider, chuỗi failover, RAG + BM25, guardrail. **Thiếu**: `ThreadPoolExecutor`, Streamlit |

**Tóm tắt: 2 đủ · 4 một phần · 3 thiếu hẳn.**

Điểm mạnh rõ rệt ở Week 5, 6 và phần AI của Week 11 — vượt khá xa mức lab yêu cầu.
Ba lỗ hổng thật sự cần vá: **kế thừa (W3)**, **Pandas (W7)**, **Selenium (W9)**.

---

## Đề xuất vá — làm trong chính đồ án tuyển sinh, không làm lại project nhà đất

Xếp theo tỉ lệ *giá trị thật / công sức*. Mỗi mục dưới đây đều làm code tốt lên,
không phải bài tập gắn thêm cho có.

### 1. Kế thừa cho lớp Provider — vá Week 2 + 3 (ưu tiên cao nhất)

`main.py:531` đang quản lý 2 API bằng một list tuple:

```python
PROVIDER_CHAIN = [("gemini", ask_gemini), ("openrouter", ask_openrouter)]
```

Thay bằng lớp cơ sở `AIProvider` với `GeminiProvider` / `OpenRouterProvider` kế thừa:
constructor validate API key (Week 2), `super().__init__()` (Week 3), override
`generate()` (đa hình), vòng lặp failover gọi chung một interface, `isinstance()`
để log riêng loại provider. Thêm provider thứ ba sau này chỉ là viết thêm 1 class.

Đây là refactor **đúng nghĩa cải thiện kiến trúc**, và vá gọn cả hai tuần yếu nhất.

### 2. `analyze_results.py` bằng Pandas — vá Week 7 + 10

`eval/raw_results.jsonl` đang có sẵn dữ liệu chờ được phân tích. Viết
`eval/analyze_results.py`:

- `pd.read_json(..., lines=True)` → DataFrame, `.set_index('id')` *(W7 Step 1)*
- Cột tính toán: `is_correct`, `latency_bucket` (nhanh/vừa/chậm) bằng `.apply()` *(W7 Step 2)*
- `.describe()` trên latency, `.idxmax()` tìm câu chậm nhất *(W7 Step 3)*
- `.groupby('category')` tính accuracy + latency trung bình, `.sort_values()` *(W7 Step 4)*
- Biểu đồ bar + scatter, `plt.savefig()` *(W7 Step 5)*
- `pd.read_sql_query("SELECT * FROM chat_history", conn)` đọc thẳng lịch sử chat
  thật từ Neon để phân tích câu hỏi người dùng hay hỏi *(W10 Step 4-5)*

Phần đọc `chat_history` còn tạo ra số liệu mà đề bài SE25/1 yêu cầu trực tiếp:
*"Target achieving 50% automation of common queries"* — muốn chứng minh con số này
thì phải thống kê được câu hỏi thật của người dùng.

### 3. SQLite lưu lịch sử các lần đo — vá Week 10 phần `sqlite3`

Hiện mỗi lần chạy `evaluate.py` ghi ra một thư mục timestamp riêng, không so sánh
được các lần với nhau. Cho `evaluate.py` ghi thêm vào `eval/eval_runs.db`:
`CREATE TABLE IF NOT EXISTS`, `INSERT` dùng placeholder `?`, và `ALTER TABLE` khi
thêm chỉ số mới *(W11 Step 3)*. Kết quả là biểu đồ accuracy qua từng lần cải tiến
prompt — thứ hội đồng rất hay hỏi ("cải tiến rồi thì tốt lên bao nhiêu?").

### 4. Đa luồng cho scraper — vá Week 11 Step 1

`scraper.py` crawl 150 trang tuần tự, `REQUEST_DELAY = 0.8` ⇒ mất khoảng 3–4 phút.
Bọc `fetch_soup()` bằng `ThreadPoolExecutor(max_workers=5)`, giữ nguyên delay để
vẫn lịch sự với server trường, đo và in ra so sánh tuần tự / đa luồng. Lab yêu cầu
đúng dòng output kiểu `"Linear: 10s | Threaded: 2s"` — ở đây là số liệu thật.

### 5. Dashboard Streamlit cho admin — vá Week 11 Step 4 + 5

Không thay trang web công khai (đã có frontend HTML/CSS/JS riêng, vượt Streamlit về
mức hoàn thiện). Làm một `dashboard.py` **nội bộ** đọc Neon: số câu hỏi theo ngày,
phân bố provider (thấy được failover), chủ đề được hỏi nhiều nhất, kết quả các lần
đo. Có `st.sidebar.selectbox()` lọc theo ngày, `st.metric()`, `st.bar_chart()`.

### 6. Decorator + closure — vá nốt Week 4

Viết `@audit_log` (dùng `func.__name__`) gắn lên các hàm gọi provider: tự động log
tên hàm, thời gian chạy, kết quả. Vừa đúng yêu cầu lab, vừa thay được mấy dòng
`print("[WARN] ...")` đang rải rác trong `main.py`.

### 7. Selenium — vá Week 9 (khớp kém nhất, cân nhắc)

Đây là mục duy nhất hơi gượng: `swinburne-vn.edu.vn` là WordPress render sẵn phía
server, `requests` lấy đủ nội dung nên Selenium **không mang lại dữ liệu mới**. Hai
cách xử lý, chọn một:

- **Trung thực nhất:** viết `dynamic_scraper.py` tự động hoá phần *thật sự* cần
  trình duyệt — mở web, gõ vào ô tìm kiếm của trường, chờ kết quả bằng
  `WebDriverWait`, đóng pop-up bằng try/except. Có đủ 5 deliverable của Week 9 mà
  không giả vờ là nó cần thiết cho pipeline.
- **Giá trị cao hơn:** dùng Selenium làm **smoke test UI** cho chính chatbot của
  mình — mở trang, click nút chat, gõ câu hỏi, `WebDriverWait` chờ bong bóng trả
  lời xuất hiện, chụp màn hình. Vẫn đủ WebDriver + explicit wait + exception
  handling, lại thành một bài kiểm thử tự động có ích thật.

---

## Thứ tự nên làm

Nếu thời gian có hạn, làm **1 → 2 → 4**. Ba mục này vá được Week 2, 3, 7, 10, 11
(phần threading), đều là sửa code sẵn có nên rủi ro thấp, và mục 2 còn sinh ra số
liệu bắt buộc phải có cho đề bài SE25/1. Mục 3, 5, 6, 7 là phần thêm nếu còn thời gian.
