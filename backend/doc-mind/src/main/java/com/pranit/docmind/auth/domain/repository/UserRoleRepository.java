package com.pranit.docmind.auth.domain.repository;

import com.pranit.docmind.auth.domain.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, Long> {
    boolean existsByUser_UserIdAndRole_RoleId(UUID userId, Long roleId);
}
