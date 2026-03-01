from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str="postgresql://postgres:vinay@localhost:5432/issue_tracker"
    SECRET_KEY: str="supersecretkey"
    ACCESS_TOKEN_EXPIRE_MINUTES: int=480
    ALGORITHM: str="HS256"

    class Config:
        env_file = ".env"
settings = Settings()
