# HeyDoc/Med Writer - Architecture Overview

## **Executive Summary**

HeyDoc (Med Writer) is a sophisticated AI-powered web application designed to help patients communicate effectively with healthcare providers. The application leverages modern web technologies and artificial intelligence to provide grammar checking, medical information analysis, and professional medical summary generation.

## **Core Architecture**

### **Technology Stack**

#### **Frontend Technologies**
- **Next.js 15**: Modern React framework with App Router
- **TypeScript**: Full type safety across the application
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Modern component library (40+ components)
- **Framer Motion**: Animation and interaction library
- **React Hook Form**: Form handling and validation

#### **Backend Technologies**
- **Next.js Server Actions**: Server-side function execution
- **Node.js**: JavaScript runtime environment
- **PostgreSQL**: Primary database
- **Drizzle ORM**: Type-safe database operations
- **Supabase**: Database hosting and backend services

#### **AI & Processing**
- **OpenAI GPT-4o-mini**: Language model for AI features
- **Custom Caching System**: Performance optimization
- **Medical Prompts**: Specialized AI prompts for medical context
- **Text Processing**: Advanced text analysis and position tracking

#### **Authentication & Security**
- **Clerk**: Complete authentication solution
- **Next.js Middleware**: Route protection and session management
- **Environment Variables**: Secure configuration management

#### **External Integrations**
- **Stripe**: Payment processing and subscription management
- **PostHog**: Analytics and user behavior tracking
- **Vercel**: Deployment and hosting platform

---

## **System Architecture Layers**

### **1. Presentation Layer (Frontend)**

**Components:**
- **React Components**: Modular, reusable UI components
- **Three-Panel Layout**: Document list, editor, suggestions sidebar
- **ContentEditable Editor**: Rich text editing with real-time processing
- **Error Highlighting**: Visual feedback for grammar and medical suggestions
- **Responsive Design**: Mobile-first approach with Tailwind CSS

**Key Features:**
- Real-time grammar checking visualization
- Medical information completeness indicators
- Professional document editor interface
- Accessibility-compliant components

### **2. API Layer (Backend Services)**

**API Routes:**
- `/api/grammar-check` - Grammar checking endpoint
- `/api/medical-summary` - Medical summary generation
- `/api/stripe/webhooks` - Payment webhook handling
- `/api/test-grammar-check` - Testing endpoint (bypasses auth)

**Server Actions:**
- Grammar checking and medical analysis
- Document CRUD operations
- User profile management
- Subscription status management

### **3. AI Processing Layer**

**Core AI Features:**
1. **Grammar Checking**:
   - Medical terminology awareness
   - Position-accurate error detection
   - Context-sensitive suggestions
   - Chunked processing for performance

2. **Medical Analysis**:
   - Information completeness checking
   - Medical field validation (symptoms, duration, medication, etc.)
   - Structured analysis reporting

3. **Summary Generation**:
   - Professional medical summaries for doctors
   - Patient-to-doctor communication optimization
   - Contextual medical information extraction

**Optimization Features:**
- Smart caching system for repeated requests
- Chunked text processing for large documents
- Performance monitoring and metrics
- Error handling and fallback systems

### **4. Data Layer**

