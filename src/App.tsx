import { useState, useCallback } from 'react'
import { useConversation } from '@elevenlabs/react'
import { evaluateConversation, type EvaluationResult } from './utils'

export interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}


const testPrompt = `
You are a CEO of a technology company.
You are anxious about upcoming quarterly results and are pressuring your senior managers to deliver faster.
You have summoned your senior manager to a 1:1 meeting to discuss the situation and pressure them to deliver faster.
`


const defaultScenarioDescription = `
I am a senior manager in a technology company.
I am facing pressure to compress timelines and deliverables, but my team is adamant that we cannot do it.
My CEO has approached me to discuss the situation and pressure me to speed up the project.
`

const agentPromptInstructions = `
You must respond with ONLY spoken dialogue. Never include:
- Stage directions (e.g., *laughs*, *sighs*)
- Actions in parentheses (e.g., (stares at hands))
- Descriptions of tone or manner (e.g., "mumbles", "says quietly")
- Any non-verbal content

Only output the exact words you would speak aloud.
`;

const testTranscript = {
  messages: [
      {
          "id": "1764605655588",
          "text": "Hello, welcome to your practice session - send your scenario prompt to get started.",
          "isUser": false,
          "timestamp": new Date("2025-12-01T16:14:15.588Z")
      },
      {
          "id": "1764605666230",
          "text": "\nshifts uncomfortably in chair, avoids eye contact\n\nUh... hi.\n\nI know why I'm here. About... work stuff.\n\nNot sure what to say exactly. Things have been... complicated.\n\nExpectations weren't really... clear to me.",
          "isUser": false,
          "timestamp": new Date("2025-12-01T16:14:26.230Z")
      },
      {
          "id": "1764605701211",
          "text": "Thanks, Luke. The reason why I brought you here today is I wanted to go through some feedback that I've collected on you from some of your peers and also from some of my own observations.",
          "isUser": true,
          "timestamp": new Date("2025-12-01T16:15:01.211Z")
      },
      {
          "id": "1764605702244",
          "text": "\nfidgets with pen, looks down\n\nFeedback... from peers.\n\nNot sure what they said.\n\nDon't understand why we're doing this.\n\nExpectations were never clear to me.",
          "isUser": false,
          "timestamp": new Date("2025-12-01T16:15:02.244Z")
      },
      {
          "id": "1764605745916",
          "text": "Okay, I'm going to share the feedback now. So Lucy, the product manager feels unsupported and feels that you haven't been accountable for the things that you've promised to give to her. The development team have expressed concern that plans have not been clear and our commercial team have expressed a concern that they are not clear on the product that we're building and when it's going to be delivered.",
          "isUser": true,
          "timestamp": new Date("2025-12-01T16:15:45.917Z")
      },
      {
          "id": "1764605746504",
          "text": "\nshifts in seat, voice barely audible\n\nNot my fault.\n\nExpectations were never clear.\n\nDon't understand what they want from me.",
          "isUser": false,
          "timestamp": new Date("2025-12-01T16:15:46.504Z")
      },
      {
          "id": "1764605771284",
          "text": "Luke, I understand that the environment at Jack has been difficult at times and there's been a lot of ambiguity, but being a leader means cutting through that ambiguity and taking responsibility to create clarity for your team.",
          "isUser": true,
          "timestamp": new Date("2025-12-01T16:16:11.284Z")
      },
      {
          "id": "1764605771862",
          "text": "\n\nmumbles quietly, avoiding eye contact\n\nNot my job to fix everything.\n\nAmbiguity comes from above.\n\nNo one tells me anything clear.",
          "isUser": false,
          "timestamp": new Date("2025-12-01T16:16:11.862Z")
      },
      {
          "id": "1764605787980",
          "text": "And what have you done to try and get some clarity from above?",
          "isUser": true,
          "timestamp": new Date("2025-12-01T16:16:27.980Z")
      },
      {
          "id": "1764605788749",
          "text": "\nstares at hands, voice barely audible\n\nTried asking questions.\n\nNever got real answers.\n\nTold to figure it out myself.\n\nNot my fault.",
          "isUser": false,
          "timestamp": new Date("2025-12-01T16:16:28.749Z")
      },
      {
          "id": "1764605802906",
          "text": "And why didn't you escalate this to me at the time?",
          "isUser": true,
          "timestamp": new Date("2025-12-01T16:16:42.906Z")
      },
      {
          "id": "1764605803432",
          "text": "\navoids eye contact, shrugs\n\nThought you'd be busy.\n\nDidn't want to bother you.\n\nTried handling it myself.",
          "isUser": false,
          "timestamp": new Date("2025-12-01T16:16:43.432Z")     
      },
      {
          "id": "1764605846046",
          "text": "Well unfortunately Luke you haven't met expectations. And the feedback that I've had and my own observations amount to a big issue with your role. We're now going to have to put you on a performance improvement plan where we're going to share specific goals that you need to attain over the next three months. And you and I will meet weekly to go through those goals and see whether you are achieving those. But Luke, I want you to know that I'm committed to supporting you through this. So please lean on me for support where you need it.",
          "isUser": true,
          "timestamp": new Date("2025-12-01T16:17:26.046Z")
      },
      {
          "id": "1764605846757",
          "text": "\nstares at floor, voice barely audible\n\nPerformance plan.\n\nThree months.\n\nWeekly meetings.\n\nDon't know what to say.",
          "isUser": false,
          "timestamp": new Date("2025-12-01T16:17:26.757Z")
      },
      {
          "id": "1764605872301",
          "text": "Well, I'm going to leave it there, Luke. I don't want to make you more uncomfortable than you are already. I know this is difficult to hear. This is difficult for me to say as well. But I'm going to support you over these three months. So let's work together and turn this around.",
          "isUser": true,
          "timestamp": new Date("2025-12-01T16:17:52.301Z")
      },
      {
          "id": "1764605873034",
          "text": "\navoids eye contact, mumbles\n\nPerformance plan.\n\nThree months.\n\nWeekly meetings.\n\nNot sure what to say.",
          "isUser": false,
          "timestamp": new Date("2025-12-01T16:17:53.034Z")
      },
      {
          "id": "1764605884778",
          "text": "Okay, we'll leave it there. Thank you, Luke. Bye.",
          "isUser": true,
          "timestamp": new Date("2025-12-01T16:18:04.778Z")
      },
      {
          "id": "1764605885219",
          "text": "\nmumbles barely audible\n\nOkay.\n\nBye.\n\nNot much to say.",
          "isUser": false,
          "timestamp": new Date("2025-12-01T16:18:05.220Z")
      }
  ],
  context: testPrompt,
  duration: '1m 30s'
}

