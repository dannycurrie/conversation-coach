export interface EvaluationResult {
  score: number
  feedback: string
  strengths: string[]
  improvements: string[]
}

export interface ConversationTranscript {
  messages: Array<{
    speaker: 'user' | 'agent'
    text: string
    timestamp: Date
  }>
  context: string
  duration: string
}

const apiKey = import.meta.env.VITE_OPENAI_API_KEY

export async function evaluateConversation(
  transcript: ConversationTranscript,
  scenarioDescription: string,
): Promise<EvaluationResult> {
  return evaluateWithOpenAI(transcript, scenarioDescription)
}

async function evaluateWithOpenAI(
  transcript: ConversationTranscript,
  scenarioDescription: string,
): Promise<EvaluationResult> {

    if (!apiKey) {
      throw new Error('OpenAI API key is not set')
    }

    const prompt = `
You are an expert communication and leadership coach. Please evaluate this conversation transcript and provide detailed feedback for the leader. You are given a scenario description of the conversation and a transcript of the conversation - evaluate how well the leader is performaing relative to the stated goal of the conversation.

SCENARIO DESCRIPTION:
${scenarioDescription}

TRANSCRIPT:
${transcript.messages.map(msg => `${msg.speaker === 'user' ? 'You' : 'Agent'}: ${msg.text}`).join('\n')}

Please provide:
1. Overall score (1-10)
2. Detailed feedback on communication skills
3. 3-5 specific strengths demonstrated
4. 3-5 areas for improvement
5. Specific suggestions for better conversation management

Format your response as JSON:
{
  "score": number,
  "feedback": "detailed feedback text",
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"]
}
`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert communication coach. Analyze conversation transcripts and provide detailed feedback on communication skills.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
    }),
  })

  const data = await response.json()
  const content = data.choices[0].message.content
  console.log('Evaluation response:', content)
  try {
    return JSON.parse(content)
  } catch (error) {
    console.error('Error parsing evaluation response:', error)
    throw new Error('Failed to parse evaluation response', { cause: error })
  }
}