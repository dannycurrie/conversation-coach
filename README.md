# Conversation Coach

A minimal React web application for chatting with an ElevenLabs conversational agent.

## Tech Stack

- **Vite** - Fast build tool and dev server
- **React** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **ElevenLabs React SDK** - Conversational AI with React hooks

## Getting Started

### Prerequisites

- Node.js (v20.17.0 or higher recommended)
- npm or yarn
- ElevenLabs Agent ID

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your ElevenLabs credentials:
   - Copy `env.example` to `.env`
   - Add your ElevenLabs Agent ID to the `.env` file:
     ```
     VITE_ELEVENLABS_AGENT_ID=your_actual_agent_id_here
     VITE_ELEVENLABS_USER_ID=your_user_id_here  # optional
     ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`)

## Features

- **Real-time Chat Interface**: Clean, responsive chat UI
- **ElevenLabs Conversational AI**: Full conversation sessions with AI agents
- **Agent Persona & Scenario**: Set custom prompts to define the agent's role and context
- **Conversation Summary**: Detailed session recap with statistics and metrics
- **AI-Powered Evaluation**: Get detailed feedback on your communication skills
- **Connection Management**: Connect/disconnect from conversation sessions
- **TypeScript Support**: Full type safety
- **Tailwind Styling**: Modern, responsive design
- **Minimal Setup**: Focused on core functionality

## Usage

1. **Set Agent Prompt (Optional)**: Click "Set Prompt" to define the agent's persona and scenario
2. Click the "Connect" button to start a conversation session
3. Once connected, you can:
   - Type messages in the text area and press Enter or click Send
   - Speak directly to the AI agent (microphone access handled automatically)
4. The AI will respond with both text and audio, adopting the persona you set
5. Click "Disconnect" to end the conversation session and view the summary
6. Click "Get AI Evaluation" to receive detailed feedback on your communication skills
7. Review your conversation statistics and evaluation, then start a new session if desired

## Agent ID Setup

1. Visit [ElevenLabs](https://elevenlabs.io/)
2. Sign up for an account
3. Create a conversational agent in the dashboard
4. Get your Agent ID from the agent settings
5. Add it to your `.env` file as `VITE_ELEVENLABS_AGENT_ID`
6. Optionally, set a unique user ID as `VITE_ELEVENLABS_USER_ID`

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── App.tsx          # Main chat component
├── main.tsx         # React entry point
├── index.css        # Tailwind CSS imports
└── assets/          # Static assets
```

## AI Evaluation Feature

The conversation coach includes an AI-powered evaluation system that analyzes your conversation skills:

- **Automatic Analysis**: Evaluates communication effectiveness, tone, and structure
- **Detailed Feedback**: Provides specific strengths and areas for improvement
- **Scoring System**: Rates your performance on a 1-10 scale
- **Actionable Insights**: Offers concrete suggestions for better conversations
- **Context Awareness**: Considers the scenario and context when evaluating

### Evaluation Criteria

The AI evaluates conversations based on:
- **Communication Clarity**: How clearly you express your thoughts
- **Active Listening**: How well you respond to the agent's points
- **Professional Tone**: Maintaining appropriate conversation style
- **Question Quality**: Effectiveness of questions asked
- **Empathy & Understanding**: Showing consideration for the other party

## Notes

- This implementation uses the official ElevenLabs React SDK for conversational AI
- The app requires a valid ElevenLabs Agent ID to function
- Uses WebSocket connection for real-time audio communication
- Microphone access is handled automatically by the SDK
- Agent prompts allow you to set specific personas and scenarios for training
- AI evaluation uses mock data by default (can be integrated with real LLM APIs)
- Connection status and conversation ID are shown in the header
- All styling is handled with Tailwind CSS classes
- The conversation session must be started before you can send messages
- Supports both text and voice input to the AI agent