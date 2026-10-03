package com.pranit.docmind.auth.controller;

import com.pranit.docmind.auth.application.service.RoleService;
import com.pranit.docmind.auth.domain.dto.RoleResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
@Validated
@Tag(
        name = "Role Management",
        description = "Endpoints for retrieving system roles and authority definitions for tenant access control."
)
public class RoleController {

    private final RoleService roleService;

    @Operation(
            summary = "Fetch all available system roles",
            description = "Returns the complete list of system roles (COMPANY_ADMIN, ADMIN, PLATFORM_ADMIN, USER) available for role assignment."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of system roles fetched successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized access"),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires admin privileges")
    })
    @GetMapping(version = "v1")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'ADMIN', 'PLATFORM_ADMIN')")
    public ResponseEntity<List<RoleResponse>> fetchAllRoles() {
        return ResponseEntity.status(HttpStatus.OK).body(roleService.findAllRoles());
    }
}
