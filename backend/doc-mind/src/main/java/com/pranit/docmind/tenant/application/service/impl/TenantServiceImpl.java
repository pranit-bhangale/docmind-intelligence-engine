package com.pranit.docmind.tenant.application.service.impl;

import com.pranit.docmind.shared.exception.DuplicateResourceException;
import com.pranit.docmind.shared.exception.InvalidRequestException;
import com.pranit.docmind.shared.wrapper.PageResponse;
import com.pranit.docmind.tenant.api.TenantContext;
import com.pranit.docmind.tenant.application.mapper.TenantMapper;
import com.pranit.docmind.tenant.application.service.TenantProvisioningService;
import com.pranit.docmind.tenant.application.service.TenantService;
import com.pranit.docmind.tenant.application.specification.TenantSpecification;
import com.pranit.docmind.tenant.domain.dto.TenantRegisterRequest;
import com.pranit.docmind.tenant.domain.dto.TenantResponse;
import com.pranit.docmind.tenant.domain.entity.Tenant;
import com.pranit.docmind.tenant.domain.entity.TenantStatus;
import com.pranit.docmind.tenant.domain.repository.TenantRepository;
import com.pranit.docmind.tenant.exception.TenantNotFoundException;
import jakarta.persistence.EntityNotFoundException;
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

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantServiceImpl implements TenantService {

    private final TenantRepository tenantRepository;
    private final TenantMapper tenantMapper;
    private final PasswordEncoder passwordEncoder;
    private final TenantProvisioningService tenantProvisioningService;

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void registerTenant(final TenantRegisterRequest request) {
        if (this.tenantRepository.existsByCompanyCode(request.companyCode())) {
            throw new DuplicateResourceException("Tenant already exists");
        }
        if (this.tenantRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("Tenant Email already exists");
        }
        final Tenant tenant = this.tenantMapper.toEntity(request);
        tenant.setAdminPassword(this.passwordEncoder.encode(request.adminPassword()));
        tenant.setStatus(TenantStatus.PENDING);
        this.tenantRepository.save(tenant);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void approveTenant(final String tenantId) {
        final int updated = tenantRepository.updateStatus
                (tenantId, TenantStatus.PENDING, TenantStatus.PROVISIONING);
        if (updated != 1) {
            throw new InvalidRequestException("Only PENDING tenants can be approved");
        }
        tenantProvisioningService.provisionTenant(tenantId);
        log.info("Tenant {} moved to PROVISIONING", tenantId);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void activateTenant(final String tenantId) {
        final Tenant tenant = this.fetchAndValidateTenantById(tenantId);
        if (tenant.getStatus() != TenantStatus.APPROVED && tenant.getStatus() != TenantStatus.SUSPENDED) {
            throw new InvalidRequestException("Tenant can only be activated when status is APPROVED or SUSPENDED");
        }
        tenant.setStatus(TenantStatus.ACTIVE);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void deactivateTenant(final String tenantId) {
        final Tenant tenant = this.fetchAndValidateTenantById(tenantId);
        if (tenant.getStatus() != TenantStatus.ACTIVE) {
            throw new InvalidRequestException("Tenant can only be deactivated when status is ACTIVE");
        }
        tenant.setStatus(TenantStatus.INACTIVE);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void suspendTenant(final String tenantId) {
        final Tenant tenant = this.fetchAndValidateTenantById(tenantId);
        if (tenant.getStatus() != TenantStatus.INACTIVE) {
            throw new InvalidRequestException("Tenant can only be suspended when status is INACTIVE");
        }
        tenant.setStatus(TenantStatus.SUSPENDED);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED, readOnly = true)
    public PageResponse<TenantResponse> findAllTenants(
            final int page, final int size, final String keyword,
            final String sortBy, final String sortDirection) {
        final Sort.Direction direction = "asc".equalsIgnoreCase(sortDirection)
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        final Sort sort = Sort.by(direction, sortBy);
        final Pageable pageable = PageRequest.of(page, size, sort);
        final Specification<Tenant> specification = TenantSpecification.searchKeyword(keyword);
        final Page<Tenant> pages = this.tenantRepository.findAll(specification, pageable);
        final List<TenantResponse> content = pages.getContent()
                .stream()
                .map(tenantMapper::toResponse)
                .toList();
        return PageResponse.<TenantResponse>builder()
                .contents(content)
                .currentPage(pages.getNumber())
                .pageSize(pages.getSize())
                .totalElements(pages.getTotalElements())
                .totalPages(pages.getTotalPages())
                .isLastPage(pages.isLast())
                .isFirstPage(pages.isFirst())
                .build();
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED, readOnly = true)
    public TenantResponse getCurrentTenant() {
        final String tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null || tenantId.isBlank()) {
            throw new TenantNotFoundException("Tenant context not found");
        }
        final Tenant tenant = fetchAndValidateTenantById(tenantId);
        return tenantMapper.toResponse(tenant);
    }

    private Tenant fetchAndValidateTenantById(final String tenantId) {
        return this.tenantRepository.findBytenantId(tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Tenant does not exist"));
    }
}
