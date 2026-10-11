/**
 * @fileoverview Tests for lenient JSON parsing of raw LaTeX expressions
 * and for rendering math expressions through renderMarkdownWithLaTeX.
 * @module latexJsonParsingTest
 * @author KwekKwekQuiz Team
 * @version 1.0.0
 */

import { describe, test, expect, vi } from 'vitest';

// renderUtils imports CSS assets; mock them so Vitest can load the module.
vi.mock('highlight.js/styles/github-dark.css', () => ({}));
vi.mock('katex/dist/katex.min.css', () => ({}));

import { escapeLatexBackslashes, parseJsonLenient } from '../js/modules/lenientJsonParser.js';
import { renderMarkdownWithLaTeX } from '../js/modules/renderUtils.js';

// The user's example: fill-in-the-blank + matching with raw LaTeX expressions
// (single backslashes, `<`, `>` inside $...$). Written with String.raw so the
// test source preserves exactly the characters a user would paste.
const USER_EXAMPLE = String.raw`[
{
"type": "fill-in-the-blank",
"question": "### 39. If $\operatorname{Var}(X)=25$, then the standard deviation is ______.",
"correct": "5"
},
{
"type": "matching",
"question": "### 40. Match each covariance value with its interpretation.",
"left": [
"$\operatorname{Cov}(X,Y)>0$",
"$\operatorname{Cov}(X,Y)<0$",
"$\operatorname{Cov}(X,Y)=0$"
],
"right": [
"Inversely correlated",
"No covariance / uncorrelated",
"Positively correlated"
],
"correct": {
"0": 2,
"1": 0,
"2": 1
}
}
]`;

describe('escapeLatexBackslashes', () => {
    test('leaves already-valid JSON unchanged', () => {
        const valid = '{"q":"line1\\nline2","p":"C:\\\\path","u":"\\u0041"}';
        expect(escapeLatexBackslashes(valid)).toBe(valid);
    });

    test('doubles illegal escapes like \\o inside strings', () => {
        const input = '{"q":"$\\operatorname{Var}(X)$"}';
        const output = escapeLatexBackslashes(input);
        expect(JSON.parse(output).q).toBe('$\\operatorname{Var}(X)$');
    });

    test('doubles "valid-looking" escapes inside math spans (\\frac, \\neq, \\text)', () => {
        const input = '{"q":"$\\frac{1}{2}$ and $\\neq$ and $\\text{ok}$"}';
        const output = escapeLatexBackslashes(input);
        expect(JSON.parse(output).q).toBe('$\\frac{1}{2}$ and $\\neq$ and $\\text{ok}$');
    });

    test('keeps genuine JSON newlines outside math spans', () => {
        const input = '{"q":"a\\nb","m":"$x_n$"}';
        const output = escapeLatexBackslashes(input);
        expect(output).toBe(input);
        expect(JSON.parse(output).q).toBe('a\nb');
    });

    test('handles $$...$$ display math as one span', () => {
        const input = '{"q":"$$\\frac{a}{b}$$"}';
        expect(JSON.parse(escapeLatexBackslashes(input)).q).toBe('$$\\frac{a}{b}$$');
    });

    test('does not modify JSON structure or key names', () => {
        const input = '[{"type":"matching","left":["$\\alpha$"]}]';
        const parsed = JSON.parse(escapeLatexBackslashes(input));
        expect(parsed[0].type).toBe('matching');
        expect(parsed[0].left[0]).toBe('$\\alpha$');
    });

    test('unclosed $ in one string does not leak math mode into the next', () => {
        // `$5` opens math but never closes inside its own string; math state must
        // reset at the string boundary so the next string's `\n` stays a newline.
        const input = '{"a":"price $5","b":"x\\ny"}';
        const output = escapeLatexBackslashes(input);
        expect(output).toBe(input);
        expect(JSON.parse(output).b).toBe('x\ny');
    });

    test('escaped dollar \\\\$ does not toggle math mode', () => {
        // `\$` is illegal in JSON; after repair the `$` must not start a math span.
        const input = '{"a":"cost \\\\$5 only"}';
        const output = escapeLatexBackslashes(input);
        expect(JSON.parse(output).a).toBe('cost \\$5 only');
    });
});

describe('parseJsonLenient', () => {
    test('parses the user example (fill-in + matching with LaTeX)', () => {
        const parsed = parseJsonLenient(USER_EXAMPLE);
        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed).toHaveLength(2);

        expect(parsed[0].type).toBe('fill-in-the-blank');
        expect(parsed[0].question).toContain('$\\operatorname{Var}(X)=25$');
        expect(parsed[0].correct).toBe('5');

        expect(parsed[1].type).toBe('matching');
        expect(parsed[1].left[0]).toBe('$\\operatorname{Cov}(X,Y)>0$');
        expect(parsed[1].left[1]).toBe('$\\operatorname{Cov}(X,Y)<0$');
        expect(parsed[1].correct).toEqual({ '0': 2, '1': 0, '2': 1 });
    });

    test('round-trips already-valid JSON without changes', () => {
        const valid = JSON.stringify([{ type: 'true-false', question: 'Q?', correct: true }]);
        expect(JSON.stringify(parseJsonLenient(valid))).toBe(valid);
    });

    test('does not corrupt \\\\frac in input that strict JSON.parse would accept', () => {
        // Strict JSON.parse accepts this but yields a formfeed character —
        // the lenient parser must preserve the literal backslash instead.
        const input = '{"q":"$\\frac{1}{2}$"}';
        expect(() => JSON.parse(input)).not.toThrow(); // strict parse "succeeds"...
        const parsed = parseJsonLenient(input);
        expect(parsed.q).toBe('$\\frac{1}{2}$'); // ...but lenient keeps it intact
        expect(parsed.q).not.toContain('\f');
    });

    test('throws on structurally invalid JSON', () => {
        expect(() => parseJsonLenient('{bad json}')).toThrow();
    });

    test('parses empty containers normally', () => {
        expect(parseJsonLenient('{}')).toEqual({});
        expect(parseJsonLenient('[]')).toEqual([]);
    });
});

describe('renderMarkdownWithLaTeX with comparison expressions', () => {
    test('renders $\\operatorname{Cov}(X,Y)>0$ without KaTeX errors', () => {
        const html = renderMarkdownWithLaTeX('Match $\\operatorname{Cov}(X,Y)>0$ now.');
        expect(html).not.toContain('katex-error');
        expect(html).toContain('katex');
    });

    test('renders < inside math without KaTeX errors', () => {
        const html = renderMarkdownWithLaTeX('If $x_1 < y_2$ hold.');
        expect(html).not.toContain('katex-error');
        expect(html).toContain('katex');
    });

    test('renders display math $$...$$ with comparisons', () => {
        const html = renderMarkdownWithLaTeX('$$\\operatorname{Var}(X)=25$$');
        expect(html).not.toContain('katex-error');
        expect(html).toContain('katex-display');
    });

    test('still renders markdown around expressions', () => {
        const html = renderMarkdownWithLaTeX('### Heading with $x > 0$');
        expect(html).toContain('<h3');
        expect(html).not.toContain('katex-error');
    });
});

