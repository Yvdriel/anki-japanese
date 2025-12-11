import crypto from 'crypto';

/**
 * Generate a stable GUID for an Anki note based on the primary key.
 *
 * CRITICAL: This GUID must remain stable across updates so that Anki
 * recognizes existing cards and updates them instead of creating duplicates.
 *
 * We hash only the primary key (not the definition or other fields) so that
 * if a definition is corrected/updated, the GUID remains the same.
 *
 * @param primaryKey - The full first line with all readings (e.g., "先（さき、まず、セン）")
 * @returns A 32-character hex string to use as Anki GUID
 */
export function generateStableGuid(primaryKey: string): string {
  // Use SHA-256 to hash the primary key
  const hash = crypto
    .createHash('sha256')
    .update(primaryKey, 'utf8')
    .digest('hex');

  // Return first 32 characters (standard length for Anki GUIDs)
  return hash.substring(0, 32);
}

/**
 * Validate that a GUID is in the correct format
 * @param guid - The GUID to validate
 * @returns true if valid, false otherwise
 */
export function isValidGuid(guid: string): boolean {
  // Anki GUIDs are 32-character hex strings
  return /^[0-9a-f]{32}$/i.test(guid);
}

/**
 * Generate GUIDs for multiple cards
 * @param primaryKeys - Array of primary keys
 * @returns Array of corresponding GUIDs
 */
export function generateGuids(primaryKeys: string[]): string[] {
  return primaryKeys.map(generateStableGuid);
}
