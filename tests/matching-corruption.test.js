/**
 * @fileoverview Regression tests for the matching index-corruption bug.
 * Filtering blank left/right entries without remapping `correct` shifted
 * indices and silently rewrote the answer key. These tests lock in the fix.
 */
import { describe, test, expect, vi } from 'vitest';

vi.mock('../js/modules/dom.js', () => ({
    quizContainer: null,
    summaryContainer: null,
    quizJsonInput: null,
    questionsContainer: null,
    addQuestionBtn: null,
    switchToEditorBtn: null,
    switchToBuilderBtn: null,
    previewQuizBtn: null,
}));

vi.mock('../js/modules/toastNotification.js', () => ({
    showToast: vi.fn(),
}));

import { remapMatchingCorrect } from '../js/modules/quizBuilder.js';
import { validateQuizData, isAnswerCorrect } from '../js/modules/utils.js';

describe('matching remapMatchingCorrect', () => {
    test('re-indexes surviving pairs when a blank left row is dropped', () => {
        // left[1] is blank and filtered; old left 2 ("Brazil") becomes new left 1.
        // Its mapping (old 2 → old right 2 "Brasilia", which becomes new right 1)
        // must survive as {"1": 1}, not collapse to {"0": 0}-style corruption.
        const result = remapMatchingCorrect(
            ['France', '   ', 'Brazil'],
            ['Tokyo', 'Paris', 'Brasilia'],
            { '0': 1, '1': 0, '2': 2 }
        );
        expect(result.left).toEqual(['France', 'Brazil']);
        expect(result.right).toEqual(['Tokyo', 'Paris', 'Brasilia']);
        expect(result.correct).toEqual({ '0': 1, '1': 2 });
    });

    test('re-indexes when a blank right row is dropped', () => {
        // right[0] blank is filtered; old right 1 ("Paris") → new right 0.
        const result = remapMatchingCorrect(
            ['France', 'Japan'],
            ['   ', 'Paris', 'Tokyo'],
            { '0': 1, '1': 2 }
        );
        expect(result.right).toEqual(['Paris', 'Tokyo']);
        expect(result.correct).toEqual({ '0': 0, '1': 1 });
    });

    test('drops mappings that point at removed blank rows', () => {
        const result = remapMatchingCorrect(
            ['France', ''],
            ['Paris', 'Tokyo'],
            { '0': 0, '1': 1 }
        );
        expect(result.left).toEqual(['France']);
        expect(result.correct).toEqual({ '0': 0 });
    });

    test('remapped output passes validation and scores correctly', () => {
        const { left, right, correct } = remapMatchingCorrect(
            ['France', '', 'Brazil'],
            ['Tokyo', 'Paris', 'Brasilia'],
            { '0': 1, '2': 2 }
        );
        const quiz = [{ type: 'matching', question: 'Match.', left, right, correct }];
        expect(validateQuizData(quiz)).toBe(true);
        expect(isAnswerCorrect(quiz[0], { '0': 1, '1': 2 })).toBe(true);
        // Old (corrupted) shape must not validate: stale key "2" is out of bounds.
        expect(validateQuizData([{
            type: 'matching', question: 'Match.',
            left, right, correct: { '0': 1, '2': 2 },
        }])).toBe(false);
    });
});

describe('matching validateQuizData hardening', () => {
    const base = () => ({
        type: 'matching',
        question: 'Match the country to its capital.',
        left: ['France', 'Japan', 'Brazil'],
        right: ['Tokyo', 'Paris', 'Brasilia'],
        correct: { '0': 1, '1': 0, '2': 2 },
    });

    test('accepts the canonical sample question', () => {
        expect(validateQuizData([base()])).toBe(true);
    });

    test('rejects out-of-bounds right index', () => {
        const q = base();
        q.correct = { '0': 5, '1': 0, '2': 2 };
        expect(validateQuizData([q])).toBe(false);
    });

    test('rejects missing mapping for a left item', () => {
        const q = base();
        q.correct = { '0': 1, '1': 0 };
        expect(validateQuizData([q])).toBe(false);
    });

    test('rejects duplicate right assignment', () => {
        const q = base();
        q.correct = { '0': 1, '1': 1, '2': 2 };
        expect(validateQuizData([q])).toBe(false);
    });

    test('rejects non-integer / non-numeric indices', () => {
        const q = base();
        q.correct = { '0': 1, '1': 'x', '2': 2 };
        expect(validateQuizData([q])).toBe(false);
    });

    test('rejects array-shaped correct', () => {
        const q = base();
        q.correct = [1, 0, 2];
        expect(validateQuizData([q])).toBe(false);
    });
});
