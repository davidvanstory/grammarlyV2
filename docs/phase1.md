# Med Writer - AI-Powered Writing Assistant for Medical Students
## Unified Product Requirements Document

### Project Description
A web-based AI-powered writing assistant specifically designed for medical students, featuring real-time grammar and spell checking with medical terminology awareness, readability scoring, and document management. The application uses a sophisticated contentEditable-based text editor with precise auto-correction capabilities and mathematical position tracking for error highlighting and correction.

### Target Audience
Medical students, healthcare professionals, medical educators, and anyone writing medical content who needs AI-powered grammar assistance with medical terminology awareness.

---

## Core Features & Technical Architecture

### Advanced Text Processing Engine
- [ ] **Real-time AI-powered grammar checking using OpenAI GPT-4o**
    - [ ] Sub-2 second response time with 300ms debounce optimization
    - [ ] JSON-formatted error responses with precise character positions
    - [ ] Medical terminology awareness to avoid flagging legitimate medical terms
    - [ ] Support for spelling, grammar, and style corrections
    - [ ] Enhanced prompting for accurate position detection in medical text

- [ ] **Rich contentEditable text editor**
    - [ ] Extract plain text while maintaining DOM position mapping
    - [ ] Send plain text to AI to avoid HTML parsing confusion
    - [ ] Apply highlights as HTML spans with CSS classes
    - [ ] Preserve cursor position during all operations
    - [ ] Professional medical-themed interface design

### Intelligent Position Management & Auto-Corrections
- [ ] **Immutable error tracking system**
    - [ ] Track original and current positions for each error
    - [ ] Unique error IDs for comprehensive state management
    - [ ] Status tracking (pending, applied, dismissed)
    - [ ] Handle complex medical terminology and abbreviations

- [ ] **One-click correction acceptance**
    - [ ] Direct DOM text replacement at precise character positions
    - [ ] Mathematical position updates for all remaining errors
    - [ ] Cursor position preservation after corrections
    - [ ] Immediate removal of applied error highlights
    - [ ] Smooth animations for correction acceptance

- [ ] **Intelligent position recalculation**
    - [ ] Update all subsequent error positions after each correction
    - [ ] Handle length differences between original and corrected text
    - [ ] Periodic full re-check every 10 corrections or 2 minutes
    - [ ] Maintain accuracy with medical abbreviations and terminology

### Multi-Layered Error Highlighting & User Experience
- [ ] **Advanced error highlighting system**
    - [ ] DOM-based position mapping for pixel-perfect error placement
    - [ ] Validation system to ensure AI positions match actual text
    - [ ] Handle complex medical text with abbreviations and special characters
    - [ ] Color-coded system: Red (spelling), Blue (grammar), Orange (style)

- [ ] **Interactive error correction interface**
    - [ ] Click/hover to view error details and medical context
    - [ ] Accept/dismiss individual suggestions with smooth animations
    - [ ] Visual feedback for applied corrections
    - [ ] Error type indicators with medical terminology explanations
    - [ ] Multiple suggestion options when available

### Performance & Reliability
- [ ] **Smart caching and re-checking logic**
    - [ ] Cache results for unchanged text segments
    - [ ] Incremental re-checking (avoid re-processing applied corrections)
    - [ ] Detect substantial changes vs. minor medical term corrections
    - [ ] Medical terminology dictionary caching

- [ ] **Optimized processing for medical documents**
    - [ ] Chunked processing for long documents (500-word segments)
    - [ ] Fallback offline spell checking using browser APIs
    - [ ] Comprehensive error handling for API failures
    - [ ] Custom undo/redo stack for text and error state tracking

### Medical-Specific Features
- [ ] **Flesch Reading-Ease Score Calculator**
    - [ ] Real-time readability scoring as user types
    - [ ] Color-coded score display (easy, moderate, difficult)
    - [ ] Score interpretation with medical writing guidelines
    - [ ] Debounced calculations for performance

- [ ] **Medical terminology awareness**
    - [ ] AI prompting specifically tuned for medical vocabulary
    - [ ] Avoid flagging legitimate medical terms as errors
    - [ ] Context-aware suggestions for medical abbreviations
    - [ ] Support for Latin medical terminology

### Document Management & User Interface
- [ ] **Three-panel responsive layout**
    - [ ] Left sidebar: Document list with inline editing
    - [ ] Center panel: Rich text editor with title editing
    - [ ] Right sidebar: Grammar suggestions and readability score
    - [ ] Collapsible panels with smooth animations

- [ ] **Document CRUD operations**
    - [ ] Create, read, update, delete documents
    - [ ] Auto-save every 30 seconds with visual indicators
    - [ ] Manual save functionality
    - [ ] Document name editing with inline controls

- [ ] **User authentication and data persistence**
    - [ ] Clerk authentication integration
    - [ ] Supabase database for document storage
    - [ ] User-specific document management
    - [ ] Session management and secure access

---

## Technical Implementation Phases

### Phase 1: Foundation & Core Infrastructure
**Dependencies:** None - foundational setup
- [ ] Next.js + TypeScript + Tailwind CSS project setup
- [ ] Supabase database configuration and schema creation
- [ ] Clerk authentication integration
- [ ] OpenAI API integration setup
- [ ] Vercel deployment pipeline configuration

### Phase 2: Basic Document Management
**Dependencies:** Phase 1 complete
- [ ] Document data model and TypeScript interfaces
- [ ] CRUD API routes for document operations
- [ ] User authentication flow and protected routes
- [ ] Basic database operations testing