const testConversationSummary = {
  duration: '1m 30s',
  messageCount: 6,
  userMessages: testTranscript.messages.filter(m => m.isUser).length,
  agentMessages: testTranscript.messages.filter(m => !m.isUser).length
}

const testMessages = testTranscript.messages.map(m => ({
  id: Date.now().toString(),
  text: m.text,
  isUser: m.isUser,
  timestamp: m.timestamp
}))

const TEST_MODE = false


function App() {
  const [messages, setMessages] = useState<Message[]>(TEST_MODE ? testMessages : [])
  const [inputText, setInputText] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [agentPrompt, setAgentPrompt] = useState(testPrompt)
  const [scenarioDescription, setScenarioDescription] = useState(defaultScenarioDescription)
  const [feedbackAreas, setFeedbackAreas] = useState<string[]>(['Communication clarity', 'Active listening', 'Empathy'])
  const [feedbackAreaInput, setFeedbackAreaInput] = useState('')
  const [showPromptInput, setShowPromptInput] = useState(false)
  const [showSetupScreen, setShowSetupScreen] = useState(!TEST_MODE)
  const [showSummary, setShowSummary] = useState(TEST_MODE)
  const [conversationSummary, setConversationSummary] = useState<{
    duration: string
    messageCount: number
    userMessages: number
    agentMessages: number
  } | null>(TEST_MODE ? testConversationSummary : null)
  const [conversationStartTime, setConversationStartTime] = useState<Date | null>(null)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs agent')
      setIsConnected(true)
      setIsLoading(false)
      setConversationStartTime(new Date())
      setShowSummary(false) // Hide summary when starting new conversation
      setShowSetupScreen(false) // Hide setup screen when starting conversation
      sendPromptToAgent()
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
    setShowSetupScreen(true)
    setEvaluation(null)
    setIsEvaluating(false)
  }

  const handleTryConversationAgain = () => {
    // Reset conversation state but keep scenario settings
    setShowSummary(false)
    setConversationSummary(null)
    setMessages([])
    setShowPromptInput(false)
    setShowSetupScreen(false)
    setEvaluation(null)
    setIsEvaluating(false)
    // Start new conversation with same settings
    startConversation()
  }

  const handleAddFeedbackArea = () => {
    if (feedbackAreaInput.trim() && !feedbackAreas.includes(feedbackAreaInput.trim())) {
      setFeedbackAreas([...feedbackAreas, feedbackAreaInput.trim()])
      setFeedbackAreaInput('')
    }
  }

  const handleRemoveFeedbackArea = (area: string) => {
    setFeedbackAreas(feedbackAreas.filter(a => a !== area))
  }

  const handleStartConversationFromSetup = () => {
    if (scenarioDescription.trim() && agentPrompt.trim()) {
      setShowSetupScreen(false)
      startConversation()
    }
  }

  const handleCloseSummary = () => {
    setShowSummary(false)
  }

  const evaluateConversationHandler = async () => {
    if (!messages.length) return

    setIsEvaluating(true)
    
    try {
      // Create transcript for evaluation
      let transcript = {
        messages: messages.map(msg => ({
          speaker: msg.isUser ? 'user' as const : 'agent' as const,
          text: msg.text,
          timestamp: msg.timestamp
        })),
        context: agentPrompt || 'General conversation practice',
        duration: conversationSummary?.duration || 'Unknown'
      }

      if (TEST_MODE) {
        transcript = {
          messages: testTranscript.messages.map(msg => ({
            speaker: msg.isUser ? 'user' as const : 'agent' as const,
            text: msg.text,
            timestamp: msg.timestamp
          })),
          context: testTranscript.context,
          duration: testTranscript.duration
        }
      }

      // Use the utility function for evaluation
      const result = await evaluateConversation(transcript, scenarioDescription, feedbackAreas)
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
    if (!agentPrompt.trim()) {
      console.error('Cannot send prompt to agent: agent prompt is empty')
      return
    }

    console.log('Attempting to send prompt to agent:', agentPrompt)
    
    try {
      const promptWithInstructions = `${agentPrompt}\n\n${agentPromptInstructions}`
      conversation.sendUserMessage(promptWithInstructions)
    } catch (error) {
      console.error('Error sending prompt to agent:', error)
    }
  }, [agentPrompt, conversation])

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
          sendPromptToAgent()
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

          {!isConnected && !showSetupScreen && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSetupScreen(true)}
                className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
              >
                Setup Conversation
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
              <button
                onClick={endConversation}
                className="bg-red-500 text-white px-4 py-1 rounded text-xs hover:bg-red-600 transition-colors"
              >
                End Conversation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Setup Screen */}
      {showSetupScreen && !isConnected && messages.length === 0 && !showSummary && (
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">New Conversation Setup</h2>
                <p className="text-gray-600">Configure your practice session before starting</p>
              </div>

              <div className="space-y-6">
                {/* Scenario Description */}
                <div>
                  <label htmlFor="scenario-description" className="block text-sm font-semibold text-gray-700 mb-2">
                    Scenario Description <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Describe the overall scenario and context for this conversation. This helps the AI understand the situation and evaluate your performance.
                  </p>
                  <textarea
                    id="scenario-description"
                    value={scenarioDescription}
                    onChange={(e) => setScenarioDescription(e.target.value)}
                    placeholder="e.g., You are a senior manager having a performance discussion with a team lead who hasn't been meeting expectations..."
                    className="w-full resize-none border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={5}
                  />
                </div>

                {/* Agent Prompt */}
                <div>
                  <label htmlFor="agent-prompt" className="block text-sm font-semibold text-gray-700 mb-2">
                    Agent Prompt <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Define the persona and characteristics of the AI agent you'll be conversing with. This sets the role, personality, and behavior of your conversation partner.
                  </p>
                  <textarea
                    id="agent-prompt"
                    value={agentPrompt}
                    onChange={(e) => setAgentPrompt(e.target.value)}
                    placeholder="e.g., You are a team lead who is shy and introverted. You're not meeting expectations and have been dealing with unclear directions..."
                    className="w-full resize-none border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={6}
                  />
                </div>

                {/* Feedback Areas */}
                <div>
                  <label htmlFor="feedback-areas" className="block text-sm font-semibold text-gray-700 mb-2">
                    Specific Areas for Feedback
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Specify what aspects of your communication you'd like the AI to focus on when providing feedback. Add multiple areas to get targeted evaluation.
                  </p>
                  
                  {/* Existing feedback areas */}
                  {feedbackAreas.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {feedbackAreas.map((area) => (
                        <span
                          key={area}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {area}
                          <button
                            type="button"
                            onClick={() => handleRemoveFeedbackArea(area)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Add new feedback area */}
                  <div className="flex space-x-2">
                    <input
                      id="feedback-areas"
                      type="text"
                      value={feedbackAreaInput}
                      onChange={(e) => setFeedbackAreaInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddFeedbackArea()
                        }
                      }}
                      placeholder="e.g., Active listening, Empathy, Clear communication..."
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleAddFeedbackArea}
                      disabled={!feedbackAreaInput.trim() || feedbackAreas.includes(feedbackAreaInput.trim())}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4 border-t">
                  <button
                    onClick={handleStartConversationFromSetup}
                    disabled={!scenarioDescription.trim() || !agentPrompt.trim()}
                    className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Start Conversation
                  </button>
                  <button
                    onClick={() => {
                      setScenarioDescription(defaultScenarioDescription)
                      setAgentPrompt(testPrompt)
                      setFeedbackAreas(['Communication clarity', 'Active listening', 'Empathy'])
                    }}
                    className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Reset to Defaults
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                onClick={handleTryConversationAgain}
                className="flex-1 bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors font-medium"
              >
                Try This Conversation Again
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
      {!showSummary && !showSetupScreen && (
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
      {!showSummary && !showSetupScreen && (
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