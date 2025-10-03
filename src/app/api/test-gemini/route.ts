import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function GET() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
    
    const result = await model.generateContent('Hello, please respond with "API is working" if you can read this message.')
    const response = await result.response
    const text = response.text()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Google Gemini API is working correctly',
      response: text 
    })
  } catch (error) {
    console.error('Gemini API test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error 
    }, { status: 500 })
  }
}