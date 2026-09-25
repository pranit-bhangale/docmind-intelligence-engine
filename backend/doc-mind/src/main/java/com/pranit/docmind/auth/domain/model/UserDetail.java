package com.pranit.docmind.auth.domain.model;

import com.pranit.docmind.auth.domain.entity.Role;
import com.pranit.docmind.auth.domain.entity.User;
import com.pranit.docmind.auth.domain.entity.UserRole;
import com.pranit.docmind.shared.api.CurrentUser;
import lombok.Builder;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Builder
public record UserDetail(
        UUID userId,
        String tenantId,
        String username,
        String firstName,
        String lastName,
        String email,
        String password,
        Collection<? extends GrantedAuthority> authorities,
        boolean deleted,
        boolean enabled,
        boolean accountNonExpired,
        boolean accountNonLocked,
        boolean credentialsNonExpired
) implements UserDetails, CurrentUser {

    public static UserDetail from(final User user) {
        final List<GrantedAuthority> authorities = user.getUserRoles()
                .stream()
                .map(UserRole::getRole)
                .map(Role::getName)
                .<GrantedAuthority>map(name -> new SimpleGrantedAuthority("ROLE_" + name))
                .distinct()
                .toList();
        return UserDetail.builder()
                .userId(user.getUserId())
                .tenantId(user.getTenantId())
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .password(user.getPassword())
                .authorities(authorities)
                .deleted(user.isDeleted())
                .enabled(user.isEnabled())
                .accountNonExpired(user.isAccountNonExpired())
                .accountNonLocked(user.isAccountNonLocked())
                .credentialsNonExpired(user.isCredentialsNonExpired())
                .build();
    }

    public UserDetail restored() {
        return UserDetail.builder()
                .userId(userId)
                .tenantId(tenantId)
                .username(username)
                .firstName(firstName)
                .lastName(lastName)
                .email(email)
                .password(password)
                .authorities(authorities)
                .deleted(false)
                .enabled(enabled)
                .accountNonExpired(accountNonExpired)
                .accountNonLocked(accountNonLocked)
                .credentialsNonExpired(credentialsNonExpired)
                .build();
    }

    @Override
    public @NullMarked Collection<? extends GrantedAuthority> getAuthorities() {
        return this.authorities;
    }

    @Override
    public @Nullable String getPassword() {
        return this.password;
    }

    @Override
    public @NullMarked String getUsername() {
        return this.username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return accountNonExpired;
    }

    @Override
    public boolean isAccountNonLocked() {
        return accountNonLocked;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return credentialsNonExpired;
    }

    @Override
    public boolean isEnabled() {
        return enabled && !deleted;
    }
}
