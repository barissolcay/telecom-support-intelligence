from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from telcoassist.config.settings import get_settings


def create_engine_and_session_factory() -> tuple[Engine, sessionmaker[Session]]:
    settings = get_settings()
    connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
    engine = create_engine(settings.database_url, pool_pre_ping=True, connect_args=connect_args)
    return engine, sessionmaker(engine, expire_on_commit=False)


def create_session_factory() -> sessionmaker[Session]:
    return create_engine_and_session_factory()[1]
