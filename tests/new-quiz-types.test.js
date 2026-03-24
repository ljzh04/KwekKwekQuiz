/**
 * @fileoverview Tests for new quiz types: Enumeration and Matching
 * @module newQuizTypesTest
 * @author KwekKwekQuiz Team
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key]),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

global.localStorage = localStorageMock;

// Create mock DOM elements before importing modules
document.body.innerHTML = `
  <div id="quiz-container"></div>
  <div id="summary-container"></div>
`;

// Mock the modules before importing
vi.mock('../js/modules/dom.js', () => ({
  quizContainer: document.getElementById('quiz-container'),
  summaryContainer: document.getElementById('summary-container'),
}));

vi.mock('../js/modules/toastNotification.js', () => ({
  showToast: vi.fn(),
}));

// Import the modules after mocking
import { validateQuizData } from '../js/modules/utils.js';
import { calculateScore } from '../js/modules/quizEngine.js';
import * as State from '../js/modules/state.js';

describe('New Quiz Types Validation Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Enumeration Any-Order Validation', () => {
    test('validateQuizData should accept valid enumeration-any-order question', () => {
      const validQuiz = [
        {
          type: 'enumeration-any-order',
          question: 'List 3 primary colors',
          items: ['Red', 'Blue', 'Yellow'],
          correct: ['Red', 'Blue', 'Yellow']
        }
      ];
      
      expect(validateQuizData(validQuiz)).toBe(true);
    });

    test('validateQuizData should reject enumeration-any-order without items', () => {
      const invalidQuiz = [
        {
          type: 'enumeration-any-order',
          question: 'List 3 primary colors',
          correct: ['Red', 'Blue', 'Yellow']
        }
      ];
      
      expect(validateQuizData(invalidQuiz)).toBe(false);
    });

    test('validateQuizData should reject enumeration-any-order without correct', () => {
      const invalidQuiz = [
        {
          type: 'enumeration-any-order',
          question: 'List 3 primary colors',
          items: ['Red', 'Blue', 'Yellow']
        }
      ];
      
      expect(validateQuizData(invalidQuiz)).toBe(false);
    });
  });

  describe('Enumeration Ordered Validation', () => {
    test('validateQuizData should accept valid enumeration-ordered question', () => {
      const validQuiz = [
        {
          type: 'enumeration-ordered',
          question: 'List planets in order from the Sun',
          items: ['Mercury', 'Venus', 'Earth'],
          correct: ['Mercury', 'Venus', 'Earth']
        }
      ];
      
      expect(validateQuizData(validQuiz)).toBe(true);
    });

    test('validateQuizData should reject enumeration-ordered with empty items', () => {
      const invalidQuiz = [
        {
          type: 'enumeration-ordered',
          question: 'List planets in order from the Sun',
          items: [],
          correct: ['Mercury', 'Venus', 'Earth']
        }
      ];
      
      expect(validateQuizData(invalidQuiz)).toBe(false);
    });
  });

  describe('Matching Validation', () => {
    test('validateQuizData should accept valid matching question', () => {
      const validQuiz = [
        {
          type: 'matching',
          question: 'Match the country to its capital',
          left: ['France', 'Japan', 'Brazil'],
          right: ['Tokyo', 'Paris', 'Brasilia'],
          correct: { '0': 1, '1': 0, '2': 2 }
        }
      ];
      
      expect(validateQuizData(validQuiz)).toBe(true);
    });

    test('validateQuizData should reject matching without left', () => {
      const invalidQuiz = [
        {
          type: 'matching',
          question: 'Match the country to its capital',
          right: ['Tokyo', 'Paris', 'Brasilia'],
          correct: { '0': 1, '1': 0, '2': 2 }
        }
      ];
      
      expect(validateQuizData(invalidQuiz)).toBe(false);
    });

    test('validateQuizData should reject matching without correct', () => {
      const invalidQuiz = [
        {
          type: 'matching',
          question: 'Match the country to its capital',
          left: ['France', 'Japan', 'Brazil'],
          right: ['Tokyo', 'Paris', 'Brasilia']
        }
      ];
      
      expect(validateQuizData(invalidQuiz)).toBe(false);
    });
  });
});

describe('New Quiz Types Scoring Tests', () => {
  beforeEach(() => {
    State.resetScore();
    vi.clearAllMocks();
  });

  describe('Enumeration Any-Order Scoring', () => {
    test('calculateScore should correctly score enumeration-any-order (correct)', () => {
      const quizData = [
        {
          type: 'enumeration-any-order',
          question: 'List 3 primary colors',
          items: ['Red', 'Blue', 'Yellow'],
          correct: ['Red', 'Blue', 'Yellow']
        }
      ];
      
      State.setQuizData(quizData);
      State.setUserAnswerAtIndex(0, ['Yellow', 'Red', 'Blue']); // Different order
      
      calculateScore();
      
      expect(State.getScore()).toBe(1);
    });

    test('calculateScore should correctly score enumeration-any-order (incorrect)', () => {
      const quizData = [
        {
          type: 'enumeration-any-order',
          question: 'List 3 primary colors',
          items: ['Red', 'Blue', 'Yellow'],
          correct: ['Red', 'Blue', 'Yellow']
        }
      ];
      
      State.setQuizData(quizData);
      State.setUserAnswerAtIndex(0, ['Red', 'Blue', 'Green']); // Wrong item
      
      calculateScore();
      
      expect(State.getScore()).toBe(0);
    });
  });

  describe('Enumeration Ordered Scoring', () => {
    test('calculateScore should correctly score enumeration-ordered (correct)', () => {
      const quizData = [
        {
          type: 'enumeration-ordered',
          question: 'List planets in order from the Sun',
          items: ['Mercury', 'Venus', 'Earth'],
          correct: ['Mercury', 'Venus', 'Earth']
        }
      ];
      
      State.setQuizData(quizData);
      State.setUserAnswerAtIndex(0, ['Mercury', 'Venus', 'Earth']);
      
      calculateScore();
      
      expect(State.getScore()).toBe(1);
    });

    test('calculateScore should correctly score enumeration-ordered (wrong order)', () => {
      const quizData = [
        {
          type: 'enumeration-ordered',
          question: 'List planets in order from the Sun',
          items: ['Mercury', 'Venus', 'Earth'],
          correct: ['Mercury', 'Venus', 'Earth']
        }
      ];
      
      State.setQuizData(quizData);
      State.setUserAnswerAtIndex(0, ['Venus', 'Mercury', 'Earth']); // Wrong order
      
      calculateScore();
      
      expect(State.getScore()).toBe(0);
    });
  });

  describe('Matching Scoring', () => {
    test('calculateScore should correctly score matching (correct)', () => {
      const quizData = [
        {
          type: 'matching',
          question: 'Match the country to its capital',
          left: ['France', 'Japan', 'Brazil'],
          right: ['Tokyo', 'Paris', 'Brasilia'],
          correct: { '0': 1, '1': 0, '2': 2 }
        }
      ];
      
      State.setQuizData(quizData);
      State.setUserAnswerAtIndex(0, { '0': 1, '1': 0, '2': 2 });
      
      calculateScore();
      
      expect(State.getScore()).toBe(1);
    });

    test('calculateScore should correctly score matching (incorrect)', () => {
      const quizData = [
        {
          type: 'matching',
          question: 'Match the country to its capital',
          left: ['France', 'Japan', 'Brazil'],
          right: ['Tokyo', 'Paris', 'Brasilia'],
          correct: { '0': 1, '1': 0, '2': 2 }
        }
      ];
      
      State.setQuizData(quizData);
      State.setUserAnswerAtIndex(0, { '0': 0, '1': 1, '2': 2 }); // Wrong matches
      
      calculateScore();
      
      expect(State.getScore()).toBe(0);
    });
  });
});