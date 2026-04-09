import json

from pydantic import computed_field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "looplab"
    OPENAI_API_KEY: str = ""
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    CORS_ORIGINS: str = "http://localhost:5173"

    @computed_field
    @property
    def cors_origins_list(self) -> list[str]:
        v = self.CORS_ORIGINS
        if v.startswith("["):
            return json.loads(v)
        return [origin.strip() for origin in v.split(",") if origin.strip()]

    class Config:
        env_file = ".env"


settings = Settings()
