from flask_caching import Cache
import os

cache = Cache()

def init_cache(app):
    """Initialize cache with Redis/Valkey or SimpleCache"""

    cache_host = os.getenv('CACHE_HOST')
    cache_port = os.getenv('CACHE_PORT', 25061)
    cache_password = os.getenv('CACHE_PASSWORD')
    cache_db = os.getenv('CACHE_DB', 0)

    SOCKET_TIMEOUT = 5  # Fast detection of dropped connections

    if cache_host:
        # --- Recommended: Use rediss:// URL ---
        app.config['CACHE_TYPE'] = 'RedisCache'
        app.config['CACHE_REDIS_URL'] = (
            f"rediss://default:{cache_password}@{cache_host}:{cache_port}/{cache_db}"
        )

        # --- Extra safeguards for stability ---
        app.config['CACHE_REDIS_RETRY_ON_TIMEOUT'] = True
        app.config['CACHE_REDIS_SOCKET_TIMEOUT'] = SOCKET_TIMEOUT
        
        # --- If RedisCache doesn't pick SSL from URL (older versions) ---
        app.config['CACHE_REDIS_SSL'] = True

        print(f"✅ Cache: Using Valkey/Redis via SSL (Timeout: {SOCKET_TIMEOUT}s, Retry: True)")
    else:
        # Fallback to local in-memory cache
        app.config['CACHE_TYPE'] = 'SimpleCache'
        print("⚠️ Cache: Using SimpleCache (local in-memory)")

    app.config['CACHE_DEFAULT_TIMEOUT'] = int(os.getenv('CACHE_DEFAULT_TIMEOUT', 300))

    cache.init_app(app)
    return cache
