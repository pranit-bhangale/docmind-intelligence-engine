package com.pranit.docmind.tenant.domain.repository;

import com.pranit.docmind.tenant.domain.entity.Tenant;
import com.pranit.docmind.tenant.domain.entity.TenantStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, String>, JpaSpecificationExecutor<Tenant> {

    boolean existsByCompanyCode(String companyCode);

    boolean existsByEmail(String email);

    @Modifying
    @Transactional
    @Query("""
                UPDATE Tenant t
                   SET t.status = :newStatus
                 WHERE t.tenantId = :tenantId
                   AND t.status = :expectedStatus
            """)
    int updateStatus(
            @Param("tenantId") String tenantId,
            @Param("expectedStatus") TenantStatus expectedStatus,
            @Param("newStatus") TenantStatus newStatus
    );

    Optional<Tenant> findBytenantId(String tenantId);
}