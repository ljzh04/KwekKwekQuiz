import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GeminiService } from './geminiService.js';

// Mock DOM and utils modules
vi.mock('./dom.js', () => ({
  sidebar: null,
  sidebarToggle: null,
  sidebarOverlay: null,
  sidebarLinks: [],
  contentSections: [],
  mainTitle: null,
  appSection: null,
  quizSetup: null,
  quizJsonInput: { value: '' },
  quizImageInput: { files: [] },
  previewContainer: null,
  previewImg: null,
  removeImgBtn: null,
  formatBtn: null,
  modeIndicator: null,
  autocompleteDropdown: null,
  generateBtn: { innerHTML: '', disabled: false },
  loadQuizBtn: null,
  sampleBtn: null,
  saveQuizBtn: null,
  deleteQuizBtn: null,
  shareQuizBtn: null,
  downloadQuizBtn: null,
  savedQuizzesSelect: null,
  quizNameInput: null,
  quizContainer: null,
  prevBtn: null,
  nextBtn: null,
  submitBtn: null,
  progressBar: null,
  navigationButtons: null,
  progressText: null,
  progressMeter: null,
  scoreText: null,
  resultContainer: null,
  summaryContainer: null,
  restartBtn: null,
  backToSetupBtn: null,
  p2pShareModal: null,
  p2pDownloadModal: null,
  myPeerId: null,
  shareStatus: null,
  startReceivingBtn: null,
  stopReceivingBtn: null,
  closeShareModalBtn: null,
  targetPeerId: null,
  downloadStatus: null,
  connectToPeerBtn: null,
  closeDownloadModalBtn: null,
  receivedJsonContainer: null,
  receivedJsonPreview: null,
  settingsSection: null,
  darkModeToggle: null,
  animationToggle: null,
  moonIcon: null,
  sunIcon: null,
  boltOnIcon: null,
  boltOffIcon: null,
  darkModeToggleSetting: null,
  animationToggleSetting: null,
  moonIconSetting: null,
  sunIconSetting: null,
  boltOnIconSetting: null,
  boltOffIconSetting: null,
  apiKeySettingInput: { value: '' },
  saveApiKeyBtn: null,
  clearApiKeyBtn: null,
  exportQuizzesBtn: null,
  importQuizzesInput: null,
  clearAllQuizzesBtn: null,
  toggleApiKeyVisibilityBtn: null,
  apiKeyVisibilityIcon: null,
}));

vi.mock('./utils.js', () => ({
  shuffleArray: vi.fn(),
  validateQuizData: vi.fn(),
  sanitizeInput: vi.fn(),
  showError: vi.fn(),
  clearError: vi.fn(),
  getFeedbackClasses: vi.fn(),
  showSuccess: vi.fn(),
  showInfo: vi.fn(),
}));

// Create test instance
const geminiService = new GeminiService();

describe('GeminiService Utility Methods', () => {
  beforeEach(() => {
    // Mocks are automatically reset by vi.mock, no need to clear manually
  });

  describe('_sanitizePrompt', () => {
    it('should escape HTML entities', () => {
      const input = 'Hello & welcome <script>alert("XSS")</script>';
      const expected = 'Hello & welcome <script>alert("XSS")<&#x2F;script>';
      expect(geminiService._sanitizePrompt(input)).toBe(expected);
    });

    it('should remove control characters except line breaks and tabs', () => {
      const input = 'Normal text\u0000\u0001\u0002with control chars\u000B\u000C';
      const expected = 'Normal textwith control chars';
      expect(geminiService._sanitizePrompt(input)).toBe(expected);
    });

    it('should handle empty string', () => {
      expect(geminiService._sanitizePrompt('')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(geminiService._sanitizePrompt(null)).toBe('');
      expect(geminiService._sanitizePrompt(undefined)).toBe('');
    });

    it('should preserve line breaks and tabs', () => {
      const input = 'Line1\nLine2\tTabbed';
      const expected = 'Line1\nLine2\tTabbed';
      expect(geminiService._sanitizePrompt(input)).toBe(expected);
    });

    it('should handle quotes and slashes', () => {
      const input = 'Quotes: " \' /';
      const expected = 'Quotes: " &#x27; &#x2F;';
      expect(geminiService._sanitizePrompt(input)).toBe(expected);
    });
  });

  describe('_mapApiError', () => {
    it('should map INVALID_INPUT errors', () => {
      const error = { code: 'INVALID_INPUT', message: 'Invalid file format' };
      const result = geminiService._mapApiError(error);
      expect(result.type).toBe('INVALID_INPUT');
      expect(result.message).toBe('Invalid file format'); // Preserves original message
    });

    it('should map API key errors', () => {
      const error = { code: 'INVALID_ARGUMENT', message: 'API key not valid' };
      const result = geminiService._mapApiError(error);
      expect(result.type).toBe('INVALID_KEY');
      expect(result.message).toContain('Your API key is invalid');
    });

    it('should map quota limit errors', () => {
      const error = { code: 'RESOURCE_EXHAUSTED', message: 'Quota exceeded' };
      const result = geminiService._mapApiError(error);
      expect(result.type).toBe('QUOTA_LIMIT');
      expect(result.message).toContain('You have exceeded your API quota');
    });

    it('should map network errors', () => {
      const error = { status: 0, message: 'Network error' };
      const result = geminiService._mapApiError(error);
      expect(result.type).toBe('NETWORK_ERROR');
      expect(result.message).toContain('Network error');
    });

    it('should map generic errors', () => {
      const error = new Error('Something went wrong');
      const result = geminiService._mapApiError(error);
      expect(result.type).toBe('UNKNOWN');
      expect(result.message).toBe('Something went wrong');
    });

    it('should handle errors without code or status', () => {
      const error = new Error('Generic error');
      const result = geminiService._mapApiError(error);
      expect(result.type).toBe('UNKNOWN');
      expect(result.message).toBe('Generic error');
    });
  });

  describe('validateKeyFormat', () => {
    it('should validate correct Gemini API keys', () => {
      const validKey = 'AIza123456789012345678901234567890123456';
      expect(GeminiService.validateKeyFormat(validKey)).toBe(true);
    });

    it('should reject keys without AIza prefix', () => {
      const invalidKey = 'XYZa123456789012345678901234567890123456';
      expect(GeminiService.validateKeyFormat(invalidKey)).toBe(false);
    });

    it('should reject keys shorter than 30 characters', () => {
      const shortKey = 'AIza123';
      expect(GeminiService.validateKeyFormat(shortKey)).toBe(false);
    });

    it('should reject non-string inputs', () => {
      expect(GeminiService.validateKeyFormat(null)).toBe(false);
      expect(GeminiService.validateKeyFormat(undefined)).toBe(false);
      expect(GeminiService.validateKeyFormat(12345)).toBe(false);
    });

    it('should reject empty strings', () => {
      expect(GeminiService.validateKeyFormat('')).toBe(false);
    });
  });
});