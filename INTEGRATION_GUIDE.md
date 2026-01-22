# Smart Mirror Redesign - Integration Guide

## Overview
This guide explains how to integrate the new Google Home-like tile dashboard and enhanced ChatGPT assistant into your existing Smart Mirror application.

## What's Been Created

### 1. Environment Context (`src/contexts/EnvironmentContext.jsx`)
- Single source of truth for room/device awareness
- Tracks active room, device states, recent actions
- Provides utilities for filtering and querying devices

### 2. Tile Components (`src/components/tiles/`)
- **Tile.jsx** - Base tile component (Google Home style)
- **LightsTile.jsx** - Lights control tile
- **ClimateTile.jsx** - Climate control tile
- **TileGrid.jsx** - Responsive grid layout
- **tiles.css** - Google Home aesthetic styles

### 3. Assistant Components (`src/components/assistant/`)
- **ChatPanel.jsx** - Main chat interface
- **ChatMessage.jsx** - Individual message component
- **StreamingMessage.jsx** - Streaming text display
- **chat.css** - Chat UI styles

### 4. Tool Calling System (`src/utils/assistant/`)
- **toolRegistry.js** - Tool definitions for OpenAI function calling
- **toolExecutor.js** - Safe execution of device actions
- **promptBuilder.js** - Context-aware prompt building
- **streamingClient.js** - Streaming API client

## Integration Steps

### Step 1: Wrap App with EnvironmentProvider

In `src/App.jsx`, wrap your main component with `EnvironmentProvider`:

```jsx
import { EnvironmentProvider } from './contexts/EnvironmentContext';

function SmartMirror() {
  // ... existing code ...

  return (
    <EnvironmentProvider>
      {/* Your existing app content */}
    </EnvironmentProvider>
  );
}
```

### Step 2: Add Tile Dashboard View (Optional Toggle)

Add a state to toggle between existing view and tile dashboard:

```jsx
const [viewMode, setViewMode] = useState('mirror'); // 'mirror' or 'tiles'

// In your render:
{viewMode === 'tiles' ? (
  <TileGrid onTileClick={(type) => openPanel(type)} />
) : (
  // Your existing mirror content
)}
```

### Step 3: Enhance Assistant with Streaming

Update `ChatGPTAssistant.jsx` to use the new streaming and tool calling:

```jsx
import { StreamingClient } from '../utils/assistant/streamingClient';
import { ToolExecutor } from '../utils/assistant/toolExecutor';
import { PromptBuilder } from '../utils/assistant/promptBuilder';
import { useEnvironment } from '../contexts/EnvironmentContext';
import ChatPanel from './assistant/ChatPanel';

// Inside component:
const environment = useEnvironment();
const promptBuilder = new PromptBuilder(environment, userProfile);
const toolExecutor = new ToolExecutor(actions, environment, userId);
const streamingClient = new StreamingClient(apiKey);

// Use ChatPanel instead of current UI
<ChatPanel
  messages={chatMessages}
  onSendMessage={handleSendMessage}
  isStreaming={isStreaming}
  quickActions={suggestedActions}
/>
```

### Step 4: Handle Tool Calls

When assistant makes tool calls, execute them:

```jsx
const handleStreamingResponse = async (messages) => {
  const tools = promptBuilder.getTools();
  let fullResponse = '';
  
  for await (const chunk of streamingClient.streamChatCompletion(messages, tools, handleToolCall)) {
    if (chunk.type === 'content') {
      fullResponse += chunk.content;
      // Update UI with streaming text
    } else if (chunk.type === 'tool_call_complete') {
      // Execute tool
      const result = await toolExecutor.execute(
        chunk.toolCall.function.name,
        JSON.parse(chunk.toolCall.function.arguments)
      );
      // Add tool result to conversation
    }
  }
};
```

## Feature Flags (Recommended)

To make this opt-in and avoid breaking changes:

```jsx
// In settings or env
const USE_TILE_DASHBOARD = import.meta.env.VITE_USE_TILES === 'true';
const USE_STREAMING_ASSISTANT = import.meta.env.VITE_STREAMING_ASSISTANT === 'true';

// Use conditionally
{USE_TILE_DASHBOARD ? <TileGrid /> : <ExistingMirrorView />}
```

## Environment Variables

No new env variables required - uses existing:
- `VITE_OPENAI_API_KEY` - Already configured

Optional feature flags:
- `VITE_USE_TILES=true` - Enable tile dashboard
- `VITE_STREAMING_ASSISTANT=true` - Enable streaming assistant

## Testing

1. **Test Tile Dashboard:**
   - Verify tiles load with correct device data
   - Test room filtering
   - Test device toggles and controls

2. **Test Assistant:**
   - Test streaming responses
   - Test tool calling (turn on lights, set temperature)
   - Test room awareness

3. **Test Integration:**
   - Verify existing features still work
   - Test switching between views
   - Test on different screen sizes

## Next Steps

1. **Complete Integration** - Wire everything into App.jsx
2. **Add More Tiles** - FanTile, CurtainsTile, ShuttersTile, SecurityTile
3. **Enhance Voice** - Add push-to-talk, hands-free mode
4. **Add Scenes** - Scene tiles for routines
5. **Performance** - Add virtualization for large device lists

## Notes

- All existing functionality is preserved
- New components are additive, not replacements
- Can be enabled/disabled via feature flags
- Backward compatible with existing code
