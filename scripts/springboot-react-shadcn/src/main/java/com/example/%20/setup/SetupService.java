package com.example.{:packagename:}.setup;

import java.sql.Connection;

import javax.sql.DataSource;

import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * First-run setup: checks whether the application tables exist and creates
 * them (schema + sample data + admin user) on demand. The database itself is
 * created automatically via {@code createDatabaseIfNotExist=true} in the JDBC URL.
 */
@Service
public class SetupService {

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    /** Cached once the tables have been found - avoids a DB roundtrip per request. */
    private volatile boolean installed;

    public SetupService(DataSource dataSource, JdbcTemplate jdbcTemplate, PasswordEncoder passwordEncoder) {
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
    }

    /** True when the application tables exist. Never throws - DB down counts as "not installed". */
    public boolean isInstalled() {
        if (installed) {
            return true;
        }
        try {
            Integer count = jdbcTemplate.queryForObject("""
                    SELECT COUNT(*) FROM information_schema.tables
                    WHERE table_schema = DATABASE()
                      AND table_name IN ('users', 'customers', 'postal_codes', 'companies')
                    """, Integer.class);
            installed = count != null && count == 4;
            return installed;
        } catch (Exception ex) {
            return false;
        }
    }

    /** Null when the database is reachable, otherwise the connection error message. */
    public String connectionError() {
        try (Connection connection = dataSource.getConnection()) {
            return null;
        } catch (Exception ex) {
            Throwable root = ex;
            while (root.getCause() != null && root.getCause() != root) {
                root = root.getCause();
            }
            return root.getMessage();
        }
    }

    /** Creates all tables, loads the sample data and creates the initial admin user. */
    public synchronized void install(String adminUsername, String adminPassword) {
        if (isInstalled()) {
            return;
        }
        try (Connection connection = dataSource.getConnection()) {
            ScriptUtils.executeSqlScript(connection, new ClassPathResource("db/schema.sql"));
            ScriptUtils.executeSqlScript(connection, new ClassPathResource("db/data.sql"));
        } catch (Exception ex) {
            throw new IllegalStateException("Could not create database tables: " + ex.getMessage(), ex);
        }
        jdbcTemplate.update("""
                INSERT INTO users (user_username, user_password, user_display_name, user_role, user_enabled)
                VALUES (?, ?, ?, 'ADMIN', 1)
                """, adminUsername, passwordEncoder.encode(adminPassword), "Administrator");
        installed = true;
    }
}
