package com.example.{:packagename:}.web;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

/** Makes the logged-in username available to every template as {@code ${currentUser}}. */
@ControllerAdvice
public class GlobalModelAttributes {

    @ModelAttribute("currentUser")
    public String currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return null;
        }
        return authentication.getName();
    }
}
