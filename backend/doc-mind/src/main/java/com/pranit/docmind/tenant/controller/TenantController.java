package com.pranit.docmind.tenant.controller;

import com.pranit.docmind.shared.wrapper.PageResponse;
import com.pranit.docmind.tenant.application.service.TenantService;
import com.pranit.docmind.tenant.domain.dto.TenantRegisterRequest;
import com.pranit.docmind.tenant.domain.dto.TenantResponse;
import io.swagger.v3.oas.annotations.Operation;
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
        description = "Endpoints for approving, activating, deactivating, suspending, and listing tenants."
)
public class TenantController {

    private final TenantService tenantService;

    @Operation(
            summary = "Register tenant",
            description = "Registers a new tenant and creates a pending tenant registration."
    )
    @PostMapping(value = "/register", version = "v1")
    public ResponseEntity<Void> register(@Valid @RequestBody final TenantRegisterRequest request) {
        this.tenantService.registerTenant(request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @Operation(
            summary = "Approve tenant",
            description = "Approves a pending tenant and allows the tenant to proceed with activation."
    )
    @PostMapping(value = "/approve/{tenant-id}", version = "v1")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<Void> approveTenant(@PathVariable("tenant-id") final String tenantId) {
        this.tenantService.approveTenant(tenantId);
        return ResponseEntity.ok().build();
    }

    @Operation(
            summary = "Activate tenant",
            description = "Activates the specified tenant and enables access to tenant services."
    )
    @PatchMapping(value = "/activate/{tenant-id}", version = "v1")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<Void> activateTenant(@PathVariable("tenant-id") final String tenantId) {
        this.tenantService.activateTenant(tenantId);
        return ResponseEntity.ok().build();
    }

    @Operation(
            summary = "Deactivate tenant",
            description = "Deactivates the specified tenant and prevents access to tenant services."
    )
    @PatchMapping(value = "/deactivate/{tenant-id}", version = "v1")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<Void> deactivateTenant(@PathVariable("tenant-id") final String tenantId) {
        this.tenantService.deactivateTenant(tenantId);
        return ResponseEntity.ok().build();
    }

    @Operation(
            summary = "Suspend tenant",
            description = "Suspends the specified tenant and temporarily restricts tenant access."
    )
    @PatchMapping(value = "/suspend/{tenant-id}", version = "v1")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<Void> suspendTenant(@PathVariable("tenant-id") final String tenantId) {
        this.tenantService.suspendTenant(tenantId);
        return ResponseEntity.ok().build();
    }

    @Operation(
            summary = "List tenants",
            description = "Returns a paginated and sortable list of tenants with optional keyword filtering."
    )
    @GetMapping(version = "v1")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<PageResponse<TenantResponse>> findAllTenants(
            @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(name = "size", defaultValue = "10") @Min(1) @Max(10) int size,
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "sortBy", defaultValue = "username") String sortBy,
            @RequestParam(name = "sortDirection", defaultValue = "ASC") String sortDirection
    ) {
        return ResponseEntity.ok(this.tenantService.findAllTenants(page, size, keyword, sortBy, sortDirection));
    }

    @Operation(
            summary = "Current tenants",
            description = "Returns a current tenant."
    )
    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'ADMIN')")
    public ResponseEntity<TenantResponse> getCurrentTenant() {
        return ResponseEntity.ok(this.tenantService.getCurrentTenant());
    }
}
