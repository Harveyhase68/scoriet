-- Test SQL for import functionality
CREATE TABLE test_table_no2 (
    test_id INT AUTO_INCREMENT PRIMARY KEY,
    test_name_2 VARCHAR(100) NOT NULL,
    test_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);