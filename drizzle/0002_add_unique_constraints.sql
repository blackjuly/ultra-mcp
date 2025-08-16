-- Add unique constraints to prevent race conditions
CREATE UNIQUE INDEX IF NOT EXISTS `conversation_budgets_session_id_unique` ON `conversation_budgets` (`session_id`);
CREATE UNIQUE INDEX IF NOT EXISTS `conversation_messages_session_message_idx_unique` ON `conversation_messages` (`session_id`, `message_index`);
CREATE UNIQUE INDEX IF NOT EXISTS `conversation_files_session_hash_unique` ON `conversation_files` (`session_id`, `content_hash`);