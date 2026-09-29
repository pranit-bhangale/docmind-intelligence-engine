package com.pranit.docmind.document.application.specification;

import com.pranit.docmind.document.domain.entity.DocumentMetadata;
import lombok.experimental.UtilityClass;
import org.springframework.data.jpa.domain.Specification;

@UtilityClass
public class DocumentSpecification {

    public static Specification<DocumentMetadata> belongsToUser(final String userId) {
        return (root, query, cb) ->
                cb.equal(root.get("userId"), userId);
    }

    public static Specification<DocumentMetadata> searchKeyword(final String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.trim().isEmpty()) return cb.conjunction();
            final String likePattern = "%" + keyword.trim().toLowerCase() + "%";
            return cb.like(cb.lower(root.get("fileName")), likePattern);
        };
    }
}
