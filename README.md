# TasteSphere - AI-Powered Recommendation System

TasteSphere is a modern, AI-powered recommendation system that provides personalized suggestions for movies, TV shows, books, music, podcasts, places, people, brands, and destinations. Built with React, it features a chat-based interface powered by Google's Gemini AI and Qloo's recommendation API.

## 🔄 System Architecture & Workflow

### Detailed System Flow Diagram

```mermaid
graph TB
    %% User Interface Layer
    subgraph "Frontend - React Application"
        UI[User Interface]
        Chat[Chat Interface]
        Input[Input Box]
        Messages[Message Bubbles]
        Filters[Filter Chips]
        Grid[Recommendation Grid]
        Cards[Recommendation Cards]
    end

    %% State Management Layer
    subgraph "State Management"
        AppState[App State Context]
        ThemeState[Theme Context]
        ApiState[API Context]
        LocalStorage[Local Storage]
    end

    %% Service Layer
    subgraph "Services Layer"
        ChatService[Chat Service]
        QlooService[Qloo Service]
        GeminiService[Gemini Service]
        NetworkService[Network Service]
        ErrorService[Error Service]
    end

    %% External APIs
    subgraph "External APIs"
        GeminiAPI[Google Gemini AI API]
        QlooAPI[Qloo Recommendation API]
    end

    %% Data Processing
    subgraph "Data Processing"
        EntityExtraction[Entity Extraction]
        ResponseParsing[Response Parsing]
        DataTransformation[Data Transformation]
        FilterLogic[Filter Logic]
    end

    %% User Flow
    User((User)) --> UI
    UI --> Chat
    Chat --> Input
    Input --> |User types message| ChatService
    
    %% Chat Processing Flow
    ChatService --> |Analyze user input| GeminiService
    GeminiService --> |API Request| GeminiAPI
    GeminiAPI --> |AI Analysis Response| GeminiService
    GeminiService --> |Extracted entities| EntityExtraction
    EntityExtraction --> |Entity types & names| QlooService
    
    %% Recommendation Flow
    QlooService --> |Recommendation request| QlooAPI
    QlooAPI --> |Raw recommendations| QlooService
    QlooService --> |Parsed data| ResponseParsing
    ResponseParsing --> |Structured data| DataTransformation
    DataTransformation --> |Formatted recommendations| AppState
    
    %% UI Update Flow
    AppState --> |State change| Chat
    Chat --> Messages
    AppState --> |Recommendations| Grid
    Grid --> Cards
    AppState --> |Available types| Filters
    
    %% Filter Flow
    Filters --> |Filter toggle| FilterLogic
    FilterLogic --> |Updated filters| AppState
    AppState --> |Filtered data| Grid
    
    %% Error Handling
    NetworkService --> |Network errors| ErrorService
    ErrorService --> |Error state| AppState
    AppState --> |Error display| UI
    
    %% Persistence
    AppState --> |Save state| LocalStorage
    LocalStorage --> |Restore state| AppState
    ThemeState --> |Theme preference| LocalStorage
    
    %% Styling
    classDef userLayer fill:#e1f5fe
    classDef stateLayer fill:#f3e5f5
    classDef serviceLayer fill:#e8f5e8
    classDef apiLayer fill:#fff3e0
    classDef dataLayer fill:#fce4ec
    
    class UI,Chat,Input,Messages,Filters,Grid,Cards userLayer
    class AppState,ThemeState,ApiState,LocalStorage stateLayer
    class ChatService,QlooService,GeminiService,NetworkService,ErrorService serviceLayer
    class GeminiAPI,QlooAPI apiLayer
    class EntityExtraction,ResponseParsing,DataTransformation,FilterLogic dataLayer
```

