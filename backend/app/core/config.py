from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str

    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480

    aws_access_key_id: str
    aws_secret_access_key: str
    aws_region: str = "sa-east-1"
    s3_bucket_name: str

    smtp_host: str
    smtp_port: int = 587
    smtp_starttls: bool = True
    smtp_username: str
    smtp_password: str
    smtp_from: str

    notificacao_nti_email: str
    app_url: str

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()