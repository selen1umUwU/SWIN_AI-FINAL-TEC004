"""
analyze_results.py — Phân tích kết quả đo và lịch sử chat thật bằng Pandas.

Hai phần độc lập nhau:

PHẦN A — Kết quả bộ đo (đọc eval/results/<timestamp>/raw_results.jsonl)
    Trả lời "chatbot đúng bao nhiêu phần trăm trên bộ test soạn sẵn".

PHẦN B — Lịch sử chat thật (đọc bảng chat_history trên Neon)
    Trả lời "chatbot tự xử lý được bao nhiêu phần trăm câu hỏi NGƯỜI DÙNG THẬT
    hỏi" — tức chỉ tiêu 'Target achieving 50% automation of common queries' trong
    đề bài SE25/1. Bộ test 53 câu KHÔNG trả lời được câu này, vì nó là câu hỏi do
    nhóm tự soạn chứ không phải câu người dùng thật gõ vào.

Cách dùng
---------
    python analyze_results.py                      # tự lấy lần đo mới nhất
    python analyze_results.py --run results/2026...  # chỉ định lần đo
    python analyze_results.py --skip-db             # bỏ phần B nếu không có DB

Kết quả ghi vào <run>/analysis/ gồm bảng markdown và các biểu đồ PNG.
"""

import argparse
import glob
import os
import re
import sys
import unicodedata

import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))

# Ba câu cố định trong system prompt của main.py. Sửa main.py thì sửa cả ở đây.
REFUSAL_OUT_OF_SCOPE = "tôi là trợ lý ảo tư vấn tuyển sinh"
REFUSAL_NO_DATA = "chưa có đủ thông tin chi tiết"
SERVER_BUSY = "máy chủ đang bận"

# Phiên do getSessionId() trong script.js sinh ra, tức người dùng thật mở web.
# Dấu \_ để LIKE hiểu là gạch dưới thật chứ không phải ký tự đại diện.
USER_SESSION_LIKE = r"sess\_%"

TOPIC_KEYWORDS = {
    "học phí": ["hoc phi", "chi phi", "bao nhieu tien", "dong tien"],
    "học bổng": ["hoc bong", "scholarship"],
    "ngành học": ["nganh", "chuyen nganh", "khoa hoc", "chuong trinh hoc"],
    "nhập học": ["nhap hoc", "xet tuyen", "ho so", "dieu kien", "dang ky", "tuyen sinh"],
    "cơ sở": ["co so", "dia chi", "campus", "ha noi", "ho chi minh", "da nang", "can tho"],
}


def df_to_md(df, index=True):
    """
    Bảng markdown không cần thư viện ngoài. DataFrame.to_markdown() của Pandas
    đòi cài thêm 'tabulate' — không đáng thêm một dependency chỉ để in bảng.
    """
    head = ([df.index.name or ""] if index else []) + [str(c) for c in df.columns]
    lines = ["| " + " | ".join(head) + " |",
             "|" + "|".join("---" for _ in head) + "|"]
    for key, row in df.iterrows():
        cells = ([str(key)] if index else []) + [str(v) for v in row]
        lines.append("| " + " | ".join(cells) + " |")
    return "\n".join(lines)


def strip_accents(text):
    text = str(text).replace("đ", "d").replace("Đ", "D")
    return "".join(c for c in unicodedata.normalize("NFD", text)
                   if unicodedata.category(c) != "Mn")


def norm(text):
    return re.sub(r"\s+", " ", strip_accents(text).lower()).strip()


# ============================================================ PHẦN A: bộ đo
def latest_run(explicit=None):
    """
    Mặc định lấy lần đo VẬN HÀNH BÌNH THƯỜNG mới nhất, không lấy lần failover —
    lần failover cố tình ép provider chính lỗi nên số liệu của nó không đại diện
    cho hệ thống lúc chạy thật. Muốn phân tích lần failover thì truyền --run.
    """
    if explicit:
        return explicit
    runs = sorted(glob.glob(os.path.join(HERE, "results", "*")))
    runs = [r for r in runs if os.path.isfile(os.path.join(r, "raw_results.jsonl"))]
    if not runs:
        sys.exit("[ERROR] Chưa có lần đo nào trong eval/results/. Chạy evaluate.py trước.")

    binh_thuong = [r for r in runs if not r.rstrip("/\\").endswith("-failover")]
    if binh_thuong:
        return binh_thuong[-1]
    print("[WARN] Chỉ có lần đo failover -> phân tích trên đó, số liệu sẽ thấp hơn thực tế.")
    return runs[-1]


