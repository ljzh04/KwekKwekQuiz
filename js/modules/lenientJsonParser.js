/**
 * @fileoverview Lenient JSON parser module for KwekKwekQuiz
 * Accepts quiz JSON that embeds raw LaTeX expressions (e.g. `$\operatorname{Var}(X)=25$`),
 * which strict JSON.parse rejects because sequences like `\o` are illegal escapes,
 * and which can also be silently corrupted (`\frac` -> formfeed + "rac").
 * @module lenientJsonParser
 * @author KwekKwekQuiz Team
 * @version 1.0.0
 */

/** JSON escape characters that are valid as a single character after a backslash. */
const SIMPLE_ESCAPES = '"\\/bfnrt';

/**
 * Checks whether the four characters following a backslash form a valid
 * `\uXXXX` unicode escape.
 * @function hasUnicodeEscapeSuffix
 * @param {string} text - Full source text
 * @param {number} index - Index of the backslash character
 * @returns {boolean} True if text[index+1] === 'u' and the next 4 chars are hex digits
 * @private
 */
function hasUnicodeEscapeSuffix(text, index) {
    if (text[index + 1] !== 'u') return false;
    return /^[0-9a-fA-F]{4}$/.test(text.slice(index + 2, index + 6));
}

/**
 * Escapes backslashes that would be illegal (or ambiguously corrupting) in JSON,
 * without touching JSON structure or genuine JSON escape sequences.
 *
 * Repair rules (applied only inside string literals):
 * - Inside `$...$` / `$$...$$` math spans, a backslash followed by a letter is
 *   treated as a LaTeX command (e.g. `\frac`, `\neq`, `\rho`) and is doubled so
 *   it survives JSON parsing as literal text.
 * - Any escape that is illegal in JSON regardless of context (`\o`, `\%`, `\{`,
 *   `\u` without 4 hex digits, ...) is doubled everywhere inside strings.
 * - Valid JSON escapes (`\\`, `\"`, `\n`, `\uXXXX`, ...) are left untouched, so
 *   already-correct JSON and genuine newlines are never altered.
 * - The scan is string-aware: key names and JSON structure are never modified.
 *
 * Note: `\"` inside math is left as-is (it is valid JSON); rendering it as a
 * literal quote instead of a LaTeX dieresis is an accepted limitation.
 * @function escapeLatexBackslashes
 * @param {string} text - Raw JSON text possibly containing raw LaTeX
 * @returns {string} Text with unsafe backslashes doubled
 * @todo Support trailing-comma / unquoted-key repair if needed
 * @toimprove Consider `\[...\]` display-math spans as well
 * @tofix None known
 */
export function escapeLatexBackslashes(text) {
    let out = '';
    let inString = false;
    let inMath = false;
    let i = 0;
    const n = text.length;

    while (i < n) {
        const ch = text[i];

        if (!inString) {
            if (ch === '"') inString = true;
            out += ch;
            i += 1;
            continue;
        }

        // Inside a string literal
        if (ch === '\\') {
            const next = text[i + 1];

            if (next === undefined) {
                // Dangling backslash at end of input; leave for JSON.parse to reject.
                out += ch;
                i += 1;
                continue;
            }

            if (next === '\\' || next === '"') {
                // Already a valid escape (escaped backslash or quote). Keep both
                // chars so escaped backslashes are not re-escaped.
                out += ch + next;
                i += 2;
                continue;
            }

            if (next === '$') {
                // `\$` (escaped LaTeX dollar) is illegal in JSON: double the
                // backslash AND consume the `$` so it does not toggle math mode.
                out += '\\' + ch + next;
                i += 2;
                continue;
            }

            if (hasUnicodeEscapeSuffix(text, i)) {
                out += text.slice(i, i + 6);
                i += 6;
                continue;
            }

            if (SIMPLE_ESCAPES.includes(next)) {
                const after = text[i + 2];
                const looksLikeLatexCommand =
                    inMath && after !== undefined && /[a-zA-Z]/.test(after);
                if (looksLikeLatexCommand) {
                    // e.g. `\frac`, `\neq`, `\text` inside $...$: double the backslash.
                    out += '\\' + ch;
                    i += 1;
                    continue;
                }
                // Genuine JSON escape (e.g. a newline outside math): keep as-is.
                out += ch + next;
                i += 2;
                continue;
            }

            // Illegal JSON escape (`\o`, `\%`, `\u` + non-hex, ...): double it.
            out += '\\' + ch;
            i += 1;
            continue;
        }

        if (ch === '$') {
            // Toggle math mode; treat `$$` as a single delimiter.
            if (text[i + 1] === '$') {
                inMath = !inMath;
                out += '$$';
                i += 2;
            } else {
                inMath = !inMath;
                out += ch;
                i += 1;
            }
            continue;
        }

        if (ch === '"') {
            inString = false;
            inMath = false; // math spans never cross string boundaries
            out += ch;
            i += 1;
            continue;
        }

        out += ch;
        i += 1;
    }

    return out;
}

/**
 * Parses JSON leniently, repairing raw LaTeX backslash escapes when needed.
 *
 * Strategy:
 * 1. Compute the repaired text with escapeLatexBackslashes().
 * 2. If the repair changed nothing (already-valid JSON, no LaTeX collisions),
 *    parse the original text — zero behavior change for standard JSON.
 * 3. If the repair changed something, parse the repaired text first. This covers
 *    both inputs strict JSON.parse rejects (`\operatorname`) and inputs it would
 *    silently corrupt (`\frac` inside math).
 * 4. If the repaired text fails to parse, fall back to strict parsing so users
 *    still get the original JSON error for structurally broken input.
 * @function parseJsonLenient
 * @param {string} text - Raw JSON text
 * @returns {any} The parsed JSON value
 * @throws {SyntaxError} The original strict JSON.parse error when repair does not help
 * @todo Add more detailed error reporting that mentions what was repaired
 * @toimprove Support other lenient formats (trailing commas, comments)
 * @tofix Handle non-string input explicitly instead of relying on String methods
 */
export function parseJsonLenient(text) {
    const repaired = escapeLatexBackslashes(text);

    if (repaired !== text) {
        try {
            return JSON.parse(repaired);
        } catch (repairError) {
            // Repair did not fix the structure; fall through to strict parsing
            // so the caller receives the original, familiar error message.
        }
    }

    return JSON.parse(text);
}

