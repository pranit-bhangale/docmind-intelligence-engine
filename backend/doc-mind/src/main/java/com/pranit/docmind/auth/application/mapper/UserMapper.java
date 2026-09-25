package com.pranit.docmind.auth.application.mapper;

import com.pranit.docmind.auth.domain.dto.RegistrationRequest;
import com.pranit.docmind.auth.domain.dto.UserResponse;
import com.pranit.docmind.auth.domain.entity.User;
import com.pranit.docmind.auth.domain.entity.UserRole;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.stream.Collectors;

@Component
public class UserMapper {

    public User toEntity(final RegistrationRequest request) {
        return User.builder()
                .username(request.username())
                .email(request.email())
                .password(request.password())
                .firstName(request.firstName())
                .lastName(request.lastName())
                .enabled(true)
                .deleted(false)
                .scheduledDeletionAt(null)
                .build();
    }

    public UserResponse toResponse(final User user) {
        final Set<GrantedAuthority> authorities = user.getUserRoles()
                .stream()
                .map(UserRole::getRole)
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getName()))
                .collect(Collectors.toSet());
        return UserResponse.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .authorities(authorities)
                .deleted(user.isDeleted())
                .enabled(user.isEnabled())
                .accountNonExpired(user.isAccountNonExpired())
                .accountNonLocked(user.isAccountNonLocked())
                .credentialsNonExpired(user.isAccountNonExpired())
                .build();
    }
}
