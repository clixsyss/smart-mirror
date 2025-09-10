# Clixsys Smart Mirror

A modern, professional smart mirror interface built with React and Vite, designed for touch screen installations in smart homes.

## 🚀 Features

- **Modern Dark Theme**: Professional, minimal design optimized for touch screens
- **Real-time Data**: Live weather, news, and device status updates
- **Smart Home Control**: Integrated light and climate control
- **AI Assistant**: ChatGPT-powered voice assistant for device control
- **Touch Optimized**: Large buttons and intuitive gestures for physical screens
- **Responsive Design**: Works on various screen sizes and orientations

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite
- **Styling**: CSS3 with modern features (backdrop-filter, gradients)
- **Backend**: Firebase (Authentication, Firestore, Real-time updates)
- **AI**: OpenAI GPT-4 for smart assistant
- **APIs**: OpenWeatherMap, News RSS feeds, Quotable API

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/smart-mirror.git
   cd smart-mirror
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_OPENAI_API_KEY=your_openai_api_key
   VITE_OPENWEATHER_API_KEY=your_openweather_api_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── TimeDate.jsx    # Time and date display
│   ├── Weather.jsx     # Weather widget
│   ├── NewsHeadlines.jsx # News ticker
│   ├── QuoteOfDay.jsx  # Daily quotes
│   ├── LightControl.jsx # Light management
│   ├── ClimateControl.jsx # Climate control
│   ├── ChatGPTAssistant.jsx # AI assistant
│   └── Login.jsx       # Authentication
├── contexts/           # React contexts
│   └── AuthContext.jsx # Authentication context
├── stores/             # State management
│   └── roomsStore.js   # Firebase rooms store
├── utils/              # Utility functions
│   ├── cacheManager.js # Data caching
│   └── realtimeDebugger.js # Debug utilities
├── config/             # Configuration
│   └── firebase.js     # Firebase configuration
└── App.jsx             # Main application component
```

## 🎨 Design System

### Color Palette
- **Primary Background**: `#0a0a0a` to `#1a1a1a` gradient
- **Card Background**: `rgba(255, 255, 255, 0.03)`
- **Text Primary**: `#ffffff`
- **Text Secondary**: `rgba(255, 255, 255, 0.8)`
- **Accent**: `rgba(255, 255, 255, 0.1)`

### Typography
- **Font Family**: Inter, -apple-system, BlinkMacSystemFont
- **Headings**: 500-600 weight, uppercase, letter-spacing
- **Body**: 400 weight, optimized for readability

### Touch Targets
- **Minimum Size**: 44px × 44px
- **Spacing**: 24px between major elements
- **Border Radius**: 12px-24px for modern look

## 🔧 Configuration

### Firebase Setup
1. Create a Firebase project
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Set up security rules
5. Add your configuration to `.env.local`

### API Keys
- **OpenWeatherMap**: Get free API key for weather data
- **OpenAI**: Get API key for AI assistant functionality
- **News**: Uses RSS feeds (no API key required)

## 📱 Touch Screen Optimization

The interface is specifically designed for touch screen installations:

- **Large Touch Targets**: All interactive elements are at least 44px
- **Gesture Support**: Swipe and tap gestures for navigation
- **Auto-hide Navigation**: Navigation appears on touch/movement
- **High Contrast**: Optimized for various lighting conditions
- **Responsive Layout**: Adapts to different screen sizes

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 🔒 Security

- **Environment Variables**: All sensitive data stored in environment variables
- **Firebase Security Rules**: Proper authentication and authorization
- **API Rate Limiting**: Implemented for external API calls
- **Input Validation**: All user inputs are validated

## 📊 Performance

- **Lazy Loading**: Components loaded on demand
- **Caching**: Intelligent data caching with TTL
- **Optimized Images**: WebP format with fallbacks
- **Code Splitting**: Automatic code splitting with Vite
- **Real-time Updates**: Efficient Firebase listeners

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in this repository
- Contact the development team
- Check the documentation in `/docs`

## 🗺️ Roadmap

- [ ] Voice control integration
- [ ] Calendar integration
- [ ] Security camera feeds
- [ ] Music control
- [ ] Customizable widgets
- [ ] Multi-language support
- [ ] Offline mode
- [ ] Advanced analytics

---

**Built with ❤️ by the Clixsys Team**