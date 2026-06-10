package com.example.{:packagename:}.setup;

import java.io.IOException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Runs before Spring Security: as long as the application tables do not exist,
 * every API call except the setup API itself is answered with 503 and
 * {@code setupRequired: true}. The React app reads GET /api/setup/status on
 * startup and routes to the setup wizard; page requests pass through so the
 * SPA itself can always load.
 */
public class SetupGuardFilter extends OncePerRequestFilter {

    private final SetupService setupService;

    public SetupGuardFilter(SetupService setupService) {
        this.setupService = setupService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        boolean guardedApi = path.startsWith("/api/") && !path.startsWith("/api/setup");

        if (guardedApi && !setupService.isInstalled()) {
            response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"message\":\"Setup required\",\"setupRequired\":true}");
            return;
        }
        filterChain.doFilter(request, response);
    }
}
