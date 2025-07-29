# TasteSphere - AI-Powered Recommendation System

TasteSphere is a modern, AI-powered recommendation system that provides personalized suggestions for movies, TV shows, books, music, podcasts, places, people, brands, and destinations. Built with React, it features a chat-based interface powered by Google's Gemini AI and Qloo's recommendation API.

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

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── skeletons/      # Loading skeleton components
│   └── __tests__/      # Component tests
├── contexts/           # React context providers
├── hooks/              # Custom React hooks
├── services/           # API services and utilities
├── utils/              # Utility functions
├── config/             # Configuration files
└── styles/             # CSS and styling files
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

## 🌐 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

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