-- ============================================
-- CRIAR USUÁRIO ADMIN
-- ============================================
-- Execute este SQL no Supabase SQL Editor

-- Hash da senha 'admin123' com bcrypt (10 rounds)
-- Password: admin123
-- Hash: $2a$10$VZSHVnk8LlyJJ7pNUf5S6OKQiP2Jm4Ag.cW8K2QRCFG7MfXq7ELnW

DELETE FROM users WHERE username = 'admin' OR email = 'admin@empresa.com';

INSERT INTO users (username, email, password_hash, role_id, full_name, phone, is_active, created_at, updated_at)
VALUES (
  'admin',
  'admin@empresa.com',
  '$2a$10$VZSHVnk8LlyJJ7pNUf5S6OKQiP2Jm4Ag.cW8K2QRCFG7MfXq7ELnW',
  3,
  'Administrador do Sistema',
  '+55 11 9999-9999',
  TRUE,
  NOW(),
  NOW()
);

-- Verificar inserção
SELECT user_id, username, email, role_id, full_name FROM users WHERE username = 'admin';
