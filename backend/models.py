from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from database import Base

class ChatHistory(Base):
    __tablename__ = "chat_history"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)
    user_message = Column(Text)
    bot_response = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


class ScrapedPage(Base):
    __tablename__ = "scraped_pages"
    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, unique=True, index=True)
    title = Column(Text)
    content = Column(JSON)
    scraped_at = Column(DateTime(timezone=True), server_default=func.now())


class ScrapeRun(Base):
    __tablename__ = "scrape_runs"
    id = Column(Integer, primary_key=True, index=True)
    started_at = Column(DateTime(timezone=True))
    finished_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, index=True)
    pages_saved = Column(Integer)
    content_lines = Column(Integer)
    log = Column(Text)