INSERT INTO auth.roles
(
    name,
    description,
    created_at,
    updated_at,
    version
)
VALUES
    (
        'PLATFORM_ADMIN',
        'Platform administrator with full platform-level access',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        0
    ),
    (
        'COMPANY_ADMIN',
        'Company administrator with administrative access within a tenant',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        0
    ),
    (
        'ADMIN',
        'Administrator with elevated access within a tenant',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        0
    ),
    (
        'USER',
        'Standard user with regular access within a tenant',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        0
    )
    ON CONFLICT (name) DO NOTHING;