### Detailed Component Interaction Flow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Chat Interface
    participant CS as Chat Service
    participant GS as Gemini Service
    participant QS as Qloo Service
    participant AS as App State
    participant RC as Recommendation Components

    Note over U,RC: User Search Flow
    U->>UI: Types: "I love sci-fi movies"
    UI->>CS: processUserMessage()
    CS->>AS: setProcessing(true)
    AS->>UI: Show loading state
    
    Note over CS,GS: AI Analysis Phase
    CS->>GS: analyzeUserInput(message)
    GS->>GS: Build prompt with context
    GS-->>GS: Call Gemini API
    GS->>CS: Return extracted entities
    
    Note over CS,QS: Recommendation Fetching
    CS->>QS: getRecommendations(entities)
    QS->>QS: Group entities by type
    QS->>QS: Build API requests
    QS-->>QS: Call Qloo API (parallel)
    QS->>QS: Parse & transform responses
    QS->>CS: Return recommendations
    
    Note over CS,AS: State Updates
    CS->>AS: setRecommendations(data)
    CS->>AS: setProcessing(false)
    AS->>AS: Initialize filters
    AS->>UI: Trigger re-render
    
    Note over UI,RC: UI Updates
    UI->>RC: Render recommendations
    RC->>RC: Display filter chips
    RC->>RC: Show recommendation cards
    
    Note over U,RC: Filter Interaction
    U->>RC: Clicks filter chip
    RC->>AS: toggleFilter(type)
    AS->>AS: Update activeFilters
    AS->>RC: Re-render filtered results
```

### Data Flow Architecture

```mermaid
flowchart LR
    subgraph "Input Processing"
        A[User Input] --> B[Input Validation]
        B --> C[Message Creation]
        C --> D[State Update]
    end
    
    subgraph "AI Analysis"
        D --> E[Gemini API Call]
        E --> F[Response Processing]
        F --> G[Entity Extraction]
        G --> H[Entity Validation]
    end
    
    subgraph "Recommendation Engine"
        H --> I[Entity Grouping]
        I --> J[API Request Building]
        J --> K[Qloo API Calls]
        K --> L[Response Aggregation]
        L --> M[Data Transformation]
    end
    
    subgraph "UI Rendering"
        M --> N[State Management]
        N --> O[Filter Initialization]
        O --> P[Component Updates]
        P --> Q[User Interface]
    end
    
    subgraph "User Interaction"
        Q --> R[Filter Controls]
        R --> S[Filter Logic]
        S --> T[Filtered Results]
        T --> Q
    end
```

### Error Handling Flow

```mermaid
graph TD
    A[User Action] --> B{Network Available?}
    B -->|No| C[Offline Mode]
    B -->|Yes| D[API Request]
    
    D --> E{API Response OK?}
    E -->|No| F[Error Boundary]
    E -->|Yes| G[Process Response]
    
    F --> H{Error Type?}
    H -->|Network| I[Network Error UI]
    H -->|API| J[API Error UI]
    H -->|Component| K[Component Error UI]
    
    G --> L{Data Valid?}
    L -->|No| M[Data Error Handling]
    L -->|Yes| N[Update UI]
    
    I --> O[Retry Option]
    J --> O
    K --> O
    M --> O
    
    O --> P[User Retry]
    P --> A
    
    C --> Q[Cached Data]
    Q --> N
