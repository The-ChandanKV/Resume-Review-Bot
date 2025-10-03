import { NextRequest, NextResponse } from 'next/server'
import PDFParser from 'pdf2json'
import ZAI from 'z-ai-web-dev-sdk'

// Define interfaces for the PDF data structure
interface PdfText {
  R: { T: string }[]
}

interface PdfPage {
  Texts: PdfText[]
}

interface PdfData {
  Pages: PdfPage[]
}

interface ResumeReview {
  overallScore: number
  strengths: string[]
  improvements: string[]
  suggestions: string[]
  keywords: string[]
  formatFeedback: string
}

// Helper function to extract text from PDF
async function extractTextFromPDF(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser()
    
    pdfParser.on('pdfParser_dataError', (errData) => {
            const error = 'parserError' in errData ? errData.parserError : errData;
      reject(new Error(`PDF parsing error: ${error.message}`))
    })
    
        pdfParser.on('pdfParser_dataReady', (pdfData: PdfData) => {
      try {
                // Extract text from all pages
        const text = pdfData.Pages.map((page) => {
          return page.Texts.map((text) => {
            return decodeURIComponent(text.R[0].T)
          }).join(' ')
        }).join('\n')
        resolve(text)
      } catch (error) {
        reject(new Error('Failed to extract text from PDF'))
      }
    })
    
    // Convert File to Buffer and parse
    const arrayBuffer = file.arrayBuffer()
    arrayBuffer.then(buffer => {
      pdfParser.parseBuffer(Buffer.from(buffer))
    }).catch(reject)
  })
}

export async function POST(request: NextRequest) {
  try {
    let resumeText = ''
    let file = null

    // Check if the request is FormData or JSON
    const contentType = request.headers.get('content-type')
    
    if (contentType && contentType.includes('multipart/form-data')) {
      // Handle FormData (file upload)
      const formData = await request.formData()
      file = formData.get('file') as File | null
      resumeText = formData.get('text') as string

      // If file is provided, extract text from it
      if (file) {
        try {
          if (file.type === 'text/plain') {
            const fileText = await file.text()
            resumeText = fileText
          } else if (file.type === 'application/pdf') {
            // Extract text from PDF
            resumeText = await extractTextFromPDF(file)
          } else {
            return NextResponse.json(
              { error: 'Unsupported file type. Please upload PDF or TXT files only.' },
              { status: 400 }
            )
          }
        } catch (fileError) {
          console.error('File processing error:', fileError)
          return NextResponse.json(
            { error: 'Failed to process file. Please try again or paste the text directly.' },
            { status: 400 }
          )
        }
      }
    } else {
      // Handle JSON request
      const body = await request.json()
      resumeText = body.text || ''
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Please provide sufficient resume text (at least 50 characters). The uploaded file may be empty or corrupted.' },
        { status: 400 }
      )
    }

    // Clean and prepare the resume text
    const cleanedResumeText = resumeText
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n\n')  // Replace multiple newlines with double newline
      .trim()

    // Use ZAI for resume analysis
    const zai = await ZAI.create()

    const prompt = `You are an expert resume reviewer and career coach with extensive experience in recruitment and HR. Please analyze the following resume and provide detailed, constructive feedback.

Resume Text:
${cleanedResumeText}

Please provide a comprehensive analysis in the following JSON format only. Do not include any other text before or after the JSON:
{
  "overallScore": <number from 0-100>,
  "strengths": [<array of 3-5 specific, actionable strengths>],
  "improvements": [<array of 3-5 specific areas for improvement>],
  "suggestions": [<array of 3-5 actionable suggestions>],
  "keywords": [<array of 5-10 key skills/keywords found>],
  "formatFeedback": "<specific feedback about format and structure>"
}

Evaluation Criteria:
- Content Quality: Relevance, clarity, and impact of information
- Structure: Organization, flow, and readability
- Skills: Technical and soft skills presentation
- Experience: Achievement quantification and impact
- Keywords: ATS optimization and industry relevance
- Overall: Professional presentation and completeness

Be specific, constructive, and provide actionable feedback. Focus on helping the candidate improve their resume for better job prospects.`

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert resume reviewer and career coach.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    const responseText = completion.choices[0]?.message?.content || ''

    // Extract JSON from the response
    let review: ResumeReview
    try {
      // Clean the response text to extract JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        review = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      console.error('Raw response:', responseText)
      
      // Fallback review if parsing fails
      review = {
        overallScore: 70,
        strengths: ['Resume provides basic information', 'Some work experience listed'],
        improvements: ['Consider adding more specific achievements', 'Improve formatting and structure'],
        suggestions: ['Add quantifiable results', 'Include relevant keywords for your industry'],
        keywords: ['professional', 'experience', 'skills'],
        formatFeedback: 'Resume could benefit from better organization and clearer section headings.'
      }
    }

    // Validate and sanitize the review data
    review.overallScore = Math.max(0, Math.min(100, review.overallScore || 70))
    review.strengths = Array.isArray(review.strengths) ? review.strengths.slice(0, 5).filter(s => s && s.trim()) : []
    review.improvements = Array.isArray(review.improvements) ? review.improvements.slice(0, 5).filter(i => i && i.trim()) : []
    review.suggestions = Array.isArray(review.suggestions) ? review.suggestions.slice(0, 5).filter(s => s && s.trim()) : []
    review.keywords = Array.isArray(review.keywords) ? review.keywords.slice(0, 10).filter(k => k && k.trim()) : []
    review.formatFeedback = review.formatFeedback || 'No specific format feedback provided.'

    return NextResponse.json(review)
  } catch (error) {
    console.error('Resume review error:', error)
    
    // Check if it's an API error
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = error.message as string
      if (errorMessage.includes('API_KEY') || errorMessage.includes('UNAUTHORIZED')) {
        return NextResponse.json(
          { error: 'API key configuration error. Please check your API configuration and try again.' },
          { status: 500 }
        )
      }
      if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
        return NextResponse.json(
          { error: 'API quota exceeded. Please try again later.' },
          { status: 429 }
        )
      }
    }
    
    // Return a fallback response if there's an error
    const fallbackReview: ResumeReview = {
      overallScore: 65,
      strengths: ['Resume submitted for review', 'Basic structure present'],
      improvements: ['Unable to complete full analysis', 'Please try again later'],
      suggestions: ['Check your internet connection', 'Ensure resume text is properly formatted'],
      keywords: ['resume', 'professional', 'analysis'],
      formatFeedback: 'Resume format could not be fully analyzed due to technical issues.'
    }

    return NextResponse.json(fallbackReview)
  }
}