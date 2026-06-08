package com.example.{:packagename:}.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping("/")
    public String home() {
        return "redirect:/customers";
    }

    @GetMapping("/login")
    public String login() {
        return "login";
    }
}
