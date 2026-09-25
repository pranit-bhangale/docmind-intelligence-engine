package com.pranit.docmind.tenant.application.specification;

import com.pranit.docmind.tenant.domain.entity.Tenant;
import lombok.experimental.UtilityClass;
import org.springframework.data.jpa.domain.Specification;

@UtilityClass
public class TenantSpecification {

    public static Specification<Tenant> searchKeyword(final String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.trim().isEmpty()) return cb.conjunction();
            final String likePattern = "%" + keyword.trim().toLowerCase() + "%";
            return cb.or(cb.like(cb.lower(root.get("companyName")), likePattern),
                    cb.like(cb.lower(root.get("companyCode")), likePattern));
        };
    }
}
