package com.pranit.docmind.auth.controller;

import com.pranit.docmind.auth.application.service.UserService;
import com.pranit.docmind.auth.domain.dto.UpdatePasswordRequest;
import com.pranit.docmind.auth.domain.dto.UpdateUserRequest;
import com.pranit.docmind.auth.domain.dto.UserResponse;
import com.pranit.docmind.shared.wrapper.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
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
        description = "Endpoints for managing user accounts, password updates, profile modifications, profile deletion, and tenant user pagination."
)
public class UserController {

    private final UserService userService;

    @Operation(
            summary = "Change account password",
            description = "Updates the authenticated user's password after validating the current password credentials."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Password updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request payload or incorrect current password"),
            @ApiResponse(responseCode = "401", description = "Unauthorized access")
    })
    @PatchMapping(value = "/password", version = "v1")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'ADMIN', 'PLATFORM_ADMIN', 'USER')")
    public ResponseEntity<Void> changeAccountPassword(@Valid @RequestBody UpdatePasswordRequest request) {
        this.userService.updatePassword(request);
        return ResponseEntity.ok().build();
    }

    @Operation(
            summary = "Update user profile",
            description = "Updates profile details for the authenticated user such as display name, email, and metadata."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User profile updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request payload or validation failure"),
            @ApiResponse(responseCode = "401", description = "Unauthorized access")
    })
    @PatchMapping(value = "/profile", version = "v1")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'ADMIN', 'PLATFORM_ADMIN', 'USER')")
    public ResponseEntity<Void> updateProfile(@Valid @RequestBody UpdateUserRequest request) {
        this.userService.updateProfile(request);
        return ResponseEntity.ok().build();
    }

    @Operation(
            summary = "Delete user account profile",
            description = "Soft-deletes the current authenticated user's account and invalidates session access."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "User profile soft-deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized access")
    })
    @DeleteMapping(value = "/profile", version = "v1")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'ADMIN', 'PLATFORM_ADMIN', 'USER')")
    public ResponseEntity<Void> deleteProfile() {
        this.userService.deleteProfile();
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Get paginated user list",
            description = "Returns a paginated list of users within the tenant context with keyword filtering, sorting, and page controls."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Paginated list of users retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized access"),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires administrator privileges")
    })
    @GetMapping(value = "/all", version = "v1")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'ADMIN', 'PLATFORM_ADMIN')")
    public ResponseEntity<PageResponse<UserResponse>> findAllUsers(
            @Parameter(description = "Zero-based page index") @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
            @Parameter(description = "Number of user records per page") @RequestParam(name = "size", defaultValue = "10") @Min(1) @Max(10) int size,
            @Parameter(description = "Optional keyword to filter users by username or email") @RequestParam(name = "keyword", required = false) String keyword,
            @Parameter(description = "Property field to sort users by") @RequestParam(name = "sortBy", defaultValue = "username") String sortBy,
            @Parameter(description = "Sort direction: ASC or DESC") @RequestParam(name = "sortDirection", defaultValue = "ASC") String sortDirection
    ) {
        return ResponseEntity.ok().body(this.userService.findAllUsers(page, size, keyword, sortBy, sortDirection));
    }
}
