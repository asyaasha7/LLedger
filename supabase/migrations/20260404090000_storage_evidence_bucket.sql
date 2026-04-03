-- Private bucket for encrypted evidence ciphertext (server uploads via service role).
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', false)
ON CONFLICT (id) DO NOTHING;
