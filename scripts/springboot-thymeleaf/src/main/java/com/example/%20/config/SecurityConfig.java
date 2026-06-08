package com.example.{:packagename:}.config;

import com.example.{:packagename:}.setup.SetupRedirectFilter;
import com.example.{:packagename:}.setup.SetupService;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/setup/**", "/login", "/error",
                                "/css/**", "/js/**", "/webjars/**", "/favicon.ico").permitAll()
                        .anyRequest().authenticated())
                .formLogin(form -> form
                        .loginPage("/login")
                        .defaultSuccessUrl("/customers")
                        .permitAll())
                .logout(logout -> logout
                        .logoutSuccessUrl("/login?logout"));
        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /** Setup redirect must run before Spring Security (login is impossible without the users table). */
    @Bean
    FilterRegistrationBean<SetupRedirectFilter> setupRedirectFilter(SetupService setupService) {
        FilterRegistrationBean<SetupRedirectFilter> registration =
                new FilterRegistrationBean<>(new SetupRedirectFilter(setupService));
        registration.setOrder(-110); // Spring Security's filter chain runs at -100

        return registration;
    }
}