def latency_bucket(seconds):
    """Xếp loại tốc độ phản hồi — dùng cho .apply() thay vì viết vòng lặp."""
    if seconds <= 0:
        return "không phản hồi"
    if seconds < 2.0:
        return "nhanh (<2s)"
    if seconds < 4.0:
        return "vừa (2-4s)"
    return "chậm (>4s)"


def analyse_eval(run_dir, outdir):
    print("=" * 62)
    print("PHẦN A — KẾT QUẢ BỘ ĐO")
    print("=" * 62)

    df = pd.read_json(os.path.join(run_dir, "raw_results.jsonl"), lines=True)
    df = df.set_index("id")

    print(f"\nNguồn: {run_dir}")
    print(f"{len(df)} truy vấn, {df['category'].nunique()} nhóm\n")
    print(df[["category", "provider", "latency_s", "verdict"]].head())

    # --- Cột tính toán ---
    df["is_correct"] = df["verdict"] == "correct"
    df["answer_len"] = df["answer"].fillna("").str.len()
    df["latency_bucket"] = df["latency_s"].apply(latency_bucket)

    print("\n--- Thống kê mô tả ---")
    print(df[["latency_s", "answer_len"]].describe().round(2))

    slowest = df["latency_s"].idxmax()
    print(f"\nCâu chậm nhất: {slowest} ({df.loc[slowest, 'latency_s']}s)")
    print(f"  {df.loc[slowest, 'question'][:80]}")

    # --- Gộp nhóm ---
    by_cat = (df.groupby("category")
                .agg(n=("is_correct", "size"),
                     dung=("is_correct", "sum"),
                     accuracy_pct=("is_correct", lambda s: round(100 * s.mean(), 1)),
                     latency_tb=("latency_s", lambda s: round(s.mean(), 2)))
                .sort_values("accuracy_pct", ascending=False))
    print("\n--- Theo nhóm truy vấn ---")
    print(by_cat)

    by_bucket = df["latency_bucket"].value_counts()
    print("\n--- Phân bố tốc độ ---")
    print(by_bucket)

    # Tập con: câu sai VÀ chậm — nhóm cần ưu tiên sửa nhất.
    can_sua = df[(~df["is_correct"]) & (df["latency_s"] >= df["latency_s"].median())]
    print(f"\n--- Câu vừa sai vừa chậm hơn trung vị: {len(can_sua)} ---")
    if len(can_sua):
        print(can_sua[["category", "latency_s", "reason"]].head())

    _chart_eval(df, by_cat, outdir)

    with open(os.path.join(outdir, "phan_tich_bo_do.md"), "w", encoding="utf-8") as f:
        f.write(f"# Phân tích bộ đo — {os.path.basename(run_dir)}\n\n")
        f.write(f"n = {len(df)} truy vấn\n\n## Theo nhóm\n\n")
        f.write(df_to_md(by_cat))
        f.write("\n\n## Phân bố tốc độ\n\n")
        f.write(df_to_md(by_bucket.to_frame("số truy vấn")))
        f.write("\n\n## Thống kê latency\n\n")
        f.write(df_to_md(df[["latency_s", "answer_len"]].describe().round(2)))
        f.write("\n")
    return df


def _chart_eval(df, by_cat, outdir):
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except ImportError:
        print("\n[WARN] Chưa cài matplotlib -> bỏ qua biểu đồ (pip install matplotlib)")
        return

    fig, ax = plt.subplots(figsize=(7, 3.6))
    by_cat["accuracy_pct"].plot(kind="bar", ax=ax, color="#C8102E")
    ax.set_ylabel("Accuracy (%)")
    ax.set_xlabel("")
    ax.set_ylim(0, 105)
    ax.set_title("Độ chính xác theo nhóm truy vấn")
    plt.xticks(rotation=20, ha="right", fontsize=8)
    fig.tight_layout()
    fig.savefig(os.path.join(outdir, "chart_accuracy_theo_nhom.png"), dpi=150)
    plt.close(fig)

    fig, ax = plt.subplots(figsize=(7, 3.6))
    ok = df[df["is_correct"]]
    bad = df[~df["is_correct"]]
    ax.scatter(ok["latency_s"], ok["answer_len"], s=26, color="#C8102E", label="đúng")
    ax.scatter(bad["latency_s"], bad["answer_len"], s=42, color="#222",
               marker="x", label="sai")
    ax.set_xlabel("Latency (s)")
    ax.set_ylabel("Độ dài câu trả lời (ký tự)")
    ax.set_title("Tốc độ phản hồi so với độ dài câu trả lời")
    ax.legend()
    fig.tight_layout()
    fig.savefig(os.path.join(outdir, "chart_latency_vs_dodai.png"), dpi=150)
    plt.close(fig)


