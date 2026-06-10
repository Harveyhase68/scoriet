package com.example.{:packagename:}.user;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.constraints.NotBlank;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Session-based login for the React frontend: POST /api/auth/login sets the
 * session cookie, GET /api/auth/me returns the logged-in user (or 401).
 * Logout is handled by Spring Security at POST /api/auth/logout.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    public record LoginRequest(@NotBlank String username, @NotBlank String password) {
    }

    public record UserInfo(String username, String displayName, String role) {
    }

    private final AuthenticationManager authenticationManager;
    private final AppUserRepository userRepository;
    private final SecurityContextRepository securityContextRepository =
            new HttpSessionSecurityContextRepository();

    public AuthController(AuthenticationManager authenticationManager, AppUserRepository userRepository) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public UserInfo login(@RequestBody LoginRequest loginRequest,
                          HttpServletRequest request, HttpServletResponse response) {
        Authentication authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(
                        loginRequest.username(), loginRequest.password()));

        // protect against session fixation, then persist the authentication in the session
        if (request.getSession(false) != null) {
            request.changeSessionId();
        }
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);

        return userInfo(authentication);
    }

    /** 401 when not logged in (Spring Security entry point), user info otherwise. */
    @GetMapping("/me")
    public UserInfo me(Authentication authentication) {
        return userInfo(authentication);
    }

    private UserInfo userInfo(Authentication authentication) {
        String displayName = userRepository.findByUsernameIgnoreCase(authentication.getName())
                .map(AppUser::getDisplayName).orElse(null);
        String role = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst().map(a -> a.replaceFirst("^ROLE_", "")).orElse(null);
        return new UserInfo(authentication.getName(), displayName, role);
    }
}
