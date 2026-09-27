package com.pranit.docmind.tenant.application.service;

import com.pranit.docmind.shared.wrapper.PageResponse;
import com.pranit.docmind.tenant.domain.dto.TenantRegisterRequest;
import com.pranit.docmind.tenant.domain.dto.TenantResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public interface TenantService {

    void registerTenant(@Valid TenantRegisterRequest request);

    void approveTenant(String tenantId);

    void activateTenant(String tenantId);

    void deactivateTenant(String tenantId);

    void suspendTenant(String tenantId);

    PageResponse<TenantResponse> findAllTenants(@Min(0) int page, @Min(1) @Max(10) int size, String keyword, String sortBy, String sortDirection);

    TenantResponse getCurrentTenant();
}
