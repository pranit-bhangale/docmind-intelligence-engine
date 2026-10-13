package com.pranit.docmind.auth.seed.service;

import com.pranit.docmind.auth.domain.entity.Role;
import com.pranit.docmind.auth.domain.entity.User;
import com.pranit.docmind.auth.domain.entity.UserRole;
import com.pranit.docmind.auth.domain.repository.RoleRepository;
import com.pranit.docmind.auth.domain.repository.UserRepository;
import com.pranit.docmind.auth.domain.repository.UserRoleRepository;
import com.pranit.docmind.auth.exception.RoleAlreadyAssignedException;
import com.pranit.docmind.auth.exception.RoleNotFoundException;
import com.pranit.docmind.auth.seed.properties.AdminSeedProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminSeeder implements CommandLineRunner {
    private final static String PLATFORM_ROLE = "PLATFORM_ADMIN";
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminSeedProperties properties;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void run(String @NonNull ... args) {
        if (userRepository.existsByUsername(properties.username())) {
            log.info("Admin user already exists: {}", properties.username());
            return;
        }
        User platformUser = User.builder()
                .username(properties.username())
                .password(passwordEncoder.encode(properties.password()))
                .email("pranitbhangale14@gmail.com")
                .tenantId(null)
                .firstName("Pranit")
                .lastName("Bhangale")
                .enabled(true)
                .deleted(false)
                .scheduledDeletionAt(null)
                .accountNonExpired(true)
                .accountNonLocked(true)
                .credentialsNonExpired(true)
                .build();
        platformUser = userRepository.save(platformUser);
        assignDefaultTenantAdminRole(platformUser);
        log.info("Admin user seeded successfully: {}", platformUser.getUsername());
    }

    private void assignDefaultTenantAdminRole(final User platformUser) {
        final Role role = this.roleRepository.findByName(PLATFORM_ROLE)
                .orElseThrow(() -> new RoleNotFoundException("Role not found"));
        if (this.userRoleRepository.existsByUser_UserIdAndRole_RoleId(platformUser.getUserId(), role.getRoleId())) {
            throw new RoleAlreadyAssignedException("Role already assigned");
        }
        final UserRole userRole = UserRole.builder()
                .user(platformUser)
                .role(role)
                .build();
        this.userRoleRepository.save(userRole);
    }
}
