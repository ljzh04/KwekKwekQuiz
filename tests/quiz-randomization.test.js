/**
 * @fileoverview Tests for quiz randomization functionality
 * @module quizRandomizationTest
 * @author KwekKwekQuiz Team
 * @version 1.0.0
 */

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key]),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
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
jest.mock('../js/modules/dom.js', () => ({
  quizContainer: document.getElementById('quiz-container'),
  summaryContainer: document.getElementById('summary-container'),
}));

jest.mock('../js/modules/toastNotification.js', () => ({
  showToast: jest.fn(),
}));

// Import the modules after mocking
import { shuffleArray } from '../js/modules/utils.js';
import { startQuiz } from '../js/modules/quizEngine.js';
import * as State from '../js/modules/state.js';

describe('Quiz Randomization Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('shuffleArray should return a shuffled array', () => {
    const originalArray = [1, 2, 3, 4, 5];
    const shuffledArray = shuffleArray(originalArray);
    
    // Check that the array has the same elements
    expect([...shuffledArray].sort()).toEqual([...originalArray].sort());
    
    // Check that the array is different (most of the time)
    // Note: There's a small chance this test could fail due to randomness
    expect(shuffledArray).not.toEqual(originalArray);
  });

  test('startQuiz should randomize question order when setting is enabled', () => {
    // Enable randomize questions setting
    localStorage.setItem('randomizeQuestions', 'true');
    
    const quizContent = [
      { type: 'multiple-choice', question: 'Q1', options: ['A', 'B'], correct: 0 },
      { type: 'multiple-choice', question: 'Q2', options: ['C', 'D'], correct: 1 },
      { type: 'multiple-choice', question: 'Q3', options: ['E', 'F'], correct: 0 }
    ];
    
    startQuiz(quizContent);
    
    const quizData = State.getQuizData();
    
    // Check that the quiz data was set
    expect(quizData).toBeDefined();
    expect(quizData.length).toBe(3);
    
    // Since randomization is involved, we can't predict the exact order,
    // but we can check that all questions are present
    const questions = quizData.map(q => q.question);
    expect(questions).toContain('Q1');
    expect(questions).toContain('Q2');
    expect(questions).toContain('Q3');
  });

  test('startQuiz should randomize choice order when setting is enabled', () => {
    // Enable randomize choices setting
    localStorage.setItem('randomizeChoices', 'true');
    
    const quizContent = [
      { 
        type: 'multiple-choice', 
        question: 'Q1', 
        options: ['Option A', 'Option B', 'Option C'], 
        correct: 0  // Correct answer is 'Option A' at index 0
      }
    ];
    
    startQuiz(quizContent);
    
    const quizData = State.getQuizData();
    const randomizedQuestion = quizData[0];
    
    // The correct answer index should be updated to match the new position of the original correct answer
    expect(randomizedQuestion.options).toBeDefined();
    expect(randomizedQuestion.options.length).toBe(3);
    
    // Find the new index of the original correct answer ('Option A')
    const newCorrectIndex = randomizedQuestion.options.indexOf('Option A');
    expect(randomizedQuestion.correct).toBe(newCorrectIndex);
  });

  test('startQuiz should not randomize when settings are disabled', () => {
    // Disable both randomization settings
    localStorage.setItem('randomizeQuestions', 'false');
    localStorage.setItem('randomizeChoices', 'false');
    
    const quizContent = [
      { type: 'multiple-choice', question: 'Q1', options: ['A', 'B'], correct: 0 },
      { type: 'multiple-choice', question: 'Q2', options: ['C', 'D'], correct: 1 }
    ];
    
    startQuiz(quizContent);
    
    const quizData = State.getQuizData();
    
    // Check that the order remains the same
    expect(quizData[0].question).toBe('Q1');
    expect(quizData[1].question).toBe('Q2');
    
    // Check that options remain in original order
    expect(quizData[0].options).toEqual(['A', 'B']);
    expect(quizData[1].options).toEqual(['C', 'D']);
  });
});