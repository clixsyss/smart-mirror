# Setup Instructions

## Quick Start

### 1. Verify Environment Variables

Your `.env` file should already have:
```env
VITE_OPENAI_API_KEY=your_key_here
VITE_FIREBASE_API_KEY=...
# ... other Firebase config
```

### 2. Install Dependencies (if needed)

All dependencies are already in `package.json`. If you need to reinstall:
```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Integration Options

### Option A: Gradual Integration (Recommended)

1. **Test Environment Context First:**
   - Wrap your App with `EnvironmentProvider`
   - Verify room/device data is accessible via `useEnvironment()` hook

2. **Add Tile Dashboard as Alternative View:**
   - Add a toggle button to switch between existing view and tiles
   - Test tile functionality independently

3. **Enhance Assistant Incrementally:**
   - Start with ChatPanel UI
   - Add streaming support
   - Add tool calling

### Option B: Full Integration

Follow the `INTEGRATION_GUIDE.md` to integrate everything at once.

## File Structure Summary

```
src/
├── contexts/
│   └── EnvironmentContext.jsx          ✅ NEW - Room/device awareness
├── components/
│   ├── tiles/                          ✅ NEW - Tile components
│   │   ├── Tile.jsx
│   │   ├── LightsTile.jsx
│   │   ├── ClimateTile.jsx
│   │   ├── TileGrid.jsx
│   │   └── tiles.css
│   ├── assistant/                      ✅ NEW - Chat components
│   │   ├── ChatPanel.jsx
│   │   ├── ChatMessage.jsx
│   │   ├── StreamingMessage.jsx
│   │   └── chat.css
│   └── ChatGPTAssistant.jsx            ⚠️ MODIFY - Add streaming/tools
├── utils/
│   └── assistant/                       ✅ NEW - Tool calling system
│       ├── toolRegistry.js
│       ├── toolExecutor.js
│       ├── promptBuilder.js
│       └── streamingClient.js
└── App.jsx                              ⚠️ MODIFY - Integrate new components
```

## Testing Checklist

- [ ] EnvironmentContext provides room/device data
- [ ] Tiles display correctly with device information
- [ ] Room selector filters tiles correctly
- [ ] Device toggles work (lights, climate)
- [ ] Assistant chat UI displays messages
- [ ] Streaming responses work
- [ ] Tool calling executes device actions
- [ ] Existing features still work (no regressions)

## Troubleshooting

### Tiles not showing devices
- Check that `EnvironmentProvider` wraps your app
- Verify `state.smartHome.rooms` has data
- Check browser console for errors

### Assistant not streaming
- Verify `VITE_OPENAI_API_KEY` is set
- Check network tab for API calls
- Ensure streaming client is properly initialized

### Tool calls not working
- Verify `ToolExecutor` has access to `actions` and `environment`
- Check that device IDs match between tiles and assistant
- Review console for tool execution errors

## Next Steps

1. Complete remaining tiles (Fans, Curtains, Shutters, Security)
2. Add scene/routine tiles
3. Enhance voice UX (push-to-talk, hands-free)
4. Add animations and transitions
5. Optimize performance (memoization, virtualization)

## Support

Refer to:
- `IMPLEMENTATION_PLAN.md` - Full architecture overview
- `INTEGRATION_GUIDE.md` - Detailed integration steps
- `src/AppWithTiles.jsx.example` - Code example