# ==================================================== PHẦN B: lịch sử chat thật
def preset_questions():
    """
    Các câu bấm sẵn trên giao diện (chip gợi ý trong widget chat và ô FAQ), đọc
    thẳng từ index.html để không lệch khi sửa giao diện.

    Cần tách riêng vì đây là câu do CHÍNH DỰ ÁN chọn — tất nhiên chatbot trả lời
    tốt. Gộp chung vào tỉ lệ tự động hoá sẽ thổi phồng con số.
    """
    path = os.path.join(HERE, "..", "frontend", "index.html")
    try:
        with open(path, encoding="utf-8") as f:
            return {norm(q) for q in re.findall(r'data-question="([^"]+)"', f.read())}
    except OSError:
        return set()


def classify_topic(question):
    q = norm(question)
    for topic, keywords in TOPIC_KEYWORDS.items():
        if any(k in q for k in keywords):
            return topic
    return "khác"


def classify_outcome(answer):
    """
    Mỗi lượt hỏi rơi vào đúng 1 trong 3 nhóm:
      - ngoài phạm vi : chatbot từ chối đúng, KHÔNG tính vào tỉ lệ tự động hoá
      - cần người     : chatbot không đủ dữ liệu / server lỗi -> phải nhờ hotline
      - tự trả lời    : chatbot giải quyết trọn vẹn
    """
    a = norm(answer)
    if norm(REFUSAL_OUT_OF_SCOPE) in a:
        return "ngoài phạm vi"
    if norm(REFUSAL_NO_DATA) in a or norm(SERVER_BUSY) in a:
        return "cần người"
    return "tự trả lời"


