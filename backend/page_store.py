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


def save_scrape_run(started_at, status: str, pages_saved: int,
                    content_lines: int, log_text: str) -> int:
    """
    Lưu log của 1 lần chạy scraper thành 1 dòng trong bảng scrape_runs.

    Gom cả lần chạy vào 1 dòng thay vì mỗi dòng log 1 record: một lần crawl sinh
    ra hơn 500 dòng log, ghi từng dòng lên Neon vừa chậm vừa làm bảng phình to
    mà không tra cứu được gì hơn.
    """
    db = SessionLocal()
    try:
        run = models.ScrapeRun(
            started_at=started_at,
            status=status,
            pages_saved=pages_saved,
            content_lines=content_lines,
            log=log_text,
        )
        db.add(run)
        db.commit()
        return run.id
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def fetch_scrape_runs(limit: int = 20) -> list:
    """Lấy các lần chạy scraper gần nhất, mới nhất đứng trước."""
    db = SessionLocal()
    try:
        rows = (
            db.query(models.ScrapeRun)
            .order_by(models.ScrapeRun.id.desc())
            .limit(limit)
            .all()
        )
        return [
            {
                "id": r.id,
                "started_at": r.started_at.isoformat() if r.started_at else None,
                "finished_at": r.finished_at.isoformat() if r.finished_at else None,
                "status": r.status,
                "pages_saved": r.pages_saved,
                "content_lines": r.content_lines,
                "log": r.log or "",
            }
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
