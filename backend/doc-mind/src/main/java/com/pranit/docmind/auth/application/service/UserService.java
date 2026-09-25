package com.pranit.docmind.auth.application.service;

import com.pranit.docmind.auth.domain.dto.UpdatePasswordRequest;
import com.pranit.docmind.auth.domain.dto.UpdateUserRequest;
import com.pranit.docmind.auth.domain.dto.UserResponse;
import com.pranit.docmind.shared.wrapper.PageResponse;

public interface UserService {

    void createInitialAdmin(String tenantId, String username, String email, String fullName, String encodedPassword);

    void updateProfile(UpdateUserRequest request);

    void updatePassword(UpdatePasswordRequest request);

    void deleteProfile();

    PageResponse<UserResponse> findAllUsers(int page, int size, String keyword, String sortBy, String sortDirection);
}
