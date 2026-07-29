"""Đọc/ghi dữ liệu scrape trong bảng scraped_pages trên Neon PostgreSQL."""
import models
from database import SessionLocal


def fetch_pages() -> list:
    """Lấy toàn bộ trang đã scrape từ DB, trả về [{"url","title","content"}]."""
    db = SessionLocal()
    try:
        rows = db.query(models.ScrapedPage).order_by(models.ScrapedPage.id).all()
        return [
            {"url": r.url, "title": r.title or "", "content": r.content or []}
            for r in rows
        ]
    finally:
        db.close()


def save_pages(pages: list) -> int:
    """
    Ghi đè toàn bộ bảng bằng đợt scrape mới.

    Xoá sạch rồi ghi lại thay vì cập nhật từng dòng, vì mỗi lần chạy scraper là
    một ảnh chụp đầy đủ của website — làm vậy thì trang nào đã bị gỡ khỏi web
    trường cũng biến mất khỏi DB, không để lại dữ liệu cũ gây trả lời sai.
    """
    unique = {}
    for page in pages:
        url = (page.get("url") or "").strip()
        if url:
            unique[url] = page

    db = SessionLocal()
    try:
        db.query(models.ScrapedPage).delete()
        db.add_all([
            models.ScrapedPage(
                url=url,
                title=page.get("title", ""),
                content=page.get("content", []),
            )
            for url, page in unique.items()
        ])
        db.commit()
        return len(unique)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
