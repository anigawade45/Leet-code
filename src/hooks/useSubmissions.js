import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export function useSubmissions(problem, initialSubmissions, initialSubmissionDetail, user, activeLeftTab, setActiveEditorTab) {
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [submissionDetailView, setSubmissionDetailView] = useState(initialSubmissionDetail)
  const [submissionTestResults, setSubmissionTestResults] = useState(null)
  const [unlockedBadges, setUnlockedBadges] = useState([])
  const [submissionTestLoading, setSubmissionTestLoading] = useState(false)
  
  const [analysisData, setAnalysisData] = useState(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)

  // Fetch real submission data when opening the submissions tab
  useEffect(() => {
    if (activeLeftTab === 'submissions' && user) {
      setSubmissionsLoading(true)
      fetch(`/api/submissions?problemId=${problem.id}`)
        .then(res => {
          if (res.ok) return res.json()
          return null
        })
        .then(data => {
          if (data && data.success) {
            setSubmissions(data.submissions || [])
          }
        })
        .catch(console.error)
        .finally(() => {
          setSubmissionsLoading(false)
        })
    }
  }, [activeLeftTab, problem.id, user])

  // Fetch AI Analysis when viewing an accepted submission
  useEffect(() => {
    if (submissionDetailView?.id && submissionDetailView?.status === 'ACCEPTED') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnalysisData(null)
      fetch(`/api/submissions/${submissionDetailView.id}/analysis`)
        .then(res => {
          if (res.ok) return res.json()
          return null
        })
        .then(data => {
          if (data && !data.error) setAnalysisData(data.analysis || data)
        })
        .catch(console.error)
    } else {
      setAnalysisData(null)
    }
  }, [submissionDetailView])

  const handleGenerateAnalysis = async () => {
    if (!submissionDetailView) return
    setAnalysisLoading(true)
    try {
      const res = await fetch(`/api/submissions/${submissionDetailView.id}/analysis`, {
        method: 'POST'
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to generate analysis')
        return
      }
      setAnalysisData(data.analysis || data)
      toast.success('AI Analysis generated successfully!')
    } catch (err) {
      toast.error('Failed to generate analysis')
    } finally {
      setAnalysisLoading(false)
    }
  }

  const openSubmissionDetail = async (sub, options = {}) => {
    setSubmissionDetailView(sub)
    if (setActiveEditorTab) setActiveEditorTab('submission')
    setSubmissionTestLoading(true)
    setSubmissionTestResults(null)
    try {
      const res = await fetch(`/api/submissions/${sub.id}`)
      if (res.ok) {
        const data = await res.json()
        if (data.submission) {
          setSubmissionDetailView(data.submission)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSubmissionTestLoading(false)
    }
  }

  return {
    submissions,
    setSubmissions,
    submissionsLoading,
    submissionDetailView,
    setSubmissionDetailView,
    submissionTestResults,
    setSubmissionTestResults,
    unlockedBadges,
    setUnlockedBadges,
    submissionTestLoading,
    analysisData,
    setAnalysisData,
    analysisLoading,
    handleGenerateAnalysis,
    openSubmissionDetail
  }
}
