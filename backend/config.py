import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def normalize_db_url(url):
    if not url:
        return 'postgresql+psycopg2://postgres:postgres@localhost:5432/pharmaflow'
    if url.startswith('postgres://'):
        return url.replace('postgres://', 'postgresql+psycopg2://', 1)
    if url.startswith('postgresql://') and not url.startswith('postgresql+'):
        return url.replace('postgresql://', 'postgresql+psycopg2://', 1)
    return url

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'pharmaflow-secret-dev-key-2026')
    SQLALCHEMY_DATABASE_URI = normalize_db_url(
        os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/pharmaflow')
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_SORT_KEYS = False

class DevelopmentConfig(Config):
    DEBUG = True

class TestingConfig(Config):
    TESTING = True
    # For testing, use TEST_DATABASE_URL or append _test to default
    SQLALCHEMY_DATABASE_URI = normalize_db_url(
        os.environ.get(
            'TEST_DATABASE_URL',
            os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/pharmaflow')
        )
    )

class ProductionConfig(Config):
    DEBUG = False

config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
