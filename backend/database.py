import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
# Neon connection pooling requires SSL.
# Neon free-tier tự ngắt các kết nối rảnh sau vài phút. Nếu để mặc định, server
# sẽ lấy phải kết nối "chết" trong pool và treo vô hạn khi chờ phản hồi. Vì vậy:
#   - pool_pre_ping: ping thử trước mỗi lần dùng, kết nối chết thì tự nối lại
#   - pool_recycle: chủ động vứt kết nối cũ hơn 5 phút (trước khi Neon kịp ngắt)
#   - connect_timeout: nối không được thì báo lỗi sau 10s thay vì treo mãi
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={"sslmode": "require", "connect_timeout": 10},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()