'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileText, Sparkles, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ResumeReview {
  overallScore: number
  strengths: string[]
  improvements: string[]
  suggestions: string[]
  keywords: string[]
  formatFeedback: string
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [resumeText, setResumeText] = useState('')
  const [review, setReview] = useState<ResumeReview | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      // Check file size (10MB limit)
      const maxSize = 10 * 1024 * 1024 // 10MB in bytes
      if (selectedFile.size > maxSize) {
        setError('File size must be less than 10MB')
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB.",
          variant: "destructive",
        })
        return
      }

      // Check file type
      if (selectedFile.type === 'application/pdf' || selectedFile.type === 'text/plain') {
        setFile(selectedFile)
        setError(null)
        
        // For demo purposes, we'll simulate reading the file
        const reader = new FileReader()
        reader.onload = (e) => {
          const text = e.target?.result as string
          setResumeText(text.substring(0, 2000)) // Limit text for demo
        }
        reader.readAsText(selectedFile)
        
        toast({
          title: "File uploaded successfully",
          description: `${selectedFile.name} has been uploaded for review.`,
        })
      } else {
        setError('Please upload a PDF or TXT file')
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or TXT file.",
          variant: "destructive",
        })
      }
    }
  }

  const handleAnalyze = async () => {
    if (!file && !resumeText.trim()) {
      setError('Please upload a file or enter resume text')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const formData = new FormData()
      if (file) {
        formData.append('file', file)
      }
      formData.append('text', resumeText)

      const response = await fetch('/api/resume-review', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze resume')
      }

      setReview(data)
      
      toast({
        title: "Analysis complete!",
        description: "Your resume has been reviewed successfully.",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze resume. Please try again.'
      setError(errorMessage)
      toast({
        title: "Analysis failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />
    if (score >= 60) return <AlertCircle className="w-5 h-5 text-yellow-600" />
    return <XCircle className="w-5 h-5 text-red-600" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-4">
            AI Resume Reviewer
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Get professional feedback on your resume using advanced AI analysis. 
            Upload your resume and receive detailed insights to improve your job prospects.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Resume
              </CardTitle>
              <CardDescription>
                Upload your resume (PDF or TXT file) or paste the text content below
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileText className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-600 dark:text-slate-300 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  PDF or TXT files only (Max 10MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {file && (
                <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <FileText className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{file.name}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Or paste resume text:
                </label>
                <Textarea
                  placeholder="Paste your resume text here..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="min-h-[200px]"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const sampleResume = `John Doe
Software Engineer
john.doe@email.com | (123) 456-7890 | linkedin.com/in/johndoe

PROFESSIONAL SUMMARY
Results-driven Software Engineer with 5+ years of experience developing scalable web applications. 
Proficient in JavaScript, React, Node.js, and cloud technologies. Passionate about creating 
user-friendly solutions and optimizing application performance.

TECHNICAL SKILLS
• Programming Languages: JavaScript, TypeScript, Python, Java
• Frontend: React, Angular, Vue.js, HTML5, CSS3, Tailwind CSS
• Backend: Node.js, Express.js, Django, Spring Boot
• Databases: MongoDB, PostgreSQL, MySQL, Redis
• Cloud: AWS, Google Cloud, Azure, Docker, Kubernetes
• Tools: Git, Jenkins, JIRA, Agile Methodologies

PROFESSIONAL EXPERIENCE
Senior Software Engineer | Tech Corp Inc. | 2021 - Present
• Led development of microservices architecture serving 1M+ users
• Improved application performance by 40% through optimization
• Mentored junior developers and conducted code reviews
• Implemented CI/CD pipelines reducing deployment time by 60%

Software Engineer | StartupXYZ | 2019 - 2021
• Developed responsive web applications using React and Node.js
• Collaborated with cross-functional teams to deliver projects on time
• Integrated third-party APIs and payment gateways
• Participated in agile development processes

EDUCATION
Bachelor of Science in Computer Science
University of Technology | 2015 - 2019
GPA: 3.8/4.0

CERTIFICATIONS
• AWS Certified Developer Associate (2022)
• Google Cloud Professional Developer (2021)`
                    setResumeText(sampleResume)
                    toast({
                      title: "Sample resume loaded",
                      description: "A sample resume has been loaded for testing.",
                    })
                  }}
                >
                  Load Sample Resume
                </Button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || (!file && !resumeText.trim())}
                className="w-full"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze Resume
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Review Results
              </CardTitle>
              <CardDescription>
                AI-powered analysis of your resume
              </CardDescription>
            </CardHeader>
            <CardContent>
              {review ? (
                <div className="space-y-6">
                  {/* Overall Score */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {getScoreIcon(review.overallScore)}
                      <span className={`text-2xl font-bold ${getScoreColor(review.overallScore)}`}>
                        {review.overallScore}/100
                      </span>
                    </div>
                    <Progress value={review.overallScore} className="w-full" />
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                      Overall Resume Score
                    </p>
                  </div>

                  {/* Keywords */}
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">
                      Key Skills & Keywords
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {review.keywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Strengths */}
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">
                      Strengths
                    </h3>
                    <ul className="space-y-2">
                      {review.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-slate-700 dark:text-slate-300">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Improvements */}
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">
                      Areas for Improvement
                    </h3>
                    <ul className="space-y-2">
                      {review.improvements.map((improvement, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-slate-700 dark:text-slate-300">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Suggestions */}
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">
                      Suggestions
                    </h3>
                    <ul className="space-y-2">
                      {review.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-slate-700 dark:text-slate-300">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Format Feedback */}
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">
                      Format & Structure
                    </h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {review.formatFeedback}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  <p className="text-slate-500 dark:text-slate-400">
                    Upload your resume to see the analysis results
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}