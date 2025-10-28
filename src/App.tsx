import { useState, useCallback } from 'react'
import { useConversation } from '@elevenlabs/react'
import { evaluateConversation, type EvaluationResult } from './utils'

export interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

const testPrompt = `You are a team lead in my department. 
Your personality is shy and introverted.
You are not very good at communicating with people. 
You are not very good at expressing yourself and speak in short, unclear sentences. 
You feel aggreived at your treatment and don't beleive the company is treating you fairly.
You are reluctant to engage in the meeting and are not very cooperative.
We have been under a lot of pressure and dealing with a lot of ambiguity, however you have not been meeting expectations, even if those expectations may not have been very clear. 
I have summoned you to a 1:1 meeting to discuss your performance.`


const scenarioDescription = `
You are a senior manager in a technology company.
Your direct report is a team lead in your department.
He has not been meeting expectations and you are concerned about his performance.
Your goal is to help him improve his performance, without impacting his confidence or morale unnecessarily.
`

const testTranscript = {
  messages: [
    { speaker: 'agent', text: 'hi... you er.. wanted to talk about me performance?', timestamp: new Date() },
    { speaker: 'user', text: 'yes, I wanted to talk about your performance. I have some concerns about your work.', timestamp: new Date() },
    { speaker: 'agent', text: 'oh, I see. I\'m not sure what you mean. Can you please elaborate?', timestamp: new Date() },
    { speaker: 'user', text: 'well, you have not been meeting expectations, even if those expectations may not have been very clear. You have not been cooperative and have been reluctant to engage in the meeting.', timestamp: new Date() },
    { speaker: 'agent', text: 'I see. I apologize for not meeting expectations. I will try to do better next time.', timestamp: new Date() },
    { speaker: 'user', text: 'I hope you will. I have been under a lot of pressure and dealing with a lot of ambiguity, however you have not been meeting expectations, even if those expectations may not have been very clear. You have not been cooperative and have been reluctant to engage in the meeting.', timestamp: new Date() },
    { speaker: 'agent', text: 'I see. I apologize for not meeting expectations. I will try to do better next time.', timestamp: new Date() },
  ],
  context: testPrompt,
  duration: '1m 30s'
}

const testConversationSummary = {
  duration: '1m 30s',
  messageCount: 6,
  userMessages: testTranscript.messages.filter(m => m.speaker === 'user').length,
  agentMessages: testTranscript.messages.filter(m => m.speaker === 'agent').length
}

const testMessages = testTranscript.messages.map(m => ({
  id: Date.now().toString(),
  text: m.text,
  isUser: m.speaker === 'user',
  timestamp: m.timestamp
}))


