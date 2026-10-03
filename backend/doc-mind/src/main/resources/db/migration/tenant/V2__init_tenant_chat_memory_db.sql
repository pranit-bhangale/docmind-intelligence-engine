CREATE TABLE IF NOT EXISTS spring_ai_chat_memory
(
    conversation_id VARCHAR(36)              NOT NULL,
    content         TEXT                     NOT NULL,
    type            VARCHAR(20)              NOT NULL,
    "timestamp"     TIMESTAMP WITH TIME ZONE NOT NULL,
    sequence_id     BIGINT                   NOT NULL,

    CONSTRAINT spring_ai_chat_memory_pkey
        PRIMARY KEY (conversation_id, sequence_id)
);

CREATE INDEX IF NOT EXISTS spring_ai_chat_memory_conversation_id_idx
    ON spring_ai_chat_memory (conversation_id);

CREATE INDEX IF NOT EXISTS spring_ai_chat_memory_conversation_id_sequence_id_idx
    ON spring_ai_chat_memory (conversation_id, sequence_id);