### Phase 3: Core User Interface
**Dependencies:** Phase 2 complete
- [ ] Three-panel responsive layout implementation
- [ ] Document list sidebar with create/edit/delete functionality
- [ ] Basic contentEditable text editor setup. 
- [ ] Right sidebar structure for future grammar suggestions
- [ ] Professional medical-themed styling

### Phase 4: Advanced Text Editor & Position Tracking
**Dependencies:** Phase 3 complete
- [ ] ContentEditable to plain text extraction with position mapping
- [ ] DOM position tracking system implementation
- [ ] Text change detection and cursor position preservation
- [ ] Mathematical position calculation system
- [ ] Error highlighting HTML span system

### Phase 5: AI Grammar Checking Integration
**Dependencies:** Phase 4 complete
- [ ] OpenAI API integration with medical-aware prompting
- [ ] Error detection and JSON response parsing
- [ ] Position validation system (AI positions vs. DOM positions)
- [ ] Debounced grammar checking (300ms delay)
- [ ] Medical terminology handling in AI prompts

### Phase 6: Error Highlighting & Correction System
**Dependencies:** Phase 5 complete
- [ ] Multi-layered error highlighting in DOM
- [ ] Interactive error tooltips and popovers
- [ ] One-click correction acceptance functionality
- [ ] Error state management (pending/applied/dismissed)
- [ ] Position recalculation after corrections

### Phase 7: Readability & Medical Features
**Dependencies:** Phase 6 complete
- [ ] Flesch reading-ease calculator implementation
- [ ] Real-time readability score display
- [ ] Medical terminology dictionary integration
- [ ] Context-aware medical writing suggestions
- [ ] Score interpretation and guidance

### Phase 8: Performance & State Management
**Dependencies:** Phase 7 complete
- [ ] Intelligent caching for text segments and error results
- [ ] Global state management for documents and suggestions
- [ ] Performance optimization with React.memo and useMemo
- [ ] Custom undo/redo system for text and error states
- [ ] Comprehensive error handling and recovery

### Phase 9: Polish & Quality Assurance
**Dependencies:** Phase 8 complete
- [ ] Loading states and visual feedback systems
- [ ] Keyboard shortcuts and accessibility features
- [ ] Cross-browser compatibility testing
- [ ] End-to-end user workflow testing
- [ ] Performance testing with large medical documents

---

## Design Requirements

### Visual Design
- [ ] **Clean, distraction-free writing interface**
    - [ ] Professional medical color scheme (blues, whites, subtle grays)
    - [ ] Typography optimized for long-form medical writing
    - [ ] Minimal visual clutter to maintain focus on content
    - [ ] Subtle visual indicators for different error types

- [ ] **Color-coded error system**
    - [ ] Red underlines/backgrounds for spelling errors
    - [ ] Blue underlines/backgrounds for grammar issues
    - [ ] Orange underlines/backgrounds for style suggestions
    - [ ] Distinct highlighting that doesn't interfere with readability

- [ ] **Interactive correction interface**
    - [ ] Error explanation tooltips with medical context
    - [ ] Accept/dismiss buttons with clear visual hierarchy
    - [ ] Smooth animations for error corrections and UI updates
    - [ ] Loading indicators for AI processing

### User Experience
- [ ] **Responsive three-panel layout**
    - [ ] Collapsible sidebars for focused writing
    - [ ] Adaptive layout for different screen sizes
    - [ ] Smooth transitions between panel states
    - [ ] Intuitive document navigation

- [ ] **Readability feedback**
    - [ ] Prominent readability score display above editor
    - [ ] Real-time updates with color coding
    - [ ] Contextual explanations for medical writing standards
    - [ ] Visual progress indicators

---

## Technical Stack
- **Frontend:** Next.js 14+ with TypeScript
- **Styling:** Tailwind CSS for responsive design
- **Authentication:** Clerk for user management
- **Database:** Supabase for document storage
- **AI Integration:** OpenAI GPT-4o API for grammar checking
- **Deployment:** Vercel with automatic CI/CD
- **State Management:** React Context + useState/useReducer

---

## Critical Technical Challenges

⚠️ **Position Mapping Accuracy:** Ensuring AI character positions exactly match DOM text positions, especially with medical abbreviations and special formatting

⚠️ **Medical Terminology Handling:** AI must recognize legitimate medical terms and avoid flagging them as errors while still catching actual mistakes

⚠️ **State Synchronization:** Keeping error states, DOM highlights, and suggestions panel in perfect sync during dynamic corrections

⚠️ **Performance with Long Documents:** Mathematical position updates vs. full DOM re-parsing for lengthy medical documents

⚠️ **Cursor Position Management:** Maintaining user cursor position during dynamic DOM changes and text corrections

⚠️ **Medical Context Awareness:** Providing contextually appropriate suggestions that understand medical writing conventions

---

## Success Metrics
- **Response Time:** Sub-2 second grammar checking with 300ms debounce
- **Accuracy:** 95%+ position mapping accuracy for error highlighting
- **Medical Terminology:** Zero false positives on legitimate medical terms
- **User Experience:** Smooth, responsive interface with no jarring corrections
- **Performance:** Handle documents up to 5000+ words without performance degradation

---

## Implementation Notes
This unified approach leverages the sophisticated contentEditable and mathematical position tracking system from the Grammar Checker PRD while maintaining the medical-specific focus and three-panel layout from the Med Writer PRD. The result is a robust, performant grammar checking system specifically tailored for medical writing with precise auto-correction capabilities and medical terminology awareness.