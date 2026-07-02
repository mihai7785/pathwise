from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = 'Pathwise API'
    api_prefix: str = '/api'
    database_url: str = 'sqlite:///./learning_copilot.db'
    uploads_dir: str = './uploads'
    cors_origins: list[str] = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://192.168.1.61:5173',
    ]

    model_config = SettingsConfigDict(env_file='.env', extra='ignore')


settings = Settings()
