import { useMemo } from 'react';
import { FieldPath, FieldValues } from 'react-hook-form';

export type IncompleteField = { path: string; reason: 'empty' };

function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (value instanceof Date) return false; // Dates are never empty if they exist
  if (typeof value === 'number') return false; // Numbers are never empty if they exist
  if (typeof value === 'boolean') return false; // Booleans are never empty
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  return false;
}

function isNullableField(path: string): boolean {
  // Define known nullable fields from the schema
  const nullableFields = [
    'audience.regionalRestriction',
    'audience.minimumAgeRestriction'
    // Add other nullable fields here as they're identified
  ];

  return nullableFields.includes(path);
}

function shouldSkipConditionalField(path: string, allValues: any): boolean {
  // Handle regional restrictions - skip nested fields if regionalRestriction is null
  if (path.includes('audience.regionalRestriction.')) {
    const regionalRestriction = allValues?.audience?.regionalRestriction;
    if (regionalRestriction == null) {
      return true; // Skip nested fields when regional restriction is disabled
    }
  }

  // Handle minimum age restrictions - skip nested fields if minimumAgeRestriction is null
  if (path.includes('audience.minimumAgeRestriction.')) {
    const minimumAgeRestriction = allValues?.audience?.minimumAgeRestriction;
    if (minimumAgeRestriction == null) {
      return true; // Skip nested fields when minimum age restriction is disabled
    }
  }

  // Add other conditional field patterns here as needed
  return false;
}

export function findIncompleteFields<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>
>(currentValues: any, prefix?: TName): IncompleteField[] {
  const result: IncompleteField[] = [];

  function traverseObject(
    current: any,
    path: string = '',
    allValues: any = currentValues
  ) {
    // Skip conditional fields that are disabled
    if (shouldSkipConditionalField(path, allValues)) {
      return;
    }

    // Check if current value is empty
    if (isEmpty(current)) {
      // If this is a nullable field and it's null, don't consider it incomplete
      if (isNullableField(path) && current === null) {
        return;
      }
      result.push({ path, reason: 'empty' });
      return;
    }

    // For arrays - check if empty or traverse items
    if (Array.isArray(current)) {
      if (current.length === 0) {
        result.push({ path, reason: 'empty' });
        return;
      }

      // Traverse array items
      current.forEach((item, index) => {
        const itemPath = path ? `${path}.${index}` : `${index}`;
        traverseObject(item, itemPath, allValues);
      });
      return;
    }

    // For objects - traverse their properties
    if (typeof current === 'object' && current !== null) {
      if (current instanceof Date) {
        // Dates are never empty if they exist
        return;
      }

      const currentKeys = Object.keys(current);

      // If object has no keys, consider it empty
      if (currentKeys.length === 0) {
        result.push({ path, reason: 'empty' });
        return;
      }

      // Traverse object properties
      currentKeys.forEach((key) => {
        const keyPath = path ? `${path}.${key}` : key;
        const currentValue = current[key];

        traverseObject(currentValue, keyPath, allValues);
      });
      return;
    }

    // For primitive values that aren't empty, they are considered complete
  }

  const startPath = prefix || '';
  traverseObject(currentValues, startPath);

  return result;
}

export const useIncompleteFields = <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>
>(
  currentValues: TFieldValues,
  fields: TName[]
): IncompleteField[] => {
  return useMemo(() => {
    const allIncomplete = findIncompleteFields(currentValues);

    return allIncomplete.filter((incomplete) =>
      fields.some(
        (field) =>
          incomplete.path === field || incomplete.path.startsWith(`${field}.`)
      )
    );
  }, [currentValues, fields]);
};
