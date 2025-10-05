-- Test SQL for import functionality
CREATE TABLE test_table (
    test_id INT AUTO_INCREMENT PRIMARY KEY,
    test_name VARCHAR(100) NOT NULL,
    test_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);