```

## 🌟 Features

### Core Functionality
- **AI-Powered Chat Interface**: Natural language interaction using Google Gemini AI
- **Multi-Category Recommendations**: Movies, TV shows, books, music, podcasts, places, people, brands, and destinations
- **Real-Time Filtering**: Interactive filter chips to refine recommendations by category
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark Mode Support**: Toggle between light and dark themes

### User Experience
- **Colorful Placeholder Images**: Type-specific placeholder images with distinct colors
- **Smooth Animations**: Framer Motion animations for enhanced user experience
- **Loading States**: Skeleton components and loading indicators
- **Error Handling**: Comprehensive error boundaries and user-friendly error messages
- **Accessibility**: Full WCAG compliance with screen reader support

### Technical Features
- **API Integration**: Seamless integration with Qloo recommendation API
- **State Management**: Context-based state management with React hooks
- **Performance Optimization**: Memoization, lazy loading, and efficient re-renders
- **Testing Suite**: Comprehensive test coverage with Vitest and React Testing Library
- **TypeScript Support**: Full TypeScript integration for type safety

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Darkcoder011/TasteSpheree.git
   cd TasteSpheree
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_QLOO_API_KEY=your_qloo_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🛠️ API Configuration

### Google Gemini AI
- Sign up at [Google AI Studio](https://makersuite.google.com/)
- Generate an API key
- Add it to your `.env` file as `VITE_GEMINI_API_KEY`

### Qloo Recommendation API
- Contact Qloo for API access
- Add your API key to `.env` file as `VITE_QLOO_API_KEY`

## 📱 Usage

1. **Start a Conversation**: Type your interests in the chat input
   - Example: "I love sci-fi movies and indie music"

2. **View Recommendations**: The system will analyze your input and provide personalized recommendations

3. **Filter Results**: Use the filter chips to show/hide specific categories

4. **Explore Details**: Each recommendation card shows:
   - Name and type
   - Confidence score
   - Description (when available)
   - Genre and additional metadata

## 🏗️ Detailed Project Architecture

### Component Hierarchy

```mermaid
graph TD
    App[App.jsx] --> ThemeProvider[Theme Provider]
    App --> ApiProvider[API Provider]
    App --> AppStateProvider[App State Provider]
    
    AppStateProvider --> ChatInterface[Chat Interface]
    ChatInterface --> MessageBubble[Message Bubble]
    ChatInterface --> InputBox[Input Box]
    ChatInterface --> FilteredRecommendationView[Filtered Recommendation View]
    
    FilteredRecommendationView --> FilterChips[Filter Chips]
    FilteredRecommendationView --> RecommendationGrid[Recommendation Grid]
    
    RecommendationGrid --> RecommendationCard[Recommendation Card]
    RecommendationCard --> LazyImage[Lazy Image]
    
    ChatInterface --> ControlButtons[Control Buttons]
    ChatInterface --> ScreenReader[Screen Reader]
    
    App --> ErrorBoundary[Error Boundary]
    ErrorBoundary --> ChatErrorBoundary[Chat Error Boundary]
    ErrorBoundary --> RecommendationErrorBoundary[Recommendation Error Boundary]
    ErrorBoundary --> ApiErrorBoundary[API Error Boundary]
    
    App --> NetworkStatus[Network Status]
    App --> OfflineMode[Offline Mode]
    App --> DebugPanel[Debug Panel]
```

### Service Architecture

```mermaid
graph LR
    subgraph "Core Services"
        CS[Chat Service]
        QS[Qloo Service]
        GS[Gemini Service]
        NS[Network Service]
        ES[Error Service]
        RS[Recommendation Service]
    end
    
    subgraph "Utility Services"
        DU[Data Utils]
        PU[Performance Utils]
        AU[Accessibility Utils]
    end
    
    subgraph "State Management"
        ASC[App State Context]
        TC[Theme Context]
        AC[API Context]
    end
    
    CS --> GS
    CS --> QS
    CS --> ASC
    
    QS --> NS
    GS --> NS
    
    NS --> ES
    QS --> ES
    GS --> ES
    
    RS --> QS
    RS --> DU
    
    ASC --> TC
    ASC --> AC
```

### Data Models & Types

```mermaid
classDiagram
    class Recommendation {
        +string id
        +string name
        +string type
        +number score
        +RecommendationMetadata metadata
        +string source
        +string timestamp
    }
    
    class RecommendationMetadata {
        +string description
        +string imageUrl
        +string externalUrl
        +string category
        +string[] tags
        +string genre
        +number year
        +number rating
    }
    
    class Message {
        +string id
        +string content
        +MessageType type
        +string timestamp
        +MessageStatus status
        +Recommendation[] recommendations
    }
    
    class AppState {
        +Message[] messages
        +Recommendation[] recommendations
        +FilterState activeFilters
        +boolean isLoading
        +boolean isProcessing
        +Error error
        +AnalysisResult lastAnalysis
    }
    
    class FilterState {
        +boolean movie
        +boolean tv_show
        +boolean book
        +boolean artist
        +boolean podcast
        +boolean place
        +boolean person
        +boolean brand
        +boolean destination
    }
    
    class AnalysisResult {
        +ExtractedEntity[] entities
        +string intent
        +number confidence
        +string[] keywords
    }
    
    class ExtractedEntity {
        +string name
        +string type
        +number confidence
        +string context
    }
    
    Recommendation --> RecommendationMetadata
    Message --> Recommendation
    AppState --> Message
    AppState --> Recommendation
    AppState --> FilterState
    AppState --> AnalysisResult
    AnalysisResult --> ExtractedEntity
