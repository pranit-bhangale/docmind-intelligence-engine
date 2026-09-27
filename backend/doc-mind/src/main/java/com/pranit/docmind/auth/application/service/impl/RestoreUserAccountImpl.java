package com.pranit.docmind.auth.application.service.impl;

import com.pranit.docmind.auth.application.service.RestoreUserAccount;
import com.pranit.docmind.auth.domain.entity.User;
import com.pranit.docmind.auth.domain.repository.UserRepository;
import com.pranit.docmind.auth.exception.AccountDeletedException;
import com.pranit.docmind.auth.exception.UserNotExistsException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RestoreUserAccountImpl implements RestoreUserAccount {

    private final UserRepository userRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void restoreUserAccount(final UUID userId) {
        final User user = validateAndFindUserByUserId(userId);
        if (!user.isDeleted()) return;
        final Instant scheduledDeletionAt = user.getScheduledDeletionAt();
        if (scheduledDeletionAt == null) {
            throw new AccountDeletedException("Account cannot be recovered");
        }
        if (!Instant.now().isBefore(scheduledDeletionAt)) {
            throw new AccountDeletedException("Account recovery period has expired");
        }
        user.setDeleted(false);
        user.setScheduledDeletionAt(null);
        log.info("Soft-deleted account restored after successful login. userId: {}", userId);
    }

    private User validateAndFindUserByUserId(UUID userId) {
        return this.userRepository.findByUserId(userId)
                .orElseThrow(() -> {
                    log.warn("UserId {} not found", userId);
                    return new UserNotExistsException("User not found");
                });
    }
}