**Database Schema:**
```sql
-- User profiles with subscription status
profiles {
  userId: text (primary key)
  membership: enum (free, pro)
  stripeCustomerId: text
  stripeSubscriptionId: text
  createdAt: timestamp
  updatedAt: timestamp
}

-- Medical documents
documents {
  id: uuid (primary key)
  userId: text
  title: text
  content: text
  medicalSummary: text (AI-generated)
  createdAt: timestamp
  updatedAt: timestamp
}

-- Example todos (extensible pattern)
todos {
  id: uuid (primary key)
  userId: text
  content: text
  completed: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

---

## **Key Architectural Patterns**

### **1. Server-First Architecture**
- Heavy use of Next.js Server Actions for backend logic
- Reduced client-side JavaScript bundle
- Improved initial page load performance
- Better SEO and user experience

### **2. Type-Safe Development**
- Full TypeScript implementation
- Drizzle ORM for type-safe database operations
- ActionState pattern for consistent error handling
- Interface definitions for all data structures

### **3. Component-Based Design**
- Modular React components
- Reusable UI component library
- Separation of concerns
- Easy maintenance and testing

### **4. Smart Caching Strategy**
- AI response caching for performance
- Grammar check result caching
- Reduced API calls and costs
- Improved user experience

### **5. Progressive Enhancement**
- Works without JavaScript
- Enhanced with client-side interactions
- Graceful degradation
- Accessibility-first approach

---

## **Security & Authentication**

### **Authentication Flow**
1. User authentication handled by Clerk
2. Middleware protects routes requiring authentication
3. Server Actions validate user sessions
4. API routes check authentication status

### **Data Protection**
- Environment variables for sensitive data
- Secure database connections
- Input validation and sanitization
- CORS and security headers

### **Subscription Management**
- Stripe integration for payments
- Webhook handling for subscription changes
- Automatic profile updates based on subscription status
- Free and Pro tier feature differentiation

---

## **Performance Optimizations**

### **Frontend Optimizations**
- Next.js App Router for optimal loading
- Image optimization with Next.js Image component
- Code splitting and lazy loading
- Tailwind CSS purging for smaller bundles

### **Backend Optimizations**
- Smart caching for AI responses
- Chunked text processing
- Database query optimization
- Connection pooling

### **AI Processing Optimizations**
- Request batching and chunking
- Response caching
- Error handling and retries
- Performance monitoring

---

## **Deployment & Infrastructure**

### **Hosting**
- **Frontend**: Vercel (Next.js optimization)
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage (if needed)
- **Analytics**: PostHog cloud

### **Environment Configuration**
- Development: Local PostgreSQL + OpenAI API
- Production: Supabase + Vercel + Stripe webhooks
- Environment variable management
- Secure secret handling

---

## **Development Workflow**

### **Code Organization**
```
grammarlyV2/
├── actions/           # Server actions
│   ├── ai/           # AI-related actions
│   ├── db/           # Database operations
│   └── cache/        # Caching operations
├── app/              # Next.js app router
│   ├── (auth)/       # Authentication pages
│   ├── api/          # API routes
│   ├── documents/    # Document editor
├── components/       # React components
│   ├── ui/           # shadcn/ui components
│   ├── editor/       # Editor-specific components
│   └── utilities/    # Utility components
├── db/               # Database configuration
│   └── schema/       # Database schemas
├── lib/              # Utility libraries
├── types/            # TypeScript type definitions
└── hooks/            # Custom React hooks
```

### **Development Commands**
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run db:generate` - Generate database migrations
- `npm run test:grammar` - Test grammar checking functionality

---

## **Future Scalability**

### **Horizontal Scaling**
- Serverless architecture ready for scaling
- Database connection pooling
- CDN for static assets
- API rate limiting and caching

### **Feature Extensibility**
- Modular component architecture
- Plugin-based AI processing
- Extensible database schema
- Configurable business logic

### **Monitoring & Maintenance**
- PostHog analytics for user behavior
- Error tracking and logging
- Performance monitoring
- Automated testing pipeline

---

## **Key Benefits**

1. **Medical Expertise**: AI trained specifically for patient-doctor communication
2. **Real-time Feedback**: Instant grammar and medical information suggestions
3. **Professional Output**: AI-generated summaries for healthcare providers
4. **User-Friendly**: Intuitive interface designed for non-technical users
5. **Scalable Architecture**: Built to handle growing user base and feature set
6. **Type Safety**: Comprehensive TypeScript implementation reduces bugs
7. **Modern Stack**: Latest web technologies for optimal performance

This architecture provides a solid foundation for a sophisticated medical writing assistant while maintaining flexibility for future enhancements and scaling. 