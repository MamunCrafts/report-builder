-- Rollback Migration: Remove Delete and Truncate Support
-- Description: Drops the procedures and functions created in 001_add_delete_functions.sql
-- Date: 2025-10-22

-- ============================================================================
-- DROP PROCEDURES
-- ============================================================================

DROP PROCEDURE IF EXISTS delete_report_by_id;
DROP PROCEDURE IF EXISTS truncate_all_reports;
DROP PROCEDURE IF EXISTS truncate_all_categories;

-- ============================================================================
-- DROP FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS count_total_reports;
DROP FUNCTION IF EXISTS count_total_categories;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify all procedures are dropped:
-- SELECT ROUTINE_NAME, ROUTINE_TYPE 
-- FROM INFORMATION_SCHEMA.ROUTINES 
-- WHERE ROUTINE_SCHEMA = DATABASE() 
-- AND ROUTINE_NAME IN (
--     'delete_report_by_id', 
--     'truncate_all_reports', 
--     'truncate_all_categories',
--     'count_total_reports',
--     'count_total_categories'
-- );
