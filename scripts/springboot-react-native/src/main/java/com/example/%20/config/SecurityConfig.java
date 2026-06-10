package com.example.{:packagename:}.config;

import com.example.{:packagename:}.setup.SetupGuardFilter;
import com.example.{:packagename:}.setup.SetupService;
import com.example.{:packagename:}.user.JwtService;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, JwtService jwtService) throws Exception {
        http
                // Stateless Bearer-token auth (React Native app) - no session, no cookies, so no CSRF.
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/setup/**", "/api/auth/login").permitAll()
                        .anyRequest().authenticated())
                // protected endpoints answer with 401 JSON-style, never a redirect to a login page
                .exceptionHandling(ex -> ex.authenticationEntryPoint(
                        new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                // validate the Authorization: Bearer header before the username/password filter
                .addFilterBefore(new JwtAuthenticationFilter(jwtService),
                        UsernamePasswordAuthenticationFilter.class);
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