```

### API Integration Flow

```mermaid
sequenceDiagram
    participant UI as User Interface
    participant CS as Chat Service
    participant GS as Gemini Service
    participant QS as Qloo Service
    participant GA as Gemini API
    participant QA as Qloo API
    participant Cache as Response Cache
    
    Note over UI,Cache: Complete API Integration Flow
    
    UI->>CS: User submits message
    CS->>CS: Validate input
    CS->>GS: Request entity analysis
    
    Note over GS,GA: Gemini AI Processing
    GS->>GS: Build analysis prompt
    GS->>GA: POST /generateContent
    GA-->>GS: AI analysis response
    GS->>GS: Parse entities from response
    GS->>CS: Return extracted entities
    
    Note over CS,QS: Recommendation Processing
    CS->>QS: Request recommendations
    QS->>QS: Group entities by type
    QS->>Cache: Check cache for each type
    
    alt Cache Hit
        Cache-->>QS: Return cached data
    else Cache Miss
        QS->>QA: GET /v2/insights (parallel requests)
        QA-->>QS: Recommendation data
        QS->>Cache: Store in cache
    end
    
    QS->>QS: Transform API responses
    QS->>QS: Aggregate all recommendations
    QS->>CS: Return processed recommendations
    
    CS->>UI: Update state with results
    UI->>UI: Render recommendations
    UI->>UI: Initialize filters
```

### Project Structure (Detailed)

```
src/
├── components/                 # React Components
│   ├── ui/                    # Reusable UI Components
│   │   ├── ThemeToggle.jsx    # Dark/Light mode toggle
│   │   ├── LoadingSpinner.jsx # Loading indicators
│   │   ├── FocusRing.jsx      # Accessibility focus ring
│   │   └── index.js           # UI components barrel export
│   ├── skeletons/             # Loading Skeleton Components
│   │   ├── AppSkeleton.jsx    # Main app skeleton
│   │   ├── MessageSkeleton.jsx # Chat message skeleton
│   │   ├── RecommendationCardSkeleton.jsx
│   │   ├── FilterChipsSkeleton.jsx
│   │   └── index.js           # Skeletons barrel export
│   ├── ChatInterface.jsx      # Main chat interface
│   ├── MessageBubble.jsx      # Individual chat messages
│   ├── InputBox.jsx           # Message input component
│   ├── FilterChips.jsx        # Recommendation filters
│   ├── FilteredRecommendationView.jsx # Filter + Grid wrapper
│   ├── RecommendationGrid.jsx # Grid layout for recommendations
│   ├── RecommendationCard.jsx # Individual recommendation cards
│   ├── ControlButtons.jsx     # Chat control buttons
│   ├── ScreenReader.jsx       # Screen reader announcements
│   ├── SkipLinks.jsx          # Accessibility skip links
│   ├── NetworkStatus.jsx      # Network connectivity status
│   ├── OfflineMode.jsx        # Offline mode indicator
│   ├── DebugPanel.jsx         # Development debug panel
│   ├── ErrorBoundary.jsx      # Generic error boundary
│   ├── ChatErrorBoundary.jsx  # Chat-specific error boundary
│   ├── RecommendationErrorBoundary.jsx # Recommendation error boundary
│   ├── ApiErrorBoundary.jsx   # API error boundary
│   └── __tests__/             # Component test files
├── contexts/                  # React Context Providers
│   ├── AppStateContext.jsx    # Global application state
│   ├── ThemeContext.jsx       # Theme management
│   ├── ApiContext.jsx         # API configuration
│   └── index.js               # Context barrel export
├── hooks/                     # Custom React Hooks
│   ├── useAccessibility.js    # Accessibility utilities
│   ├── useDebugData.js        # Debug information hook
│   ├── useErrorHandler.js     # Error handling hook
│   ├── useLazyImage.js        # Lazy image loading
│   ├── useNetworkStatus.js    # Network connectivity
│   ├── useRecommendations.js  # Recommendation management
│   └── __tests__/             # Hook test files
├── services/                  # API Services & Business Logic
│   ├── chatService.js         # Chat message processing
│   ├── qlooService.js         # Qloo API integration
│   ├── geminiService.js       # Google Gemini AI integration
│   ├── networkService.js      # Network request utilities
│   ├── errorService.js        # Error logging and handling
│   ├── recommendationService.js # Recommendation processing
│   ├── dataUtils.js           # Data transformation utilities
│   └── __tests__/             # Service test files
├── utils/                     # Utility Functions
│   ├── accessibility.js       # Accessibility helpers
│   ├── performance.js         # Performance optimization
│   └── __tests__/             # Utility test files
├── config/                    # Configuration Files
│   └── api.js                 # API endpoints and constants
├── styles/                    # Styling Files
│   ├── tailwind.css           # Tailwind CSS imports
│   └── styles.css             # Custom CSS styles
├── App.jsx                    # Root application component
└── main.jsx                   # Application entry point
```

### Performance Optimization Flow

```mermaid
graph TD
    subgraph "Performance Strategies"
        A[Component Memoization] --> B[React.memo()]
        A --> C[useMemo()]
        A --> D[useCallback()]
        
        E[Lazy Loading] --> F[Lazy Images]
        E --> G[Code Splitting]
        E --> H[Dynamic Imports]
        
        I[Caching] --> J[API Response Cache]
        I --> K[Local Storage]
        I --> L[Request Deduplication]
        
        M[State Optimization] --> N[Context Splitting]
        M --> O[Selective Re-renders]
        M --> P[State Normalization]
    end
    
    subgraph "Monitoring"
        Q[Performance Metrics] --> R[Bundle Size]
        Q --> S[Load Time]
        Q --> T[Runtime Performance]
        Q --> U[Memory Usage]
    end
    
    A --> Q
    E --> Q
    I --> Q
    M --> Q
