package com.pranit.docmind.auth.application.service.impl;

import com.pranit.docmind.auth.application.mapper.UserMapper;
import com.pranit.docmind.auth.application.service.UserService;
import com.pranit.docmind.auth.application.specification.UserSpecification;
import com.pranit.docmind.auth.domain.dto.UpdatePasswordRequest;
import com.pranit.docmind.auth.domain.dto.UpdateUserRequest;
import com.pranit.docmind.auth.domain.dto.UserResponse;
import com.pranit.docmind.auth.domain.entity.Role;
import com.pranit.docmind.auth.domain.entity.User;
import com.pranit.docmind.auth.domain.entity.UserRole;
import com.pranit.docmind.auth.domain.repository.RoleRepository;
import com.pranit.docmind.auth.domain.repository.UserRepository;
import com.pranit.docmind.auth.domain.repository.UserRoleRepository;
import com.pranit.docmind.auth.exception.PasswordValidationException;
import com.pranit.docmind.auth.exception.RoleAlreadyAssignedException;
import com.pranit.docmind.auth.exception.RoleNotFoundException;
import com.pranit.docmind.auth.exception.UserNotExistsException;
import com.pranit.docmind.shared.exception.DuplicateResourceException;
import com.pranit.docmind.shared.exception.InvalidRequestException;
import com.pranit.docmind.shared.helper.SecurityContext;
import com.pranit.docmind.shared.wrapper.PageResponse;
import com.pranit.docmind.tenant.api.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final static String TENANT_ROLE = "COMPANY_ADMIN";
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void createInitialAdmin
            (final String tenantId, final String username, final String email,
             final String fullName, final String encodedPassword) {
        if (this.userRepository.existsByUsernameAndTenantId(username, tenantId)) {
            throw new DuplicateResourceException("User already exists for tenant");
        }
        User adminUser = User.builder()
                .username(username)
                .email(email)
                .firstName(extractFirstName(fullName))
                .lastName(extractLastName(fullName))
                .password(encodedPassword)
                .tenantId(tenantId)
                .enabled(true)
                .deleted(false)
                .scheduledDeletionAt(null)
                .accountNonExpired(true)
                .accountNonLocked(true)
                .credentialsNonExpired(true)
                .build();
        adminUser = this.userRepository.save(adminUser);
        assignDefaultTenantAdminRole(adminUser);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void updateProfile(final UpdateUserRequest request) {
        final UUID userId = SecurityContext.getCurrentUserId();
        final User user = fetchAndValidateUserById(userId);
        if (request.username() != null) user.setUsername(request.username());
        if (request.email() != null) user.setEmail(request.email());
        if (request.firstName() != null) user.setFirstName(request.firstName());
        if (request.lastName() != null) user.setLastName(request.lastName());
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void updatePassword(final UpdatePasswordRequest request) {
        final UUID userId = SecurityContext.getCurrentUserId();
        final User user = fetchAndValidateUserById(userId);
        if (!passwordEncoder.matches(request.oldPassword(), user.getPassword())) {
            throw new PasswordValidationException("Old password is incorrect");
        }
        if (!Objects.equals(request.newPassword(), request.confirmPassword())) {
            throw new PasswordValidationException("New password and confirm password do not match");
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPassword())) {
            throw new PasswordValidationException("New password must be different from old password");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
    }

    @Override
    @Transactional
    public void deleteProfile() {
        final UUID userId = SecurityContext.getCurrentUserId();
        final User user = fetchAndValidateUserById(userId);
        user.setDeleted(true);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED, readOnly = true)
    public PageResponse<UserResponse> findAllUsers(
            final int page, final int size, final String keyword,
            final String sortBy, final String sortDirection) {
        final String tenantId = TenantContext.getCurrentTenant();
        final Sort.Direction direction = "asc".equalsIgnoreCase(sortDirection)
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        final Sort sort = Sort.by(direction, sortBy);
        final Pageable pageable = PageRequest.of(page, size, sort);
        final Specification<User> specification = Specification
                .where(UserSpecification.belongsToTenant(tenantId))
                .and(UserSpecification.searchKeyword(keyword));
        final Page<User> pages = this.userRepository.findAll(specification, pageable);
        final List<UserResponse> content = pages.getContent()
                .stream()
                .map(userMapper::toResponse)
                .toList();
        return PageResponse.<UserResponse>builder()
                .contents(content)
                .currentPage(pages.getNumber())
                .pageSize(pages.getSize())
                .totalElements(pages.getTotalElements())
                .totalPages(pages.getTotalPages())
                .isLastPage(pages.isLast())
                .isFirstPage(pages.isFirst())
                .build();
    }

    private User fetchAndValidateUserById(final UUID userId) {
        final String tenantId = TenantContext.getCurrentTenant();
        final User user = this.userRepository.findById(userId)
                .orElseThrow(() -> new UserNotExistsException("User not found"));
        if (!tenantId.equals(user.getTenantId())) {
            throw new InvalidRequestException("User does not belong to the tenant");
        }
        return user;
    }

    private String extractFirstName(final String fullName) {
        if (fullName == null || fullName.isBlank()) return "";
        return fullName.trim().split("\\s+")[0];
    }

    private String extractLastName(final String fullName) {
        if (fullName == null || fullName.isBlank()) return "";
        final String[] names = fullName.trim().split("\\s+");
        return names.length > 1
                ? names[names.length - 1] : names[0];
    }

    private void assignDefaultTenantAdminRole(final User adminUser) {
        final Role role = this.roleRepository.findByName(TENANT_ROLE)
                .orElseThrow(() -> new RoleNotFoundException("Role not found"));
        if (this.userRoleRepository.existsByUser_UserIdAndRole_RoleId(adminUser.getUserId(), role.getRoleId())) {
            throw new RoleAlreadyAssignedException("Role already assigned");
        }
        final UserRole userRole = UserRole.builder()
                .user(adminUser)
                .role(role)
                .build();
        this.userRoleRepository.save(userRole);
    }
}
