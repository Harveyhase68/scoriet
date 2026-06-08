package com.example.{:packagename:}.config;

import com.example.{:packagename:}.setup.SetupGuardFilter;
import com.example.{:packagename:}.setup.SetupService;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // CSRF token as a readable cookie; the React client sends it back as X-XSRF-TOKEN
                .csrf(csrf -> csrf
                        .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                        .csrfTokenRequestHandler(new SpaCsrfTokenRequestHandler()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/setup/**", "/api/auth/login").permitAll()
                        .requestMatchers("/api/**").authenticated()
                        // everything else is the static React app (index.html, assets/, favicon)
                        .anyRequest().permitAll())
                // the SPA expects 401 JSON-style responses, never a redirect to a login page
                .exceptionHandling(ex -> ex.authenticationEntryPoint(
                        new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .logout(logout -> logout
                        .logoutUrl("/api/auth/logout")
                        .logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler()));
        return http.build();
    }

    /** Exposed for the JSON login endpoint (AuthController). */
    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /** Setup guard must run before Spring Security (login is impossible without the users table). */
    @Bean
    FilterRegistrationBean<SetupGuardFilter> setupGuardFilter(SetupService setupService) {
        FilterRegistrationBean<SetupGuardFilter> registration =
                new FilterRegistrationBean<>(new SetupGuardFilter(setupService));
        registration.setOrder(-110); // Spring Security's filter chain runs at -100
        return registration;
    }
}
