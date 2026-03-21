# 💬 Team Chat & Real-Time Communication

The **Chat Module** provides a high-performance, real-time messaging interface integrated directly into the Apex Infinity ERP ecosystem. It supports public and private channels, direct messaging, file attachments, and intelligent AI assistance.

---

## 🚀 Key Features

### 📨 Messaging
- **Real-time Delivery**: Powered by Socket.io for instantaneous message synchronization.
- **Rich Media**: Support for file and image attachments with optimistic UI updates.
- **Edit & Delete**: Full support for message modification and permanent removal.
- **Typing Indicators**: Live visual feedback when team members are composing messages.
- **Read Receipts**: Track who has seen your messages in real-time.

### 👥 Channels & Presence
- **Public & Private Channels**: Organize communication by department or project.
- **Direct Messaging (DM)**: One-on-one private conversations.
- **Online Presence**: Real-time tracking of team member availability across the organization.
- **Unread Counters**: Smart notification badges for missed activity.

### 🎨 Personalization
- **Theme Sync**: Synchronize UI themes (Glass, Dark, etc.) across the team via socket events.

---

## 🛠️ Technical Architecture

### Split Service Pattern
To ensure scalability and maintainability, the chat logic is divided into three specialized services located in `src/app/core/services/socket/`:

1.  **`SocketConnectionService`**: Manages the low-level Socket.io connection, reconnection logic, and event listeners.
2.  **`ChatHttpService`**: Handles all persistent data operations (fetching history, creating channels, sending messages) via standard REST APIs.
3.  **`ChatStateService`**: Maintains the reactive state (Signals/Observables) of the chat UI, ensuring all components stay in sync.

### UI Components
- `ChatComponent`: The main layout container.
- `ChatSidebar`: Channel listing and search.
- `ChatMessages`: Infinite-scrolling message list with date grouping.
- `ChatComposer`: Rich text input with attachment handling.
- `MessageBubble`: Individual message rendering with status indicators.

---

## 📂 Directory Structure

```text
src/app/chat/
├── chat.component/      # Main UI components
│   ├── chat.component.ts         # Central controller
│   ├── chat-messages.component.ts # Messaging area
│   ├── chat-sidebar.component.ts  # Workspace navigation
│   └── chat-models.ts             # Type definitions
├── message-bubble.component/ # Specialized message renderer
└── services/            # Module-specific bootstrap logic
```

---

*Part of the Apex Infinity ERP Suite*
