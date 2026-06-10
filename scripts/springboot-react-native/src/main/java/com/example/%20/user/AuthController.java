package com.example.{:packagename:}.user;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Stateless JWT login for the React Native app:
 * POST /api/auth/login returns a signed Bearer token plus the user info,
 * GET /api/auth/me returns the logged-in user (or 401). Logout is client-side
 * (the app simply discards the token), so there is no logout endpoint.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    public record LoginRequest(@NotBlank String username, @NotBlank String password) {
    }

    public record UserInfo(String username, String displayName, String role) {
    }

    public record LoginResponse(String token, UserInfo user) {
    }

    private final AuthenticationManager authenticationManager;
    private final AppUserRepository userRepository;
    private final JwtService jwtService;

    public AuthController(AuthenticationManager authenticationManager,
                          AppUserRepository userRepository, JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(
                        loginRequest.username(), loginRequest.password()));

        UserInfo user = userInfo(authentication);
        String token = jwtService.generateToken(user.username(), user.role());
        return new LoginResponse(token, user);
    }

    /** 401 when not authenticated (Spring Security entry point), user info otherwise. */
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
