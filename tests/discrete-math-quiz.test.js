/**
 * @fileoverview End-to-end fixture tests for the 45-question discrete-math quiz:
 * lenient parsing, validation, corruption checks, rendering sweep, option
 * label conversion, scoring, and jsdom rendering of the enumeration dropdowns.
 * @module discreteMathQuizTest
 * @author KwekKwekQuiz Team
 * @version 1.0.0
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// CSS imports in renderUtils must be mocked for Vitest.
vi.mock('highlight.js/styles/github-dark.css', () => ({}));
vi.mock('katex/dist/katex.min.css', () => ({}));

// localStorage mock (randomizeQuestions / randomizeChoices settings).
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: vi.fn((key) => store[key] ?? null),
        setItem: vi.fn((key, value) => { store[key] = String(value); }),
        removeItem: vi.fn((key) => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; })
    };
})();
global.localStorage = localStorageMock;

// Mock the DOM module before importing render modules. Elements are created
// inside the factory so they exist regardless of factory execution timing.
vi.mock('../js/modules/dom.js', () => {
    const make = (id, tag = 'div') => {
        const el = document.createElement(tag);
        el.id = id;
        document.body.appendChild(el);
        return el;
    };
    return {
        quizContainer: make('quiz-container'),
        summaryContainer: make('summary-container'),
        submitBtn: make('submit-btn', 'button'),
        progressText: null,
        progressMeter: null,
        errorDiv: null,
        prevBtn: null,
        nextBtn: null,
        quizJsonInput: null
    };
});

// Mock toast notifications used by utils.
vi.mock('../js/modules/toastNotification.js', () => ({
    showToast: vi.fn()
}));

import { parseJsonLenient } from '../js/modules/lenientJsonParser.js';
import { validateQuizData, isAnswerCorrect } from '../js/modules/utils.js';
import { renderMarkdownWithLaTeX, latexToPlainText } from '../js/modules/renderUtils.js';
import * as State from '../js/modules/state.js';
import { createQuizPlayerElements, renderCurrentQuestion } from '../js/modules/quizPlayer.js';

const fixtureText = readFileSync(
    resolve(process.cwd(), 'tests/fixtures/discrete-math-quiz.json'),
    'utf8'
);

const quiz = parseJsonLenient(fixtureText);

/** Collects every string value inside an arbitrary JSON structure. */
function collectStrings(value, out = []) {
    if (typeof value === 'string') out.push(value);
    else if (Array.isArray(value)) value.forEach(v => collectStrings(v, out));
    else if (value && typeof value === 'object') Object.values(value).forEach(v => collectStrings(v, out));
    return out;
}

describe('45-question fixture: parsing and validation', () => {
    test('parses all 45 questions', () => {
        expect(Array.isArray(quiz)).toBe(true);
        expect(quiz).toHaveLength(45);
    });

    test('passes validateQuizData', () => {
        expect(validateQuizData(quiz)).toBe(true);
    });

    test('uses all six expected question types', () => {
        const types = [...new Set(quiz.map(q => q.type))].sort();
        expect(types).toEqual([
            'enumeration-any-order', 'enumeration-ordered', 'fill-in-the-blank',
            'matching', 'multiple-choice', 'true-false'
        ]);
    });

    test('contains no control-character corruption (formfeed/tab/CR from \\f, \\t, \\r)', () => {
        const allStrings = collectStrings(quiz);
        expect(allStrings.length).toBeGreaterThan(150);
        const C0_CONTROL = /[\u0000-\u0008\u000B-\u000D\u000E-\u001F]/;
        allStrings.forEach(s => expect(s).not.toMatch(C0_CONTROL));
    });

    test('spot-checks preserved LaTeX values', () => {
        expect(quiz[36].options[0]).toBe('$\\$5$');          // Q37 escaped dollar
        expect(quiz[29].options[0]).toBe('$m\\nmid(a-b)$');  // Q30 \nmid
        expect(quiz[9].options[1]).toBe('$\\neg P \\lor Q$');// Q10
        expect(quiz[7].question).toContain('$P \\leftrightarrow Q$');
        expect(quiz[38].question).toContain('$\\operatorname{Var}(X)=25$');
        expect(quiz[39].left[0]).toBe('$\\operatorname{Cov}(X,Y)>0$');
        expect(quiz[20].correct).toBe('|B|');
    });
});

