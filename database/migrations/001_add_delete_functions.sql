-- Migration: Add Delete and Truncate Support
-- Description: SQL procedures and functions for deleting individual reports and truncating all data
-- Date: 2025-10-22

-- ============================================================================
-- DELETE INDIVIDUAL REPORT
-- ============================================================================

-- Delete a specific report and its configuration
-- This will cascade delete the report_configuration due to foreign key
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS delete_report_by_id(
    IN p_report_id VARCHAR(36)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Failed to delete report';
    END;
    
    START TRANSACTION;
    
    -- Delete report configuration first (if FK doesn't cascade)
    DELETE FROM report_configurations WHERE report_id = p_report_id;
    
    -- Delete the report
    DELETE FROM reports WHERE id = p_report_id;
    
    COMMIT;
END //

DELIMITER ;

-- ============================================================================
-- TRUNCATE ALL REPORTS
-- ============================================================================

-- Truncate all reports and their configurations
-- This will delete all reports but keep categories intact
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS truncate_all_reports()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Failed to truncate reports';
    END;
    
    START TRANSACTION;
    
    -- Delete all report configurations first
    DELETE FROM report_configurations;
    
    -- Delete all reports
    DELETE FROM reports;
    
    -- Reset auto-increment (optional)
    -- ALTER TABLE reports AUTO_INCREMENT = 1;
    -- ALTER TABLE report_configurations AUTO_INCREMENT = 1;
    
    COMMIT;
END //

DELIMITER ;

-- ============================================================================
-- TRUNCATE ALL CATEGORIES
-- ============================================================================

-- Truncate all categories and their related reports
-- WARNING: This will delete ALL categories, reports, and configurations
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS truncate_all_categories()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Failed to truncate categories';
    END;
    
    START TRANSACTION;
    
    -- Delete all report configurations first (due to FK constraints)
    DELETE FROM report_configurations;
    
    -- Delete all reports
    DELETE FROM reports;
    
    -- Delete all categories
    DELETE FROM categories;
    
    -- Reset auto-increment (optional)
    -- ALTER TABLE categories AUTO_INCREMENT = 1;
    -- ALTER TABLE reports AUTO_INCREMENT = 1;
    -- ALTER TABLE report_configurations AUTO_INCREMENT = 1;
    
    COMMIT;
END //

DELIMITER ;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to count total reports
DELIMITER //

CREATE FUNCTION IF NOT EXISTS count_total_reports()
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE total INT;
    SELECT COUNT(*) INTO total FROM reports;
    RETURN total;
END //

DELIMITER ;

-- Function to count total categories
DELIMITER //

CREATE FUNCTION IF NOT EXISTS count_total_categories()
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE total INT;
    SELECT COUNT(*) INTO total FROM categories;
    RETURN total;
END //

DELIMITER ;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

-- To delete a specific report:
-- CALL delete_report_by_id('report-uuid-here');

-- To truncate all reports (keeps categories):
-- CALL truncate_all_reports();

-- To truncate all categories (deletes everything):
-- CALL truncate_all_categories();

-- To check counts:
-- SELECT count_total_reports();
-- SELECT count_total_categories();
