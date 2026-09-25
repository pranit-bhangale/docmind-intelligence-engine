package com.pranit.docmind.auth.controller;

import com.pranit.docmind.auth.application.service.UserService;
import com.pranit.docmind.auth.domain.dto.UpdatePasswordRequest;
import com.pranit.docmind.auth.domain.dto.UpdateUserRequest;
import com.pranit.docmind.auth.domain.dto.UserResponse;
import com.pranit.docmind.shared.wrapper.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@Validated
@Tag(
        name = "User Management",
        description = "Endpoints for managing the authenticated user's password, profile, and account."
)
public class UserController {

    private final UserService userService;

    @Operation(
            summary = "Change account password",
            description = "Updates the authenticated user's password after validating the current password."
    )
    @PatchMapping(value = "/password", version = "v1")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'ADMIN', 'PLATFORM_ADMIN', 'USER')")
    public ResponseEntity<Void> changeAccountPassword(@Valid @RequestBody UpdatePasswordRequest request) {
        this.userService.updatePassword(request);
        return ResponseEntity.ok().build();
    }

    @Operation(
            summary = "Update user profile",
            description = "Updates the authenticated user's profile information such as username, email, and name."
    )
    @PatchMapping(value = "/profile", version = "v1")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'ADMIN', 'PLATFORM_ADMIN', 'USER')")
    public ResponseEntity<Void> updateProfile(@Valid @RequestBody UpdateUserRequest request) {
        this.userService.updateProfile(request);
        return ResponseEntity.ok().build();
    }

    @Operation(
            summary = "Delete user profile",
            description = "Soft-deletes the authenticated user's account and marks the profile as deleted."
    )
    @DeleteMapping(value = "/profile", version = "v1")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'ADMIN', 'PLATFORM_ADMIN', 'USER')")
    public ResponseEntity<Void> deleteProfile() {
        this.userService.deleteProfile();
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Get paginated users",
            description = "Returns a paginated list of users with optional keyword filtering and sorting."
    )
    @GetMapping(value = "/all", version = "v1")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN','ADMIN')")
    public ResponseEntity<PageResponse<UserResponse>> findAllUsers(
            @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(name = "size", defaultValue = "10") @Min(1) @Max(10) int size,
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "sortBy", defaultValue = "username") String sortBy,
            @RequestParam(name = "sortDirection", defaultValue = "ASC") String sortDirection
    ) {
        return ResponseEntity.ok().body(this.userService.findAllUsers(page, size, keyword, sortBy, sortDirection));
    }
}
