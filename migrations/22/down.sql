
DROP INDEX IF EXISTS idx_chat_attachments_message;
DROP INDEX IF EXISTS idx_chat_reactions_message;
DROP INDEX IF EXISTS idx_chat_replies_parent;
DROP TABLE IF EXISTS chat_message_attachments;
DROP TABLE IF EXISTS chat_message_reactions;
DROP TABLE IF EXISTS chat_message_replies;
