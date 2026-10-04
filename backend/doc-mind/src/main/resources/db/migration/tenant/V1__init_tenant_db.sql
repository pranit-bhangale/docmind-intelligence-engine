CREATE TABLE IF NOT EXISTS document_metadata
(
    document_id    UUID         NOT NULL,
    user_id        UUID         NOT NULL,
    file_name      VARCHAR(255) NOT NULL,
    file_size      BIGINT       NOT NULL,
    file_status    VARCHAR(20)  NOT NULL,
    chunks_created BIGINT       NOT NULL DEFAULT 0,
    version        BIGINT       NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ  NOT NULL,
    updated_at     TIMESTAMPTZ  NOT NULL,
    created_by     UUID,
    updated_by     UUID,

    CONSTRAINT pk_document_metadata
        PRIMARY KEY (document_id),

    CONSTRAINT uk_file_name
        UNIQUE (file_name),

    CONSTRAINT chk_document_file_status
        CHECK ( file_status IN
                (
                 'UPLOADING',
                 'PROCESSING',
                 'INDEXED',
                 'FAILED'
                    )
            )
);

CREATE INDEX idx_document_file_status
    ON document_metadata (file_status);