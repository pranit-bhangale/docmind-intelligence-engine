package com.pranit.docmind.auth.application.service.impl;

import com.pranit.docmind.auth.api.UserValidationService;
import com.pranit.docmind.auth.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserValidationServiceImpl implements UserValidationService {

    private final UserRepository userRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public boolean checkUserExists(final UUID userId) {
        return this.userRepository.existsByUserId(userId);
    }
}