function App() {
  const [messages, setMessages] = useState<Message[]>(testMessages)
  const [inputText, setInputText] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [agentPrompt, setAgentPrompt] = useState(testPrompt)
  const [showPromptInput, setShowPromptInput] = useState(false)
  const [showSummary, setShowSummary] = useState(true)
  const [conversationSummary, setConversationSummary] = useState<{
    duration: string
    messageCount: number
    userMessages: number
    agentMessages: number
  } | null>(testConversationSummary)
  const [conversationStartTime, setConversationStartTime] = useState<Date | null>(null)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)

  const conversation = useConversation({
    onConnect: (o) => {
      console.log('onConnect', o)
      console.log('Connected to ElevenLabs agent')
      console.log('Available conversation methods:', Object.keys(conversation))
      setIsConnected(true)
      setIsLoading(false)
      setConversationStartTime(new Date())
      setShowSummary(false) // Hide summary when starting new conversation
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs agent')
      setIsConnected(false)
      setConversationId(null)
      setIsLoading(false)
    },
    onMessage: (message) => {
      console.log('Received message:', message)
      const newMessage: Message = {
        id: Date.now().toString(),
        text: message.message || 'Received audio response',
        isUser: message.source === 'user',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, newMessage])
    },
  })

  const endConversation = useCallback(async () => {
    await conversation.endSession()
    setShowPromptInput(false) // Reset prompt input when disconnecting
    
    // Generate conversation summary
    if (conversationStartTime) {
      const duration = Date.now() - conversationStartTime.getTime()
      const durationMinutes = Math.floor(duration / 60000)
      const durationSeconds = Math.floor((duration % 60000) / 1000)
      
      const userMessages = messages.filter(m => m.isUser).length
      const agentMessages = messages.filter(m => !m.isUser).length
      
      setConversationSummary({
        duration: `${durationMinutes}m ${durationSeconds}s`,
        messageCount: messages.length,
        userMessages,
        agentMessages
      })
      console.log('Conversation:', messages)
      setShowSummary(true)
    }
    
    setConversationStartTime(null)
  }, [conversation, conversationStartTime, messages])

  const handleSetPrompt = () => {
    if (agentPrompt.trim()) {
      setShowPromptInput(false)
    }
  }

  const handleClearPrompt = () => {
    setAgentPrompt('')
    setShowPromptInput(false)
  }

  const handleStartNewConversation = () => {
    setShowSummary(false)
    setConversationSummary(null)
    setMessages([])
    setShowPromptInput(false)
    setEvaluation(null)
    setIsEvaluating(false)
  }

  const handleCloseSummary = () => {
    setShowSummary(false)
  }

  const evaluateConversationHandler = async () => {
    if (!messages.length) return

    setIsEvaluating(true)
    
    try {
      // Create transcript for evaluation
      // const transcript = {
      //   messages: messages.map(msg => ({
      //     speaker: msg.isUser ? 'user' as const : 'agent' as const,
      //     text: msg.text,
      //     timestamp: msg.timestamp
      //   })),
      //   context: agentPrompt || 'General conversation practice',
      //   duration: conversationSummary?.duration || 'Unknown'
      // }

      const transcript = {
        ...testTranscript,
      }

      // Use the utility function for evaluation
      const result = await evaluateConversation(transcript, scenarioDescription)
      console.log('Evaluation result:', result)
      setEvaluation(result)
    } catch (error) {
      console.error('Error evaluating conversation:', error)
      // Set a fallback evaluation
      setEvaluation({
        score: 7,
        feedback: "Unable to generate evaluation at this time. Please try again later.",
        strengths: ["Conversation completed successfully"],
        improvements: ["Evaluation service unavailable"]
      })
    } finally {
      setIsEvaluating(false)
    }
  }

  // Function to send prompt to agent after connection
  const sendPromptToAgent = useCallback(async () => {
    if (!agentPrompt.trim() || !isConnected) return

    console.log('Attempting to send prompt to agent:', agentPrompt)
    
    try {
      conversation.sendUserMessage(agentPrompt)
    } catch (error) {
      console.error('Error sending prompt to agent:', error)
    }
  }, [agentPrompt, isConnected, conversation])

  const startConversation = useCallback(async () => {
    setIsLoading(true)
    try {
      const sessionConfig = {
        agentId: import.meta.env.VITE_ELEVENLABS_AGENT_ID || 'your-agent-id-here',
        connectionType: 'websocket' as const, // either "webrtc" or "websocket"
        userId: import.meta.env.VITE_ELEVENLABS_USER_ID || 'user-' + Date.now() // optional field
      }

      console.log('Starting conversation with prompt:', agentPrompt.trim() ? 'Yes' : 'No')
      
      const conversationId = await conversation.startSession(sessionConfig)
      
      console.log('Conversation started with ID:', conversationId)
      setConversationId(conversationId)
      setShowPromptInput(false) // Hide prompt input after starting
      
      // Automatically send the prompt after a short delay to ensure connection is ready
      if (agentPrompt.trim()) {
        setTimeout(() => {
          sendPromptToAgent()
        }, 1000)
      }
    } catch (error) {
      console.error('Failed to start conversation:', error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: 'Failed to start conversation. Please check your Agent ID and try again.',
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [conversation, agentPrompt, sendPromptToAgent])

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading || !isConnected) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)

    try {
      // Send message to the conversation
      console.log('Sending message:', inputText)
      conversation.sendUserMessage(inputText)
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, there was an error sending your message.',
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-800">Conversation Coach</h1>
        <p className="text-sm text-gray-600">Chat with your AI conversation partner</p>
        <div className="mt-2 flex items-center space-x-4">
          <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          {conversationId && (
            <div className="text-xs text-gray-500">
              <span>ID: {conversationId.substring(0, 8)}...</span>
            </div>
          )}

          {!isConnected && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPromptInput(!showPromptInput)}
                className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
              >
                {agentPrompt ? 'Edit Prompt' : 'Set Prompt'}
              </button>
              <button
                onClick={startConversation}
                className="bg-green-500 text-white px-4 py-1 rounded text-xs hover:bg-green-600 transition-colors"
              >
                Connect
              </button>
            </div>
          )}
          {isConnected && (
            <div className="flex items-center space-x-2">
              {agentPrompt.trim() && (
                <button
                  onClick={sendPromptToAgent}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
                >
                  Send Prompt
                </button>
              )}
              <button
                onClick={endConversation}
                className="bg-red-500 text-white px-4 py-1 rounded text-xs hover:bg-red-600 transition-colors"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Conversation Summary Screen */}
      {showSummary && conversationSummary && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center justify-center p-6">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Conversation Complete!</h2>
              <p className="text-gray-600">Great job on your practice session</p>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">{conversationSummary.duration}</div>
                <div className="text-sm text-blue-800">Duration</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">{conversationSummary.messageCount}</div>
                <div className="text-sm text-green-800">Total Messages</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">{conversationSummary.userMessages}</div>
                <div className="text-sm text-purple-800">Your Messages</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">{conversationSummary.agentMessages}</div>
                <div className="text-sm text-orange-800">Agent Messages</div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Session Details</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">Agent Persona:</span> {agentPrompt ? 'Custom scenario set' : 'Default agent'}</p>
                <p><span className="font-medium">Connection Type:</span> WebSocket</p>
                <p><span className="font-medium">Session ID:</span> {conversationId ? conversationId.substring(0, 8) + '...' : 'N/A'}</p>
              </div>
            </div>

            {/* Evaluation Section */}
            {!evaluation && !isEvaluating && (
              <div className="mb-6">
                <button
                  onClick={evaluateConversationHandler}
                  className="w-full bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-medium"
                >
                  🧠 Get AI Evaluation
        </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Get detailed feedback on your conversation skills
                </p>
              </div>
            )}

            {isEvaluating && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  <span className="text-blue-700 font-medium">Analyzing your conversation...</span>
                </div>
                <p className="text-xs text-blue-600 text-center mt-2">
                  Our AI coach is reviewing your communication skills
        </p>
      </div>
            )}

            {evaluation && (
              <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">AI Evaluation</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-green-600">{evaluation.score}/10</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(evaluation.score / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Overall Feedback</h4>
                    <p className="text-sm text-gray-600">{evaluation.feedback}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-green-700 mb-2">Strengths</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {evaluation.strengths.map((strength, index) => (
                          <li key={`strength-${index}-${strength.substring(0, 10)}`} className="flex items-start space-x-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-orange-700 mb-2">Areas for Improvement</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {evaluation.improvements.map((improvement, index) => (
                          <li key={`improvement-${index}-${improvement.substring(0, 10)}`} className="flex items-start space-x-2">
                            <span className="text-orange-500 mt-1">•</span>
                            <span>{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={handleCloseSummary}
                className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
              <button
                onClick={handleStartNewConversation}
                className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Start New Conversation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agent Prompt Input */}
      {showPromptInput && !isConnected && (
        <div className="bg-blue-50 border-b px-6 py-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-800">Set Agent Persona & Scenario</h3>
              <button
                onClick={handleClearPrompt}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
            <textarea
              value={agentPrompt}
              onChange={(e) => setAgentPrompt(e.target.value)}
              placeholder="Enter a prompt to set the agent's persona and scenario. For example: 'You are a team lead in my department. We have been under a lot of pressure and dealing with a lot of ambiguity, however you have not been meeting expectations, even if those expectations may not have been very clear. I have summoned you to a 1:1 meeting to discuss your performance.'"
              className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-600">
                This prompt will be sent to the agent when you connect, setting the context for your conversation.
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowPromptInput(false)}
                  className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSetPrompt}
                  disabled={!agentPrompt.trim()}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Set Prompt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      {!showSummary && (
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg">
              {isConnected ? 'Start a conversation!' : 'Connect to start chatting'}
            </p>
            <p className="text-sm">
              {isConnected 
                ? 'Type a message below or speak directly to your AI coach.'
                : 'Click the Connect button above to start a conversation session.'
              }
            </p>
            {agentPrompt && !isConnected && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-left max-w-2xl mx-auto">
                <p className="text-xs text-blue-600 font-medium mb-1">Agent Prompt Set:</p>
                <p className="text-sm text-gray-700 italic">"{agentPrompt}"</p>
              </div>
            )}
            {agentPrompt && isConnected && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg text-left max-w-2xl mx-auto">
                <p className="text-xs text-green-600 font-medium mb-1">Agent is using your custom prompt</p>
                <p className="text-sm text-gray-700">The agent has adopted the persona and scenario you defined.</p>
              </div>
            )}
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.isUser
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-800 shadow-sm border'
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p className={`text-xs mt-1 ${
                message.isUser ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 shadow-sm border px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        </div>
      )}

      {/* Input Area */}
      {!showSummary && (
        <div className="bg-white border-t px-6 py-4">
          <div className="flex space-x-4">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={isConnected ? "Type your message here..." : "Connect first to start chatting"}
              className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              disabled={isLoading || !isConnected}
            />
            
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading || !isConnected}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
          
          <div className="mt-2 text-xs text-gray-500">
            <p>Note: Set VITE_ELEVENLABS_AGENT_ID in your .env file</p>
            <p className="mt-1">🎭 Agent prompts are sent as messages after connection</p>
            <p className="mt-1">🎤 Voice input is handled automatically by the ElevenLabs SDK</p>
            <p className="mt-1">🔗 Uses WebSocket connection for real-time audio</p>
            <p className="mt-1 text-blue-600">💡 Check browser console for available methods and debug info</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App