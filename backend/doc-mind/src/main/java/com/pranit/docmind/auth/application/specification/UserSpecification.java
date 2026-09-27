package com.pranit.docmind.auth.application.specification;

import com.pranit.docmind.auth.domain.entity.User;
import lombok.experimental.UtilityClass;
import org.springframework.data.jpa.domain.Specification;

@UtilityClass
public class UserSpecification {

    public static Specification<User> belongsToTenant(final String tenantId) {
        return (root, query, cb) ->
                cb.equal(root.get("tenantId"), tenantId);
    }

    public static Specification<User> searchKeyword(final String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.trim().isEmpty()) return cb.conjunction();
            final String likePattern = "%" + keyword.trim().toLowerCase() + "%";
            return cb.or(cb.like(cb.lower(root.get("username")), likePattern),
                    cb.like(cb.lower(root.get("firstName")), likePattern));
        };
    }
}
