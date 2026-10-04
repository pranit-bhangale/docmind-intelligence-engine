package com.pranit.docmind.tenant.controller;

import com.pranit.docmind.shared.wrapper.PageResponse;
import com.pranit.docmind.tenant.application.service.TenantService;
import com.pranit.docmind.tenant.domain.dto.TenantRegisterRequest;
import com.pranit.docmind.tenant.domain.dto.TenantResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tenants")
@RequiredArgsConstructor
@Validated
@Tag(
        name = "Tenant Management",
        description = "Endpoints for multi-tenant organization onboarding, administrative approval workflows, status management (active, deactivated, suspended), and tenant context resolution."
)
public class TenantController {

    private final TenantService tenantService;

    @Operation(
            summary = "Register new tenant organization",
            description = "Submits a new tenant organization registration request with company details and initial administrator credentials."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Tenant organization registered successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request payload or validation error"),
            @ApiResponse(responseCode = "409", description = "Company code or email already registered")
    })
    @PostMapping(value = "/register", version = "v1")
    public ResponseEntity<Void> register(@Valid @RequestBody final TenantRegisterRequest request) {
        this.tenantService.registerTenant(request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @Operation(
            summary = "Approve pending tenant organization",
            description = "Approves a pending tenant organization by PLATFORM_ADMIN, triggering multi-tenant database schema provisioning."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tenant approved and database schema provisioned successfully"),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires PLATFORM_ADMIN authority"),
            @ApiResponse(responseCode = "404", description = "Tenant organization not found")
    })
    @PostMapping(value = "/approve/{tenant-id}", version = "v1")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<Void> approveTenant(
            @Parameter(name = "tenant-id", description = "Unique identifier of the pending tenant organization", required = true)
            @PathVariable("tenant-id") final String tenantId) {
        this.tenantService.approveTenant(tenantId);
        return ResponseEntity.ok().build();
    }

    @Operation(
            summary = "Activate tenant organization",
            description = "Activates an approved or suspended tenant organization, restoring active service status and user authentication."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tenant organization activated successfully"),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires PLATFORM_ADMIN authority"),
            @ApiResponse(responseCode = "404", description = "Tenant organization not found")
    })
    @PatchMapping(value = "/activate/{tenant-id}", version = "v1")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<Void> activateTenant(
            @Parameter(name = "tenant-id", description = "Unique identifier of the tenant organization", required = true)
            @PathVariable("tenant-id") final String tenantId) {
        this.tenantService.activateTenant(tenantId);
        return ResponseEntity.ok().build();
    }

    @Operation(
            summary = "Deactivate tenant organization",
            description = "Deactivates an active tenant organization, disabling tenant workspace access and API access."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tenant organization deactivated successfully"),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires PLATFORM_ADMIN authority"),
            @ApiResponse(responseCode = "404", description = "Tenant organization not found")
    })
    @PatchMapping(value = "/deactivate/{tenant-id}", version = "v1")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<Void> deactivateTenant(
            @Parameter(name = "tenant-id", description = "Unique identifier of the tenant organization", required = true)
            @PathVariable("tenant-id") final String tenantId) {
        this.tenantService.deactivateTenant(tenantId);
        return ResponseEntity.ok().build();
    }

    @Operation(
            summary = "Suspend tenant organization",
            description = "Suspends a tenant organization due to compliance policy or administrative directive, restricting workspace access."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tenant organization suspended successfully"),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires PLATFORM_ADMIN authority"),
            @ApiResponse(responseCode = "404", description = "Tenant organization not found")
    })
    @PatchMapping(value = "/suspend/{tenant-id}", version = "v1")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<Void> suspendTenant(
            @Parameter(name = "tenant-id", description = "Unique identifier of the tenant organization", required = true)
            @PathVariable("tenant-id") final String tenantId) {
        this.tenantService.suspendTenant(tenantId);
        return ResponseEntity.ok().build();
    }

    @Operation(
            summary = "List all tenant organizations",
            description = "Returns a paginated list of registered tenant organizations with status filtering, sorting, and keyword search controls."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Paginated list of tenants retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized access"),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires PLATFORM_ADMIN authority")
    })
    @GetMapping(version = "v1")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<PageResponse<TenantResponse>> findAllTenants(
            @Parameter(description = "Zero-based page index") @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
            @Parameter(description = "Number of tenant records per page") @RequestParam(name = "size", defaultValue = "10") @Min(1) @Max(10) int size,
            @Parameter(description = "Optional keyword to filter tenants by company name or code") @RequestParam(name = "keyword", required = false) String keyword,
            @Parameter(description = "Property field to sort tenants by") @RequestParam(name = "sortBy", defaultValue = "username") String sortBy,
            @Parameter(description = "Sort direction: ASC or DESC") @RequestParam(name = "sortDirection", defaultValue = "ASC") String sortDirection
    ) {
        return ResponseEntity.ok(this.tenantService.findAllTenants(page, size, keyword, sortBy, sortDirection));
    }

    @Operation(
            summary = "Get current active tenant details",
            description = "Retrieves details of the currently active tenant organization bound to the request context."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Current tenant organization details retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized access"),
            @ApiResponse(responseCode = "404", description = "Tenant context not found")
    })
    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'ADMIN', 'PLATFORM_ADMIN')")
    public ResponseEntity<TenantResponse> getCurrentTenant() {
        return ResponseEntity.ok(this.tenantService.getCurrentTenant());
    }
}
