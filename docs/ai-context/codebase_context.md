# Kwek Kwek Quiz - Comprehensive Codebase Summary

## Overview

Kwek Kwek Quiz is a modern, feature-rich quiz application built with Material Design 3 principles. It supports creating, sharing, and taking interactive quizzes with multiple question types, AI-powered quiz generation, and peer-to-peer sharing capabilities.

## Architecture & Technology Stack

### Frontend Framework

- __Vite__ as build tool and development server
- __Tailwind CSS v4__ with custom Material Design 3 color tokens
- __TypeScript__ (ES modules) for type safety
- __Material Symbols__ for iconography

### Key Dependencies

- __@google/generative-ai__: AI quiz generation via Gemini API
- __marked + highlight.js + katex__: Markdown rendering with code highlighting and LaTeX support
- __js-yaml__: YAML to JSON conversion
- __dompurify__: HTML sanitization
- __peerjs__: Peer-to-peer quiz sharing

## Project Structure

```javascript
KwekKwekQuiz/
├── index.html (main entry point with SEO optimization)
├── js/
│   ├── index.js (DOM component loader)
│   ├── main.js (app initialization)
│   └── modules/ (organized by functionality)
├── styles/
│   ├── main.css (CSS imports and global styles)
│   └── base/ (design system variables)
├── data/ (sample quiz data)
├── public/ (HTML components)
└── img/ (assets)
```

## Core Functionality

### 1. Quiz Engine (`quizEngine.js`)

- __Question Types__: Multiple-choice, true/false, fill-in-the-blank, identification
- __State Management__: Tracks current question, score, user answers
- __Navigation__: Prev/Next question with auto-submit for MC/TF
- __Scoring__: Case-insensitive comparison for text answers

### 2. Storage Management (`storageManager.js`)

- __Local Storage__: Save/load quizzes with names
- __Data Export/Import__: JSON file operations
- __Bulk Management__: Clear all quizzes, conflict resolution

### 3. AI Integration (`geminiService.js`)

- __Gemini API__: Text and image-based quiz generation
- __Prompt Engineering__: Configurable prompt system with caching
- __Error Handling__: Comprehensive API error management
- __UI Integration__: Loading states and feedback

### 4. P2P Sharing (`p2pShare.js`)

- __PeerJS Integration__: Real-time quiz sharing
- __Connection Management__: Incoming/outgoing connections
- __Data Validation__: Secure quiz data transfer
- __Status Tracking__: Connection state indicators

### 5. User Interface (`uiController.js`, `quizPlayer.js`)

- __Material Design 3__: Consistent theming and components
- __Responsive Design__: Mobile-first approach
- __Progress Tracking__: Visual progress indicators
- __Feedback System__: Success/error states with animations

## Key Features

### Quiz Creation & Management

- JSON/YAML input support
- Sample quiz loading
- Auto-formatting and validation
- Quiz naming and organization

### AI-Powered Generation

- Text prompt-based quiz creation
- Image-based quiz generation
- Configurable prompt engineering
- Real-time generation feedback

### Sharing & Collaboration

- Peer-to-peer quiz transfer
- QR code-style connection codes
- Download/upload functionality
- Real-time status updates

### User Experience

- Dark mode support
- Animation controls
- Keyboard shortcuts
- Toast notifications
- Searchable documentation

## Design System

### Material Design 3 Implementation

- Custom color tokens for light/dark themes
- Typography scale following MD3 standards
- Motion design with easing functions
- Component-based architecture

### Component Organization

- __Buttons__: Filled, outlined, tonal variants
- __Text Fields__: Input validation and feedback
- __Cards__: Question and result displays
- __Progress__: Visual progress indicators
- __Modals__: P2P sharing interfaces

## Development Features

### Build Configuration

- Vite with PostCSS for CSS processing
- GitHub Pages deployment setup
- Development and production builds
- Hot module replacement

### Testing

- Playwright for E2E testing
- Component testing setup
- Test results tracking

### Documentation

- Built-in docs section with search
- FAQ and troubleshooting
- Progress tracking for long documents
- Copy-to-clipboard functionality

## Code Quality & Best Practices

### Modular Architecture

- Single responsibility principle
- Clear separation of concerns
- Dependency injection patterns
- Event-driven communication

### Error Handling

- Comprehensive try/catch blocks
- User-friendly error messages
- Fallback mechanisms
- Logging for debugging

### Performance Optimization

- Lazy loading of components
- Efficient DOM manipulation
- Debounced input handling
- Optimized rendering

## Security Considerations

### Input Validation

- JSON/YAML schema validation
- XSS prevention with DOMPurify
- API key management
- File type validation

### Data Protection

- Local storage encryption
- Secure API communication
- Peer connection validation
- Error message sanitization

## Deployment & Distribution

### Build Process

- Optimized production builds
- Asset fingerprinting
- Service worker for PWA capabilities
- Progressive enhancement

### Hosting

- GitHub Pages deployment
- Custom domain support
- SEO optimization
- Social media meta tags
