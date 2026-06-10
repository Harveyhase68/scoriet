package com.example.{:packagename:}.setup;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** First-run setup API for the React setup wizard. */
@RestController
@RequestMapping("/api/setup")
public class SetupRestController {

    public record SetupStatus(boolean installed, String datasourceUrl, String connectionError) {
    }

    private final SetupService setupService;
    private final String datasourceUrl;

    public SetupRestController(SetupService setupService,
                               @Value("${spring.datasource.url}") String datasourceUrl) {
        this.setupService = setupService;
        this.datasourceUrl = datasourceUrl;
    }

    @GetMapping("/status")
    public SetupStatus status() {
        return new SetupStatus(setupService.isInstalled(), datasourceUrl, setupService.connectionError());
    }

    /** Creates the tables, sample data and the admin/admin user (no-op when already installed). */
    @PostMapping("/install")
    public ResponseEntity<Void> install() {
        setupService.install("admin", "admin");
        return ResponseEntity.noContent().build();
    }
}