```

### Accessibility Implementation

```mermaid
graph LR
    subgraph "WCAG Compliance"
        A[Keyboard Navigation] --> B[Tab Order]
        A --> C[Focus Management]
        A --> D[Skip Links]
        
        E[Screen Reader] --> F[ARIA Labels]
        E --> G[Live Regions]
        E --> H[Semantic HTML]
        
        I[Visual] --> J[Color Contrast]
        I --> K[Focus Indicators]
        I --> L[Responsive Text]
        
        M[Motor] --> N[Click Targets]
        M --> O[Gesture Alternatives]
        M --> P[Timeout Extensions]
    end
    
    subgraph "Testing"
        Q[Automated Tests] --> R[axe-core]
        Q --> S[Jest-axe]
        
        T[Manual Testing] --> U[Screen Readers]
        T --> V[Keyboard Only]
        T --> W[Voice Control]
    end
    
    A --> Q
    E --> Q
    I --> Q
    M --> Q
```

### Error Handling Strategy

```mermaid
flowchart TD
    A[Error Occurs] --> B{Error Type}
    
    B -->|Network Error| C[Network Error Handler]
    B -->|API Error| D[API Error Handler]
    B -->|Component Error| E[Component Error Boundary]
    B -->|Validation Error| F[Validation Error Handler]
    
    C --> G[Retry Logic]
    C --> H[Offline Mode]
    C --> I[Cached Fallback]
    
    D --> J[Error Message Display]
    D --> K[Fallback Data]
    D --> L[User Notification]
    
    E --> M[Error Boundary UI]
    E --> N[Error Reporting]
    E --> O[Component Recovery]
    
    F --> P[Form Validation UI]
    F --> Q[Input Correction]
    F --> R[User Guidance]
    
    G --> S[Success Recovery]
    H --> T[Limited Functionality]
    I --> U[Degraded Experience]
    
    J --> V[User Action Required]
    K --> W[Partial Functionality]
    L --> X[System Notification]
    
    M --> Y[Manual Recovery]
    N --> Z[Developer Alert]
    O --> AA[Component Restart]
    
    P --> BB[Input Correction]
    Q --> CC[Real-time Feedback]
    R --> DD[Help Documentation]
```

## 🧪 Testing

Run the test suite:
```bash
npm run test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## 🎨 Customization

### Themes
The application supports custom themes. Modify `src/contexts/ThemeContext.jsx` to add new themes.

### Entity Types
Add new recommendation categories by updating:
- `src/config/api.js` - Add entity type mappings
- `src/services/qlooService.js` - Add URN mappings
- `src/components/RecommendationCard.jsx` - Add type-specific styling

### Styling
The project uses Tailwind CSS. Customize the design by:
- Modifying `tailwind.config.js`
- Updating component styles in individual files
- Adding custom CSS in `src/styles/tailwind.css`

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Code Quality
The project includes:
- ESLint for code linting
- Prettier for code formatting
- Husky for git hooks
- Conventional commits

## 🌐 Deployment Architecture

### Deployment Flow

