package com.example.{:packagename:}.setup;

import java.io.IOException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Runs before Spring Security: as long as the application tables do not exist,
 * every page request is redirected to the setup wizard (and once installed,
 * the wizard itself redirects back to the application).
 */
public class SetupRedirectFilter extends OncePerRequestFilter {

    private final SetupService setupService;

    public SetupRedirectFilter(SetupService setupService) {
        this.setupService = setupService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        boolean setupRequest = path.startsWith("/setup");

        if (!setupService.isInstalled() && !setupRequest && !isStaticResource(path)) {
            response.sendRedirect("/setup");
            return;
        }
        if (setupService.isInstalled() && setupRequest) {
            response.sendRedirect("/customers");
            return;
        }
        filterChain.doFilter(request, response);
    }

    private boolean isStaticResource(String path) {
        return path.startsWith("/css/") || path.startsWith("/js/")
                || path.startsWith("/webjars/") || path.equals("/favicon.ico")
                || path.equals("/error");
    }
}
