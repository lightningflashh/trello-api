/**
 * This file contains validation rules for various data types.
 * It uses regular expressions to validate strings against specific patterns.
 */

export const OBJECT_ID_RULE = /^[0-9a-fA-F]{24}$/
export const OBJECT_ID_RULE_MESSAGE = 'Your string fails to match the Object Id pattern!'