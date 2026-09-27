package com.pranit.docmind.auth.application.service.impl;

import com.pranit.docmind.auth.application.service.UserDetailService;
import com.pranit.docmind.auth.domain.entity.User;
import com.pranit.docmind.auth.domain.model.UserDetail;
import com.pranit.docmind.auth.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NullMarked;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@NullMarked
public class UserDetailServiceImpl implements UserDetailService {

    private final UserRepository userRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public UserDetails loadUserByUsername(final String username) throws UsernameNotFoundException {
        final User user = userRepository.findUserForAuthenticationByUsername(username)
                .orElseThrow(() -> {
                    log.warn("Username {} not found", username);
                    return new UsernameNotFoundException("Invalid username or password");
                });
        return UserDetail.from(user);
    }
}
