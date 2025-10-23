import type { ReportBuilderConfiguration } from '../api/reportBuilder'

/**
 * Generates a complete SQL query from a report configuration
 */
export const generateSQLQuery = (config: ReportBuilderConfiguration): string => {
  let query = 'SELECT '

  // Step 4 & 11: Build SELECT clause with print fields and summary fields
  const selectFields: string[] = []

  // Add regular print order fields (Step 4)
  if (config.printOrderFields && config.printOrderFields.length > 0) {
    selectFields.push(...config.printOrderFields)
  }

  // Add joined print order fields (Step 11)
  if (config.joinedPrintOrderFields && config.joinedPrintOrderFields.length > 0) {
    selectFields.push(...config.joinedPrintOrderFields)
  }

  // Step 5: Add summary fields with SUM aggregation
  if (config.summaryFields && config.summaryFields.length > 0) {
    const sumFields = config.summaryFields.map(field => `SUM(${field}) AS total_${field}`)
    selectFields.push(...sumFields)
  }

  // Add fields to query
  if (selectFields.length > 0) {
    query += selectFields.join(', ')
  } else {
    query += '*'
  }

  // Step 3: Add FROM clause (Data Source)
  query += `\nFROM ${config.dataSource}`

  // Step 10: Add JOIN clause if exists (Manual Join Query)
  if (config.joinQuery?.trim()) {
    query += `\n${config.joinQuery}`
  }

  // Step 7: Add WHERE clause for filters (Select Filters)
  if (config.filterConditions && config.filterConditions.length > 0) {
    const conditions = config.filterConditions
      .filter(c => c.field && c.operator && c.value)
      .map(c => {
        // Map operators to SQL syntax
        let sqlOperator = c.operator
        if (c.operator === 'equal to') sqlOperator = '='
        else if (c.operator === 'not equal to') sqlOperator = '!='
        else if (c.operator === 'greater than') sqlOperator = '>'
        else if (c.operator === 'less than') sqlOperator = '<'

        return `${c.field} ${sqlOperator} '${c.value}'`
      })

    if (conditions.length > 0) {
      query += `\nWHERE ${conditions.join(' AND ')}`
    }
  }

  // Step 8 & 12: Add GROUP BY clause (Grouping & Summarization)
  const groupByFields: string[] = []

  // Regular group by fields (Step 8)
  if (config.groupByFields && config.groupByFields.length > 0) {
    groupByFields.push(...config.groupByFields)
  }

  // Joined group by fields (Step 12)
  if (config.joinedGroupByFields && config.joinedGroupByFields.length > 0) {
    groupByFields.push(...config.joinedGroupByFields)
  }

  if (groupByFields.length > 0) {
    query += `\nGROUP BY ${groupByFields.join(', ')}`
  }

  // Step 9 & 13: Add HAVING clause for aggregate filters
  const havingConditions: string[] = []

  // Regular aggregate filters (Step 9)
  if (config.aggregateFilters && config.aggregateFilters.length > 0) {
    const conditions = config.aggregateFilters
      .filter(c => c.field && c.operator && c.value)
      .map(c => {
        let sqlOperator = c.operator
        if (c.operator === 'equal to') sqlOperator = '='

        return `${c.field} ${sqlOperator} ${c.value}`
      })
    havingConditions.push(...conditions)
  }

  // Joined aggregate filters (Step 13)
  if (config.joinedAggregateFilters && config.joinedAggregateFilters.length > 0) {
    const conditions = config.joinedAggregateFilters
      .filter(c => c.field && c.operator && c.value)
      .map(c => {
        let sqlOperator = c.operator
        if (c.operator === 'equal to') sqlOperator = '='

        return `${c.field} ${sqlOperator} ${c.value}`
      })
    havingConditions.push(...conditions)
  }

  if (havingConditions.length > 0) {
    query += `\nHAVING ${havingConditions.join(' AND ')}`
  }

  // Step 6: Add ORDER BY clause (Select Sort)
  if (config.sortFields && config.sortFields.length > 0) {
    const orderBy = config.sortFields.map((field, index) => {
      const order = config.sortOrders[index] || 'ASC'
      return `${field} ${order}`
    })
    query += `\nORDER BY ${orderBy.join(', ')}`
  }

  query += ';'

  return query
}

/**
 * SQL procedures for database maintenance operations
 */
export const SQL_PROCEDURES = {
  // Delete a specific report and its configuration
  DELETE_REPORT_BY_ID: `
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
  `,

  // Truncate all reports and their configurations
  TRUNCATE_ALL_REPORTS: `
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
  `,

  // Truncate all categories and their related reports
  TRUNCATE_ALL_CATEGORIES: `
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
  `,

  // Helper function to count total reports
  COUNT_TOTAL_REPORTS: `
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
  `,

  // Helper function to count total categories
  COUNT_TOTAL_CATEGORIES: `
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
  `
}

/**
 * Usage examples for the SQL procedures
 */
export const SQL_PROCEDURE_USAGE = {
  DELETE_REPORT: "CALL delete_report_by_id('report-uuid-here');",
  TRUNCATE_REPORTS: "CALL truncate_all_reports();",
  TRUNCATE_CATEGORIES: "CALL truncate_all_categories();",
  COUNT_REPORTS: "SELECT count_total_reports();",
  COUNT_CATEGORIES: "SELECT count_total_categories();"
}