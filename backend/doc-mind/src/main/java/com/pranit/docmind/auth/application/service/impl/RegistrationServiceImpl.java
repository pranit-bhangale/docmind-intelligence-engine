package com.pranit.docmind.auth.application.service.impl;

import com.pranit.docmind.auth.application.mapper.UserMapper;
import com.pranit.docmind.auth.application.service.RegistrationService;
import com.pranit.docmind.auth.domain.dto.RegistrationRequest;
import com.pranit.docmind.auth.domain.entity.Role;
import com.pranit.docmind.auth.domain.entity.User;
import com.pranit.docmind.auth.domain.entity.UserRole;
import com.pranit.docmind.auth.domain.repository.RoleRepository;
import com.pranit.docmind.auth.domain.repository.UserRepository;
import com.pranit.docmind.auth.domain.repository.UserRoleRepository;
import com.pranit.docmind.auth.exception.RoleAlreadyAssignedException;
import com.pranit.docmind.auth.exception.RoleNotFoundException;
import com.pranit.docmind.auth.infrastructure.helper.Generate;
import com.pranit.docmind.notification.api.EmailPurpose;
import com.pranit.docmind.notification.api.EmailRouter;
import com.pranit.docmind.notification.api.OnboardEvent;
import com.pranit.docmind.shared.exception.DuplicateResourceException;
import com.pranit.docmind.shared.exception.InvalidRequestException;
import com.pranit.docmind.tenant.api.TenantContext;
import com.pranit.docmind.tenant.api.TenantValidationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class RegistrationServiceImpl implements RegistrationService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final EmailRouter emailRouter;
    private final TenantValidationService tenantValidationService;

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void registerNewUserByAdmin(final RegistrationRequest request) {
        final String tenantId = TenantContext.getCurrentTenant();
        validateUserDoesNotExist(request.username(), request.email());
        final Role role = validateRole(request.roleName());
        User user = this.userMapper.toEntity(request);
        user.setPassword(this.passwordEncoder.encode(request.password()));
        user.setTenantId(tenantId);
        user = this.userRepository.save(user);
        assignRoleToUser(user, role);
        log.info("User created for tenant: {}", tenantId);
        final String companyCode = this.tenantValidationService.getCompanyCode(tenantId);
        final OnboardEvent event = OnboardEvent.builder()
                .eventId(Generate.eventId())
                .email(user.getEmail())
                .companyCode(companyCode)
                .username(user.getUsername())
                .password(request.password())
                .build();
        this.emailRouter.send(event, EmailPurpose.USER_ONBOARD);
        log.info("Email sent for tenant: {} | username: {}", tenantId, user.getUsername());
    }

    private void validateUserDoesNotExist(final String username, final String email) {
        if (this.userRepository.existsByUsername(username)) {
            throw new DuplicateResourceException("Username already exists");
        }
        if (this.userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email already exists");
        }
    }

    private Role validateRole(String roleName) {
        final Role role = this.roleRepository.findByName(roleName)
                .orElseThrow(() -> new RoleNotFoundException("Role not found"));
        if ("PLATFORM_ADMIN".equalsIgnoreCase(role.getName())) {
            throw new InvalidRequestException("Platform Admin role cannot be attached");
        }
        return role;
    }

    private void assignRoleToUser(final User user, final Role role) {
        if (this.userRoleRepository.existsByUser_UserIdAndRole_RoleId(user.getUserId(), role.getRoleId())) {
            throw new RoleAlreadyAssignedException("Role already assigned");
        }
        final UserRole userRole = UserRole.builder()
                .user(user)
                .role(role)
                .build();
        this.userRoleRepository.save(userRole);
    }
}
