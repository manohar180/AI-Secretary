from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Application Settings.
    This reads dynamically from environment variables or a .env file.
    """
    PROJECT_NAME: str = "Inter-Company AI Workflow Layer"
    VERSION: str = "0.1.0"
    
    # AI Provider Keys
    GROQ_API_KEY: str = ""
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
