package com.example.{:packagename:}.setup;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/setup")
public class SetupController {

    private final SetupService setupService;
    private final String datasourceUrl;

    public SetupController(SetupService setupService,
                           @Value("${spring.datasource.url}") String datasourceUrl) {
        this.setupService = setupService;
        this.datasourceUrl = datasourceUrl;
    }

    @GetMapping
    public String setupPage(Model model) {
        model.addAttribute("datasourceUrl", datasourceUrl);
        model.addAttribute("connectionError", setupService.connectionError());
        return "setup";
    }

    @PostMapping("/install")
    public String install(RedirectAttributes redirectAttributes) {
        try {
            setupService.install("admin", "admin");
        } catch (Exception ex) {
            redirectAttributes.addFlashAttribute("installError", ex.getMessage());
            return "redirect:/setup";
        }
        return "redirect:/login?setup";
    }
}