def analyse_chat_history(outdir):
    print("\n" + "=" * 62)
    print("PHẦN B — LỊCH SỬ CHAT THẬT (bảng chat_history trên Neon)")
    print("=" * 62)

    sys.path.insert(0, os.path.join(HERE, "..", "backend"))
    from dotenv import load_dotenv
    load_dotenv(os.path.join(HERE, "..", "backend", ".env"))
    from database import engine
    from sqlalchemy import text

    # Lọc ngay trong SQL thay vì kéo hết về rồi mới bỏ.
    #
    # QUAN TRỌNG — chỉ lấy phiên có tiền tố 'sess_', tức phiên do getSessionId()
    # trong script.js sinh ra khi NGƯỜI DÙNG mở web. Bảng này còn lẫn:
    #   - phiên 'eval-...'  : do chính evaluate.py bắn vào (168 lượt)
    #   - phiên 'smoke...', 'test_...', 'diag...' : test tay lúc phát triển
    # Không lọc thì bộ test tự soạn bị đếm thành câu hỏi người dùng thật, và tỉ lệ
    # tự động hoá báo cáo sẽ sai.
    # Truyền tiền tố bằng tham số ràng buộc, không nhúng thẳng vào chuỗi SQL:
    # dấu % bị psycopg2 hiểu nhầm là placeholder và làm hỏng truy vấn.
    query = text("""
        SELECT id, session_id, user_message, bot_response, timestamp
        FROM chat_history
        WHERE user_message IS NOT NULL
          AND LENGTH(TRIM(user_message)) >= 3
          AND session_id LIKE :prefix
        ORDER BY id
    """)
    df = pd.read_sql_query(query, engine, index_col="id",
                           params={"prefix": USER_SESSION_LIKE})
    if df.empty:
        print("\n[WARN] Chưa có phiên chat nào của người dùng thật.")
        return df
    print(f"\n{len(df)} lượt hỏi | {df['session_id'].nunique()} phiên chat")
    print(f"Từ {df['timestamp'].min():%d/%m/%Y} đến {df['timestamp'].max():%d/%m/%Y}")

    chips = preset_questions()
    df["topic"] = df["user_message"].apply(classify_topic)
    df["outcome"] = df["bot_response"].fillna("").apply(classify_outcome)
    df["la_chip"] = df["user_message"].apply(lambda q: norm(q) in chips)
    df["ngay"] = df["timestamp"].dt.date
    print(f"Trong đó {int(df['la_chip'].sum())} lượt là bấm nút gợi ý sẵn, "
          f"{int((~df['la_chip']).sum())} lượt người dùng tự gõ")

    print("\n--- Kết quả từng lượt hỏi ---")
    print(df["outcome"].value_counts())

    # Tỉ lệ tự động hoá chỉ tính trên câu THUỘC phạm vi tư vấn tuyển sinh.
    # Gộp câu ngoài phạm vi vào là sai: chatbot từ chối "ronaldo với messi ai là
    # goat" là hành vi ĐÚNG, không phải một lần tự động hoá thất bại.
    trong_pham_vi = df[df["outcome"] != "ngoài phạm vi"]
    tu_tra_loi = (trong_pham_vi["outcome"] == "tự trả lời").sum()
    ty_le = 100 * tu_tra_loi / len(trong_pham_vi) if len(trong_pham_vi) else 0

    # Câu người dùng TỰ GÕ là phép thử thật sự — con số này mới đáng đưa vào
    # báo cáo, vì nó không được lợi từ việc dự án chọn sẵn câu hỏi.
    tu_go = trong_pham_vi[~trong_pham_vi["la_chip"]]
    tu_go_ok = (tu_go["outcome"] == "tự trả lời").sum()
    ty_le_tu_go = 100 * tu_go_ok / len(tu_go) if len(tu_go) else 0

    print(f"\n{'*' * 62}")
    print(f"TỈ LỆ TỰ ĐỘNG HOÁ (tất cả):     {ty_le:.1f}%   "
          f"({tu_tra_loi}/{len(trong_pham_vi)})")
    print(f"TỈ LỆ TỰ ĐỘNG HOÁ (tự gõ):      {ty_le_tu_go:.1f}%   "
          f"({tu_go_ok}/{len(tu_go)})  <- con số nên dùng")
    print(f"  Đã loại {len(df) - len(trong_pham_vi)} câu ngoài phạm vi khỏi mẫu số.")
    print(f"  Đã tách {int(trong_pham_vi['la_chip'].sum())} lượt bấm nút gợi ý sẵn —")
    print(f"  câu do dự án chọn trước nên chatbot đương nhiên trả lời tốt.")
    print(f"  Chỉ tiêu đề bài: 50% -> {'ĐẠT' if ty_le_tu_go >= 50 else 'CHƯA ĐẠT'}")
    print("*" * 62)

    by_topic = (df.groupby("topic")
                  .agg(so_luot=("outcome", "size"),
                       tu_tra_loi=("outcome", lambda s: (s == "tự trả lời").sum()),
                       can_nguoi=("outcome", lambda s: (s == "cần người").sum()))
                  .sort_values("so_luot", ascending=False))
    # Mẫu số bỏ câu ngoài phạm vi, giống cách tính tỉ lệ tổng ở trên.
    trong_pv = by_topic["tu_tra_loi"] + by_topic["can_nguoi"]
    by_topic["ty_le_tu_dong_pct"] = (
        100 * by_topic["tu_tra_loi"] / trong_pv.where(trong_pv > 0)
    ).round(1)
    print("\n--- Theo chủ đề người dùng hỏi ---")
    print(by_topic)

    # Đẩy phép lọc xuống SQL thay vì lọc trong Pandas.
    hot = pd.read_sql_query(text("""
        SELECT user_message, COUNT(*) AS so_lan
        FROM chat_history
        WHERE user_message IS NOT NULL
          AND LENGTH(TRIM(user_message)) >= 3
          AND session_id LIKE :prefix
        GROUP BY user_message
        HAVING COUNT(*) >= 2
        ORDER BY so_lan DESC
        LIMIT 10
    """), engine, params={"prefix": USER_SESSION_LIKE})
    print("\n--- Câu hỏi được hỏi lại nhiều lần ---")
    print(hot if len(hot) else "  (chưa có câu nào lặp lại)")

    _chart_chat(df, by_topic, outdir)

    with open(os.path.join(outdir, "phan_tich_chat_that.md"), "w", encoding="utf-8") as f:
        f.write("# Phân tích lịch sử chat thật\n\n")
        f.write(f"{len(df)} lượt hỏi, {df['session_id'].nunique()} phiên, "
                f"từ {df['timestamp'].min():%d/%m/%Y} đến {df['timestamp'].max():%d/%m/%Y}\n\n")
        f.write(f"## Tỉ lệ tự động hoá\n\n")
        f.write(f"| Mẫu | Tự trả lời | Tổng | Tỉ lệ |\n|---|---|---|---|\n")
        f.write(f"| Câu người dùng **tự gõ** | {tu_go_ok} | {len(tu_go)} "
                f"| **{ty_le_tu_go:.1f}%** |\n")
        f.write(f"| Kể cả lượt bấm nút gợi ý sẵn | {tu_tra_loi} | {len(trong_pham_vi)} "
                f"| {ty_le:.1f}% |\n\n")
        f.write(f"Chỉ tiêu đề bài SE25/1 là 50% → "
                f"**{'ĐẠT' if ty_le_tu_go >= 50 else 'CHƯA ĐẠT'}**\n\n")
        f.write("### Cách tính\n\n")
        f.write(f"- Mẫu số bỏ {len(df) - len(trong_pham_vi)} câu ngoài phạm vi: từ chối "
                f"\"ronaldo với messi ai là goat\" là hành vi **đúng**, không phải một "
                f"lần tự động hoá thất bại.\n")
        f.write(f"- Tách riêng {int(trong_pham_vi['la_chip'].sum())} lượt bấm nút gợi ý "
                f"sẵn trên giao diện. Đó là câu do chính dự án chọn trước nên chatbot "
                f"đương nhiên trả lời tốt; gộp vào sẽ thổi phồng con số. **Con số nên "
                f"đưa vào báo cáo là dòng đầu — câu người dùng tự gõ.**\n")
        f.write(f"- Chỉ lấy phiên có tiền tố `sess_` (do giao diện web sinh ra), đã loại "
                f"toàn bộ phiên `eval-` của chính bộ đo và các phiên test tay.\n\n")
        f.write("## Theo chủ đề\n\n")
        f.write(df_to_md(by_topic))
        f.write("\n\n## Câu hỏi lặp lại nhiều nhất\n\n")
        f.write(df_to_md(hot, index=False) if len(hot) else "(chưa có)")
        f.write("\n")
    return df


