package com.pranit.docmind.auth.domain.repository;

import com.pranit.docmind.auth.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {

    @Query("""
            SELECT DISTINCT u
            FROM User u
            LEFT JOIN FETCH u.userRoles ur
            LEFT JOIN FETCH ur.role r
            WHERE u.username = :username
            """)
    Optional<User> findUserForAuthenticationByUsername(@Param("username") String username);

    boolean existsByEmail(String email);

    Optional<User> findByUserId(UUID userId);

    boolean existsByUsernameAndTenantId(String username, String tenantId);

    boolean existsByUsername(String username);

    boolean existsByUserId(UUID userId);
}
