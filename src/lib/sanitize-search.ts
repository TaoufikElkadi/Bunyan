/**
 * Sanitize user input before interpolating into PostgREST `.or()` filter strings.
 * Strips characters that have special meaning in PostgREST filter syntax:
 *   ,  — separates filter conditions
 *   (  — opens grouped filter
 *   )  — closes grouped filter
 *   .  — separates column.operator.value
 *   %  — wildcard (we add our own)
 *   *  — wildcard
 *   \  — escape character
 */
export function sanitizeSearch(input: string): string {
  return input.replace(/[,().%*\\]/g, "");
}