def _chart_chat(df, by_topic, outdir):
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except ImportError:
        return

    fig, ax = plt.subplots(figsize=(7, 3.6))
    pivot = df.pivot_table(index="topic", columns="outcome",
                           values="session_id", aggfunc="count").fillna(0)
    pivot.plot(kind="barh", stacked=True, ax=ax,
               color=["#888", "#C8102E", "#E8912D"][:len(pivot.columns)])
    ax.set_xlabel("Số lượt hỏi")
    ax.set_ylabel("")
    ax.set_title("Người dùng thật hỏi gì, chatbot xử lý được đến đâu")
    fig.tight_layout()
    fig.savefig(os.path.join(outdir, "chart_chat_theo_chu_de.png"), dpi=150)
    plt.close(fig)

    fig, ax = plt.subplots(figsize=(7, 3.2))
    df.groupby("ngay").size().plot(kind="line", marker="o", ax=ax, color="#C8102E")
    ax.set_ylabel("Số lượt hỏi")
    ax.set_xlabel("")
    ax.set_title("Lưu lượng câu hỏi theo ngày")
    fig.tight_layout()
    fig.savefig(os.path.join(outdir, "chart_luu_luong_theo_ngay.png"), dpi=150)
    plt.close(fig)


def main():
    p = argparse.ArgumentParser(description="Phân tích kết quả đo và chat thật")
    p.add_argument("--run", help="Thư mục lần đo (mặc định: lần mới nhất)")
    p.add_argument("--skip-db", action="store_true",
                   help="Bỏ phần B nếu không kết nối được Neon")
    args = p.parse_args()

    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")

    pd.set_option("display.width", 120)
    pd.set_option("display.max_columns", 20)

    run_dir = latest_run(args.run)
    outdir = os.path.join(run_dir, "analysis")
    os.makedirs(outdir, exist_ok=True)

    analyse_eval(run_dir, outdir)

    if not args.skip_db:
        try:
            analyse_chat_history(outdir)
        except Exception as e:
            print(f"\n[WARN] Không phân tích được chat_history: {e}")
            print("[WARN] Kiểm tra DATABASE_URL trong backend/.env, "
                  "hoặc chạy lại với --skip-db.")

    print(f"\n[DONE] Kết quả: {outdir}")


if __name__ == "__main__":
    main()