describe('45-question fixture: rendering sweep', () => {
    test('every question/option/item string renders without KaTeX errors', () => {
        const targets = [];
        quiz.forEach(q => {
            targets.push(q.question);
            (q.options || []).forEach(v => targets.push(v));
            (q.items || []).forEach(v => targets.push(v));
            (q.left || []).forEach(v => targets.push(v));
            (q.right || []).forEach(v => targets.push(v));
            if (typeof q.correct === 'string') targets.push(q.correct);
            if (Array.isArray(q.correct)) q.correct.forEach(v => targets.push(v));
        });
        expect(targets.length).toBeGreaterThan(150);
        targets.forEach(t => {
            const html = renderMarkdownWithLaTeX(String(t));
            expect(html).not.toContain('katex-error');
        });
    });

    test('Q37 $\\$5$ renders as math with a dollar sign', () => {
        const html = renderMarkdownWithLaTeX(quiz[36].options[0]);
        expect(html).toContain('katex');
        expect(html).not.toContain('katex-error');
        expect(html).not.toContain('$5$'); // no leftover raw delimiters
    });

    test('comparison expressions render (Q40 left items)', () => {
        const html = renderMarkdownWithLaTeX(quiz[39].left[0]);
        // With the old order (marked first), `>` reached KaTeX as `&gt;` and
        // produced a katex-error span. That is the regression this guards.
        expect(html).toContain('katex');
        expect(html).not.toContain('katex-error');
        expect(html).not.toContain('ParseError');
    });
});

describe('latexToPlainText (option labels)', () => {
    test('converts symbol commands to Unicode', () => {
        expect(latexToPlainText('$\\neg P \\lor Q$')).toBe('¬ P ∨ Q');
        expect(latexToPlainText('$P \\land Q$')).toBe('P ∧ Q');
        expect(latexToPlainText('$0\\le P(A)\\le1$')).toBe('0≤ P(A)≤1');
        expect(latexToPlainText('$m\\nmid(a-b)$')).toBe('m∤(a-b)');
        expect(latexToPlainText('$\\forall x\\,P(x)$')).toBe('∀ x P(x)');
    });

    test('converts fractions, binomials, and operatorname', () => {
        expect(latexToPlainText('$\\frac{n!}{(n-r)!}$')).toBe('(n!)/((n-r)!)');
        expect(latexToPlainText('$\\binom{n}{r}$')).toBe('(n choose r)');
        expect(latexToPlainText('$\\operatorname{Cov}(X,Y)>0$')).toBe('Cov(X,Y)>0');
        expect(latexToPlainText('$\\sqrt{2}$')).toBe('√(2)');
    });

    test('keeps escaped dollars and non-math text intact', () => {
        expect(latexToPlainText('$\\$5$')).toBe('$5');
        expect(latexToPlainText("De Morgan's Law for conjunction")).toBe("De Morgan's Law for conjunction");
        expect(latexToPlainText('Domination law: $P \\lor T$')).toBe('Domination law: P ∨ T');
    });
});

describe('45-question fixture: scoring', () => {
    test('multiple-choice scoring (Q1 correct=2)', () => {
        expect(isAnswerCorrect(quiz[0], 2)).toBe(true);
        expect(isAnswerCorrect(quiz[0], 1)).toBe(false);
    });

    test('fill-in-the-blank scoring (Q21 "|B|")', () => {
        expect(isAnswerCorrect(quiz[20], '|B|')).toBe(true);
        expect(isAnswerCorrect(quiz[20], ' |b| ')).toBe(true);
        expect(isAnswerCorrect(quiz[20], 'B')).toBe(false);
    });

    test('enumeration-ordered scoring (Q9)', () => {
        const q = quiz[8];
        expect(isAnswerCorrect(q, [...q.correct])).toBe(true);
        expect(isAnswerCorrect(q, [...q.correct].reverse())).toBe(false);
    });

    test('enumeration-any-order scoring (Q45, shuffled)', () => {
        const q = quiz[44];
        expect(isAnswerCorrect(q, [...q.correct].reverse())).toBe(true);
        expect(isAnswerCorrect(q, [q.correct[0]])).toBe(false);
    });

    test('matching scoring (Q40)', () => {
        const q = quiz[39];
        expect(isAnswerCorrect(q, { ...q.correct })).toBe(true);
        expect(isAnswerCorrect(q, { '0': 0, '1': 0, '2': 1 })).toBe(false);
    });
});