```mermaid
graph TD
    subgraph "Development"
        A[Local Development] --> B[Git Commit]
        B --> C[Push to GitHub]
    end
    
    subgraph "CI/CD Pipeline"
        C --> D[GitHub Actions]
        D --> E[Run Tests]
        E --> F[Build Application]
        F --> G[Deploy to Staging]
        G --> H[Run E2E Tests]
        H --> I[Deploy to Production]
    end
    
    subgraph "Production Environment"
        I --> J[CDN Distribution]
        J --> K[Edge Caching]
        K --> L[Global Availability]
        
        M[Environment Variables] --> N[API Keys]
        M --> O[Configuration]
        
        P[Monitoring] --> Q[Error Tracking]
        P --> R[Performance Metrics]
        P --> S[User Analytics]
    end
    
    subgraph "External Services"
        T[Gemini API] --> U[AI Processing]
        V[Qloo API] --> W[Recommendations]
        X[GitHub] --> Y[Source Control]
    end
    
    I --> T
    I --> V
    C --> X
```

### Infrastructure Diagram

```mermaid
graph TB
    subgraph "Client Side"
        A[Web Browser] --> B[React Application]
        B --> C[Service Worker]
        C --> D[Local Storage]
        C --> E[IndexedDB Cache]
    end
    
    subgraph "CDN Layer"
        F[Vercel Edge Network] --> G[Static Assets]
        F --> H[API Routes]
        F --> I[Edge Functions]
    end
    
    subgraph "API Gateway"
        J[Rate Limiting] --> K[Request Routing]
        K --> L[Authentication]
        L --> M[Response Caching]
    end
    
    subgraph "External APIs"
        N[Google Gemini AI]
        O[Qloo Recommendations]
        P[Analytics Services]
    end
    
    subgraph "Monitoring & Logging"
        Q[Error Tracking]
        R[Performance Monitoring]
        S[User Analytics]
        T[API Monitoring]
    end
    
    A --> F
    F --> J
    J --> N
    J --> O
    
    B --> Q
    B --> R
    B --> S
    J --> T
```

### Environment Configuration

```mermaid
graph LR
    subgraph "Development"
        A[Local .env] --> B[Dev API Keys]
        A --> C[Debug Mode]
        A --> D[Hot Reload]
    end
    
    subgraph "Staging"
        E[Staging Env] --> F[Test API Keys]
        E --> G[Error Tracking]
        E --> H[Performance Testing]
    end
    
    subgraph "Production"
        I[Production Env] --> J[Production API Keys]
        I --> K[Monitoring]
        I --> L[Analytics]
        I --> M[Error Reporting]
    end
    
    subgraph "Security"
        N[Environment Variables] --> O[API Key Management]
        N --> P[CORS Configuration]
        N --> Q[Rate Limiting]
    end
    
    A --> E
    E --> I
    I --> N
```

### Vercel (Recommended)
1. **Connect Repository**: Connect your GitHub repository to Vercel
2. **Environment Variables**: Add the following environment variables in Vercel dashboard:
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_QLOO_API_KEY=your_qloo_api_key_here
   ```
3. **Build Settings**: Vercel should automatically detect the settings, but ensure:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
4. **Deploy**: Deploy automatically on push to main branch

#### Troubleshooting Vercel Deployment
If you encounter build errors:

**Terser Error**: The project includes terser configuration for production builds
- Ensure `terser` is in devDependencies (already included)
- The build script automatically updates browserslist data

**Environment Variables**: Make sure to add your API keys in Vercel dashboard:
- Go to Project Settings → Environment Variables
- Add `VITE_GEMINI_API_KEY` and `VITE_QLOO_API_KEY`

**Build Optimization**: The project includes:
- Automatic browserslist updates
- Optimized chunk splitting
- Terser minification with console removal
- Security headers and caching optimization

### Netlify
1. Connect repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables

### Manual Deployment
```bash
npm run build
# Upload dist/ folder to your hosting provider
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Qloo](https://qloo.com/) for the recommendation API
- [Google AI](https://ai.google.dev/) for Gemini AI
- [Framer Motion](https://www.framer.com/motion/) for animations
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [React](https://reactjs.org/) for the UI framework

## 📞 Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/Darkcoder011/TasteSpheree/issues) page
2. Create a new issue with detailed information
3. Contact the maintainers

---

**Built with ❤️ by the TasteSphere team**