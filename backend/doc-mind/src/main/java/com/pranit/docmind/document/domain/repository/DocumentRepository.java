package com.pranit.docmind.document.domain.repository;

import com.pranit.docmind.document.domain.entity.DocumentMetadata;
import com.pranit.docmind.document.domain.entity.FileStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<DocumentMetadata, UUID> {

    boolean existsByUserIdAndFileName(UUID userId, String fileName);

    @Modifying
    @Query("""
                update DocumentMetadata dm
                set dm.fileStatus = :status
                where dm.documentId = :documentId
            """)
    void updateFileStatus(@Param("documentId") UUID documentId, @Param("status") FileStatus status);

    Optional<DocumentMetadata> findByDocumentId(UUID documentId);


    @Modifying
    @Query("""
                DELETE FROM DocumentMetadata d
                WHERE d.documentId = :documentId
            """)
    int rollbackDocumentMetadata(@Param("documentId") UUID documentId);
}