describe('jsdom rendering: enumeration dropdowns and matching labels', () => {
    beforeEach(() => {
        localStorage.clear();
        const container = document.getElementById('quiz-container');
        if (container) container.innerHTML = '';
        State.setQuizData([]);
        State.resetQuizState(0);
        State.setCurrentQuestionIndex(0);
        createQuizPlayerElements();
    });

    function renderQuestion(index) {
        State.setQuizData([quiz[index]]);
        State.resetQuizState(1);
        State.setCurrentQuestionIndex(0);
        renderCurrentQuestion();
        return document.getElementById('quiz-container');
    }

    test('Q9 renders 6 dropdowns with items, live preview, and state updates', () => {
        const container = renderQuestion(8);

        const selects = container.querySelectorAll('select.enumeration-input');
        expect(selects.length).toBe(6);

        // Placeholder + 6 item options in canonical order
        expect(selects[0].options.length).toBe(7);
        expect(selects[0].options[0].value).toBe('');
        expect(selects[0].options[1].textContent).toBe('Parentheses');

        // Selection writes state and fills the preview
        selects[1].value = 'Negation';
        selects[1].dispatchEvent(new Event('change'));
        expect(State.getUserAnswerAtIndex(0)[1]).toBe('Negation');
        const preview = selects[1].parentElement.querySelector('.enumeration-preview');
        expect(preview.textContent).toContain('Negation');

        // Duplicate prevention: option chosen in slot 0 is disabled in slot 1
        selects[0].value = 'Parentheses';
        selects[0].dispatchEvent(new Event('change'));
        const dupOption = Array.from(selects[1].options).find(o => o.value === 'Parentheses');
        expect(dupOption.disabled).toBe(true);
        // ...but not within slot 0 itself
        const ownOption = Array.from(selects[0].options).find(o => o.value === 'Parentheses');
        expect(ownOption.disabled).toBe(false);
    });

    test('Q45 math items get readable labels and a KaTeX preview', () => {
        const container = renderQuestion(44);

        const selects = container.querySelectorAll('select.enumeration-input');
        expect(selects.length).toBe(3);

        const mathLabel = Array.from(selects[0].options).find(o => o.value === '$0\\le P(A)\\le1$');
        expect(mathLabel).toBeDefined();
        expect(mathLabel.textContent).toBe('0≤ P(A)≤1');
        expect(mathLabel.textContent).not.toContain('\\');

        selects[0].value = '$0\\le P(A)\\le1$';
        selects[0].dispatchEvent(new Event('change'));
        const preview = selects[0].parentElement.querySelector('.enumeration-preview');
        expect(preview.innerHTML).toContain('katex');
        expect(preview.innerHTML).not.toContain('katex-error');
    });

    test('Q40 matching renders math in left items and readable select labels', () => {
        const container = renderQuestion(39);

        const leftItems = container.querySelectorAll('.matching-left-item');
        expect(leftItems.length).toBe(3);
        expect(leftItems[0].innerHTML).toContain('katex');
        expect(leftItems[0].innerHTML).not.toContain('katex-error');

        const selects = container.querySelectorAll('.matching-select');
        expect(selects.length).toBe(3);
        // Left items are the <option> sources; labels must be readable text.
        expect(selects[0].options[1].textContent).toBe('1. Cov(X,Y)>0');
        expect(selects[0].options[1].textContent).not.toContain('\\');
    });

    test('Q37 MCQ option buttons render $\\$5$ as KaTeX', () => {
        const container = renderQuestion(36);

        const buttons = container.querySelectorAll('ul li button');
        expect(buttons.length).toBe(4);
        expect(buttons[0].innerHTML).toContain('katex');
        expect(buttons[0].innerHTML).not.toContain('katex-error');
    });
});
