# Clixsys Kiosk App

A comprehensive smart home kiosk application that integrates smart mirror functionality with Clixsys device control capabilities. Built with React, Vite, and Firebase.

## Features

### 🪞 Smart Mirror
- **Real-time Clock & Date**: Always-current time and date display
- **Weather Forecast**: Current conditions and 3-day forecast
- **News Headlines**: Latest news updates
- **Daily Quotes**: Inspirational quotes to start your day

### 🏠 Smart Home Control
- **Light Control**: Manage all lights across different rooms
  - Turn individual lights on/off
  - Adjust brightness levels
  - Control all lights in a room simultaneously
- **Climate Control**: Manage temperature and air quality
  - Thermostat control
  - Fan speed adjustment
  - Air conditioner management

### 🔐 Authentication
- Secure login system integrated with Clixsys database
- User role-based access control
- Automatic logout and session management

### 🎨 Modern UI/UX
- Touch-friendly interface perfect for kiosk displays
- Auto-hiding navigation that appears on interaction
- Responsive design for different screen sizes
- Dark theme optimized for mirror displays

## Technology Stack

- **Frontend**: React 19 with Vite
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Styling**: CSS3 with modern features
- **Device Integration**: Compatible with Clixsys smart home system

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd mirror
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Add your API keys and configuration
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser to `http://localhost:5173`

## Configuration

### Firebase Setup
The application uses Firebase for authentication and data storage. The configuration is already set up to connect to the Clixsys database.

### API Keys
- **OpenAI API**: For weather data and news (configured in .env)
- **Weather API**: For real-time weather information

## Usage

### First Time Setup
1. Access the kiosk interface
2. Log in with your Clixsys credentials
3. Verify your account is approved in the system

### Navigation
- **Mirror View**: Shows time, weather, news, and quotes
- **Lights**: Control all lighting devices
- **Climate**: Manage temperature and air quality
- **Auto-hide Navigation**: Move mouse or touch screen to show controls

### Device Control
All device controls are synchronized with the Clixsys Firebase database:
- Changes are reflected in real-time
- State is persistent across sessions
- Compatible with other Clixsys applications

## Project Structure

```
src/
├── components/           # UI components
│   ├── Login.jsx        # Authentication
│   ├── TimeDate.jsx     # Clock display
│   ├── Weather.jsx      # Weather widget
│   ├── NewsHeadlines.jsx # News display
│   ├── QuoteOfDay.jsx   # Daily quotes
│   ├── LightControl.jsx # Light management
│   └── ClimateControl.jsx # Climate control
├── contexts/            # React contexts
│   └── AuthContext.jsx  # Authentication context
├── stores/              # Data management
│   └── roomsStore.js    # Room and device state
├── config/              # Configuration
│   └── firebase.js      # Firebase setup
├── utils/               # Utilities
│   └── cacheManager.js  # Data caching
└── App.jsx             # Main application
```

## Development

### Building for Production
```bash
npm run build
```

### Linting
```bash
npm run lint
```

### Testing
```bash
npm run test
```

## Deployment

The application can be deployed to any static hosting service:
- Vercel
- Netlify
- Firebase Hosting
- Traditional web servers

## Integration with Clixsys

This kiosk app is designed to work seamlessly with the existing Clixsys smart home system:
- Shares the same Firebase database
- Uses the same device hierarchy (users/rooms/devices)
- Compatible with existing Matter.js device integrations
- Supports the same user authentication system

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the Clixsys smart home ecosystem.

## Support

For support and questions, please refer to the Clixsys documentation or contact the development team.