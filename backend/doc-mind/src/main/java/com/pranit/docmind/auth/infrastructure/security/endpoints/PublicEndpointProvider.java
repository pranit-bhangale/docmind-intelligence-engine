package com.pranit.docmind.auth.infrastructure.security.endpoints;

@FunctionalInterface
public interface PublicEndpointProvider {

    String[] publicEndpoints();
}
