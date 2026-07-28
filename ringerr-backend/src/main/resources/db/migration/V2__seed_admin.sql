-- Seed default admin user (password: Admin@1234)
INSERT INTO users (email, full_name, password, enabled)
VALUES (
    'admin@ringerr.com',
    'System Admin',
    '$2a$10$DCDwsQwurjDfC4Qvh1vDpOsyYehtjiFitWjutuNJIHVQvLzblLICW',
    TRUE
) ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'admin@ringerr.com' AND r.name IN ('USER', 'ADMIN')
ON CONFLICT DO NOTHING;
