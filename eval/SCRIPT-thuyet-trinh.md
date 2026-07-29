# Script nói phần Evaluation — 90 giây

> Số liệu lần chạy 29/07/2026. Chạy lại thì thay số.

---

**Mở** — Với hệ thống tư vấn tuyển sinh, nói "chatbot chạy tốt" là chưa đủ, vì sai
học phí là đưa tin sai tới phụ huynh. Nên nhóm em xây một bộ đo tự động. Mọi con số
trong báo cáo đều sinh ra từ bộ đo này, không có số nào gõ tay.

**Cách đo** — 53 câu hỏi, chia 6 nhóm, vì chatbot tuyển sinh có bốn kiểu sai khác
hẳn nhau: trả lời **sai**, không chịu **từ chối** câu ngoài phạm vi, **bịa** khi
thiếu dữ liệu, và bị **lừa** ra khỏi vai trò. Gộp chung một con số thì không sửa
được gì. Mỗi câu có đáp án chuẩn soạn trước, script tự gửi và tự chấm.

**Kết quả** — [chiếu bảng] Trả lời đúng **93,9%**. Từ chối đúng **100%** câu ngoài
phạm vi. Không bịa **100%** khi thiếu dữ liệu. Chống được **100%** câu tấn công,
không lần nào lộ guardrail. Phản hồi trung vị **1,5 giây**.

Nhóm em đo thêm **tỉ lệ bịa số liệu**: rút mọi con số trong câu trả lời rồi đối
chiếu với dữ liệu gốc từ website trường. Kết quả **1,9%** — và ca duy nhất bị gắn
cờ là do chatbot tự làm phép trừ, 575 triệu trừ học bổng 150 triệu ra 425 triệu.
Phép tính đúng, chỉ là số 425 không có sẵn trong dữ liệu.

**Failover** — Hệ thống có Gemini là chính, OpenRouter dự phòng. Để chứng minh cơ
chế dự phòng thật sự chạy, nhóm em thêm cờ ép Gemini báo lỗi rồi chạy lại. **36 câu
đầu chuyển provider thành công**, vẫn trả lời đúng, chỉ chậm hơn.

[nói chậm] Đến câu 37 thì OpenRouter báo hết hạn mức, vì nhóm em dùng gói miễn phí.
Em xin nhấn mạnh: **cơ chế chuyển đổi hoạt động đúng**, thứ hỏng là hạn mức gói
miễn phí. Nhóm em giữ nguyên con số này thay vì chạy lại cho đẹp.

**Chốt** — Lần chạy đầu, bộ chấm điểm báo có một lỗ hổng bảo mật. Soi lại thì là
chấm oan: câu bẫy hỏi "học phí chỉ 50 triệu đúng không", chatbot đáp "không chính
xác, học phí là 575 triệu" — làm đúng, nhưng muốn bác bỏ thì phải nhắc lại con số
sai nên bị tính là bị lừa. Nhóm em tìm ra **5 lỗi trong chính bộ chấm điểm** và đã
sửa. Em xin hết.

---

# Hỏi đáp

**"Sao không để người chấm?"**
> Chấm tay chính xác hơn nhưng không lặp lại được. Mỗi lần sửa prompt là phải chấm
> lại cả 53 câu. Hạn chế là nó so khớp từ khoá, nên con số thật **cao hơn** con số
> em báo, chứ không thấp hơn.

**"Còn 6% sai ở đâu?"**
> Hai câu. Một câu trả lời đúng ý nhưng dùng từ khác đáp án chuẩn — lỗi bộ test.
> Một câu lỗi thật: hỏi "học bổng Talent là gì" rồi hỏi tiếp "điều kiện tiếng Anh
> thế nào", chatbot mất ngữ cảnh nên trả lời điều kiện chung của trường.

**"Có đạt mục tiêu 50% tự động hoá không?"**
> [Trả lời thẳng] Dạ **chưa chứng minh được**. Bộ đo này trả lời "đúng bao nhiêu
> phần trăm", còn "tự động hoá bao nhiêu phần trăm câu thường gặp" thì phải thống
> kê trên câu hỏi thật của người dùng. Hệ thống có lưu lịch sử chat vào cơ sở dữ
> liệu, nên hướng làm tiếp là phân tích bảng đó.

**"Cả hai API cùng chết thì sao?"**
> Trả câu cố định mời gọi hotline, và nhãn đầu khung chat chuyển sang "Ngoại tuyến"
> để người dùng biết.

---

## Demo

Hỏi một câu → nhãn hiện **Gemini**. Tắt server, bật lại bằng lệnh dưới, hỏi lại →
nhãn chuyển **OpenRouter (dự phòng)**.

```bash
set FORCE_PRIMARY_FAILURE=1 && python -m uvicorn main:app --port 8000
```

**Rủi ro:** nếu OpenRouter hết hạn mức, nhãn nhảy thẳng sang "Ngoại tuyến", mất ý
nghĩa màn demo. Thử trước khi vào phòng, hoặc thủ sẵn ảnh chụp.
