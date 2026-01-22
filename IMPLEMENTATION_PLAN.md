# Smart Mirror Redesign - Implementation Plan

## Overview
Transform the Smart Mirror UI into a Google Home-like tile dashboard with an enhanced ChatGPT-like assistant that has room awareness and tool calling capabilities.

## Current Architecture Analysis

### Existing Components
- **State Management**: `globalStore.js` (centralized state), `roomsStore.js` (room/device data)
- **Device Controls**: `LightControl`, `ClimateControl`, `FanControl`, `CurtainsControl`, `ShuttersControl`
- **Assistant**: `ChatGPTAssistant.jsx` (basic voice + OpenAI integration)
- **UI**: Modal-based panels, card layout for mirror content
- **Actions**: `toggleLight`, `setLightBrightness`, `setClimateState`, `setClimateTemperature`, etc.

### Data Structure
- Rooms: `{ id, name, devices: [{ id, name, type, state, ... }] }`
- Devices: `{ id, name, type, state, brightness, temperature, mode, ... }`
- Global state: `state.smartHome.rooms`, `state.smartHome.devices`

## Implementation Plan

### Phase 1: Environment Context (Room/Device Awareness)
**Files to Create:**
- `src/contexts/EnvironmentContext.jsx` - Single source of truth for room/device state
- `src/hooks/useEnvironment.js` - Hook to access environment context

**Features:**
- Active room tracking
- Device state aggregation
- Recent actions log
- Room filtering utilities

### Phase 2: Tile Dashboard Components
**Files to Create:**
- `src/components/tiles/Tile.jsx` - Base tile component
- `src/components/tiles/LightsTile.jsx` - Lights control tile
- `src/components/tiles/ClimateTile.jsx` - Climate control tile
- `src/components/tiles/FanTile.jsx` - Fan control tile
- `src/components/tiles/CurtainsTile.jsx` - Curtains control tile
- `src/components/tiles/ShuttersTile.jsx` - Shutters control tile
- `src/components/tiles/SecurityTile.jsx` - Security tile
- `src/components/tiles/MediaTile.jsx` - Media tile
- `src/components/tiles/TileGrid.jsx` - Responsive grid layout
- `src/components/tiles/TileSkeleton.jsx` - Loading skeleton
- `src/components/tiles/tiles.css` - Tile styles (Google Home aesthetic)

**Features:**
- Large rounded cards with subtle shadows
- Clear iconography and hierarchy
- Primary/secondary actions
- Responsive grid (mobile/tablet/wall display)
- Smooth transitions and animations

### Phase 3: Enhanced Assistant with Streaming
**Files to Modify:**
- `src/components/ChatGPTAssistant.jsx` - Add streaming, chat UI, tool calling

**Files to Create:**
- `src/components/assistant/ChatPanel.jsx` - Chat interface component
- `src/components/assistant/ChatMessage.jsx` - Individual message component
- `src/components/assistant/StreamingMessage.jsx` - Streaming text display
- `src/components/assistant/QuickActions.jsx` - Suggested action buttons
- `src/utils/assistant/streamingClient.js` - Streaming API client
- `src/utils/assistant/promptBuilder.js` - Context-aware prompt builder
- `src/utils/assistant/toolRegistry.js` - Tool calling registry

**Features:**
- Token-by-token streaming responses
- Markdown rendering
- Message history
- Quick action suggestions
- Room-aware responses

### Phase 4: Tool Calling Layer
**Files to Create:**
- `src/utils/assistant/toolRegistry.js` - Tool definitions and execution
- `src/utils/assistant/toolExecutor.js` - Safe tool execution with validation

**Tools to Implement:**
- `toggleLight(deviceId, roomId?)` - Toggle light on/off
- `setBrightness(deviceId, value, roomId?)` - Set light brightness
- `setTemperature(deviceId, value, roomId?)` - Set climate temperature
- `setClimateState(deviceId, state, roomId?)` - Turn climate on/off
- `activateScene(sceneId)` - Activate a scene
- `lockDoor(deviceId, roomId?)` - Lock/unlock door
- `openCurtains(deviceId, roomId?)` - Open curtains
- `closeCurtains(deviceId, roomId?)` - Close curtains

### Phase 5: Voice Enhancements
**Files to Modify:**
- `src/components/ChatGPTAssistant.jsx` - Enhance voice UX

**Features:**
- Push-to-talk mode
- Hands-free mode toggle
- Visual feedback (waveform/listening indicator)
- Graceful degradation

### Phase 6: Integration
**Files to Modify:**
- `src/App.jsx` - Integrate tile dashboard and enhanced assistant
- `src/App.css` - Add tile dashboard styles

**Features:**
- Room selector
- Tile dashboard as main view
- Assistant panel/sheet
- Preserve existing modal panels as fallback

## File Structure

```
src/
├── contexts/
│   ├── AuthContext.jsx (existing)
│   └── EnvironmentContext.jsx (NEW)
├── components/
│   ├── tiles/ (NEW)
│   │   ├── Tile.jsx
│   │   ├── LightsTile.jsx
│   │   ├── ClimateTile.jsx
│   │   ├── FanTile.jsx
│   │   ├── CurtainsTile.jsx
│   │   ├── ShuttersTile.jsx
│   │   ├── SecurityTile.jsx
│   │   ├── MediaTile.jsx
│   │   ├── TileGrid.jsx
│   │   ├── TileSkeleton.jsx
│   │   └── tiles.css
│   ├── assistant/ (NEW)
│   │   ├── ChatPanel.jsx
│   │   ├── ChatMessage.jsx
│   │   ├── StreamingMessage.jsx
│   │   └── QuickActions.jsx
│   └── ChatGPTAssistant.jsx (MODIFY)
├── hooks/
│   ├── useGlobalStore.js (existing)
│   └── useEnvironment.js (NEW)
├── utils/
│   └── assistant/ (NEW)
│       ├── streamingClient.js
│       ├── promptBuilder.js
│       ├── toolRegistry.js
│       └── toolExecutor.js
└── App.jsx (MODIFY)
```

## Implementation Order

1. **EnvironmentContext** - Foundation for room awareness
2. **Base Tile Component** - Reusable tile structure
3. **Individual Tiles** - Lights, Climate, etc.
4. **Tile Grid** - Dashboard layout
5. **Streaming Chat UI** - Assistant interface
6. **Tool Calling** - Action execution layer
7. **Integration** - Wire everything together
8. **Voice Enhancements** - Polish voice UX

## Key Design Principles

1. **No Breaking Changes** - All existing functionality preserved
2. **Incremental** - Build on top of existing code
3. **Performance** - Memoization, virtualization where needed
4. **Accessibility** - Keyboard navigation, screen reader support
5. **Responsive** - Works on mobile, tablet, wall displays

## Environment Variables

No new env variables needed - uses existing:
- `VITE_OPENAI_API_KEY` - Already configured
- `VITE_FIREBASE_*` - Already configured

## Testing Strategy

- Test each tile independently
- Test tool calling with mock devices
- Test streaming with network throttling
- Test room filtering and context awareness
- Verify no regressions in existing features
