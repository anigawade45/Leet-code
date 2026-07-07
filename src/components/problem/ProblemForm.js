'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Search, X, Image as ImageIcon, Loader2 } from 'lucide-react'

const DEFAULT_LANGUAGES = [
  { key: 'javascript', label: 'JavaScript', defaultCode: 'function solve(input) {\n\n}' },
  { key: 'python', label: 'Python', defaultCode: 'def solve(input):\n    pass' },
  { key: 'java', label: 'Java', defaultCode: 'class Solution {\n    public static void solve(String input) {\n\n    }\n}' },
  { key: 'cpp', label: 'C++', defaultCode: '#include <bits/stdc++.h>\nusing namespace std;\n\nvoid solve(string input) {\n\n}' },
  { key: 'c', label: 'C', defaultCode: '#include <stdio.h>\n\nvoid solve(char input[]) {\n\n}' },
]

const ALL_LANGUAGES = [...DEFAULT_LANGUAGES]

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function ProblemForm({ initialData = null }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingExampleImage, setUploadingExampleImage] = useState(null) // stores index of example being uploaded

  const handleImageUpload = async (file) => {
    if (!file) return null
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      return data.url
    } catch (err) {
      toast.error('Failed to upload image')
      return null
    }
  }

  // Basic fields
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [difficulty, setDifficulty] = useState(initialData?.difficulty || 'EASY')
  const [category, setCategory] = useState(initialData?.category || 'ALGORITHMS')
  const [constraints, setConstraints] = useState(initialData?.constraints || '')

  // Hints
  const [hints, setHints] = useState(initialData?.hints || [''])

  // Editorial
  const [approaches, setApproaches] = useState(() => {
    if (initialData?.editorial?.approaches) {
      const arr = initialData.editorial.approaches
      return typeof arr === 'string' ? JSON.parse(arr) : arr
    }
    return [{ title: '', algorithm: '', implementation: '', timeComplexity: '', spaceComplexity: '' }]
  })

  // Examples — dynamic list
  const [examples, setExamples] = useState(
    initialData?.examples
      ? (typeof initialData.examples === 'string'
          ? JSON.parse(initialData.examples)
          : initialData.examples)
      : [{ input: '', output: '', explanation: '' }]
  )

  // Starter Code — per-language editors
  const [starterCode, setStarterCode] = useState(() => {
    if (initialData?.starterCode) {
      const sc = typeof initialData.starterCode === 'string'
        ? JSON.parse(initialData.starterCode)
        : initialData.starterCode
      return Object.entries(sc).map(([key, code]) => ({ key, code }))
    }
    return DEFAULT_LANGUAGES.map((l) => ({ key: l.key, code: l.defaultCode }))
  })

  // Reference Solutions
  const [solutionCode, setSolutionCode] = useState(() => {
    if (initialData?.solutionCode) {
      const sc = typeof initialData.solutionCode === 'string'
        ? JSON.parse(initialData.solutionCode)
        : initialData.solutionCode
      return Object.entries(sc).map(([key, code]) => ({ key, code }))
    }
    return DEFAULT_LANGUAGES.map((l) => ({ key: l.key, code: '' }))
  })

  // Test Cases — dynamic list
  const [testCases, setTestCases] = useState(
    initialData?.testCases || [{ input: '', output: '', isHidden: false }]
  )

  // Tags
  const [availableTags, setAvailableTags] = useState([])
  const [selectedTags, setSelectedTags] = useState(
    initialData?.tags?.map((t) => t.tagId) || []
  )
  const [tagSearch, setTagSearch] = useState('')

  // Companies
  const [availableCompanies, setAvailableCompanies] = useState([])
  const [selectedCompanies, setSelectedCompanies] = useState(
    initialData?.companies?.map((c) => c.companyId) || []
  )
  const [companySearch, setCompanySearch] = useState('')

  useEffect(() => {
    fetch('/api/tags')
      .then((res) => res.json())
      .then((data) => {
        if (data.tags) {
          setAvailableTags(data.tags)
        }
      })
      .catch((err) => console.error('Failed to fetch tags', err))

    fetch('/api/companies')
      .then((res) => res.json())
      .then((data) => {
        if (data.companies) {
          setAvailableCompanies(data.companies)
        }
      })
      .catch((err) => console.error('Failed to fetch companies', err))
  }, [])

  const filteredTags = useMemo(() => {
    if (!tagSearch) return availableTags
    return availableTags.filter((t) =>
      t.name.toLowerCase().includes(tagSearch.toLowerCase())
    )
  }, [availableTags, tagSearch])

  const toggleTag = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    )
  }

  const filteredCompanies = useMemo(() => {
    if (!companySearch) return availableCompanies
    return availableCompanies.filter((c) =>
      c.name.toLowerCase().includes(companySearch.toLowerCase())
    )
  }, [availableCompanies, companySearch])

  const toggleCompany = (companyId) => {
    setSelectedCompanies((prev) =>
      prev.includes(companyId)
        ? prev.filter((id) => id !== companyId)
        : [...prev, companyId]
    )
  }

  // Auto-generated slug
  const slug = useMemo(() => generateSlug(title), [title])

  // ===== Examples Handlers =====
  const addExample = () => {
    setExamples([...examples, { input: '', output: '', explanation: '' }])
  }

  const removeExample = (index) => {
    if (examples.length <= 1) return
    setExamples(examples.filter((_, i) => i !== index))
  }

  const updateExample = (index, field, value) => {
    const updated = [...examples]
    updated[index] = { ...updated[index], [field]: value }
    setExamples(updated)
  }

  // ===== Starter Code Handlers =====
  const updateStarterCode = (index, code) => {
    const updated = [...starterCode]
    updated[index] = { ...updated[index], code }
    setStarterCode(updated)
  }

  const updateSolutionCode = (index, code) => {
    const updated = [...solutionCode]
    updated[index] = { ...updated[index], code }
    setSolutionCode(updated)
  }

  const removeLanguage = (index) => {
    if (starterCode.length <= 1) return
    setStarterCode(starterCode.filter((_, i) => i !== index))
  }

  const addLanguage = (langKey) => {
    const lang = ALL_LANGUAGES.find((l) => l.key === langKey)
    if (!lang) return
    if (starterCode.some((s) => s.key === langKey)) return
    setStarterCode([...starterCode, { key: lang.key, code: lang.defaultCode }])
  }

  const availableLanguages = ALL_LANGUAGES.filter(
    (l) => !starterCode.some((s) => s.key === l.key)
  )

  const getLangLabel = (key) => {
    return ALL_LANGUAGES.find((l) => l.key === key)?.label || key
  }

  // ===== Test Cases Handlers =====
  const visibleCount = testCases.filter(tc => !tc.isHidden).length

  const addTestCase = () => {
    setTestCases([...testCases, { input: '', output: '', isHidden: false }])
  }

  const toggleHidden = (index) => {
    const tc = testCases[index]
    const willBeVisible = tc.isHidden // currently hidden, toggling to visible
    if (willBeVisible && visibleCount >= 8) {
      toast.error('Maximum 8 test cases can be non-hidden (visible).')
      return
    }
    const updated = [...testCases]
    updated[index] = { ...updated[index], isHidden: !tc.isHidden }
    setTestCases(updated)
  }

  const removeTestCase = (index) => {
    if (testCases.length <= 1) return
    setTestCases(testCases.filter((_, i) => i !== index))
  }

  const updateTestCase = (index, field, value) => {
    const updated = [...testCases]
    updated[index] = { ...updated[index], [field]: value }
    setTestCases(updated)
  }

  // ===== Submit =====
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate
      if (!title.trim()) {
        toast.error('Title is required')
        setLoading(false)
        return
      }
      if (!description.trim()) {
        toast.error('Description is required')
        setLoading(false)
        return
      }

      // Build starterCode JSON object
      const starterCodeObj = {}
      for (const sc of starterCode) {
        starterCodeObj[sc.key] = sc.code
      }

      // Build solutionCode JSON object
      const solutionCodeObj = {}
      for (const sc of solutionCode) {
        if (sc.code && sc.code.trim()) {
          solutionCodeObj[sc.key] = sc.code
        }
      }

      // Filter out empty examples
      const validExamples = examples.filter((ex) => ex.input.trim() || ex.output.trim())
      if (validExamples.length === 0) {
        toast.error('At least one example is required')
        setLoading(false)
        return
      }

      // Filter out empty test cases
      const validTestCases = testCases.filter((tc) => tc.input.trim() || tc.output.trim())

      // Filter out empty approaches
      const validApproaches = approaches.filter((app) => 
        app.title.trim() || app.algorithm.trim() || app.implementation.trim()
      ).map(app => ({
        title: app.title.trim(),
        algorithm: app.algorithm.trim(),
        implementation: app.implementation.trim(),
        timeComplexity: app.timeComplexity.trim(),
        spaceComplexity: app.spaceComplexity.trim()
      }))

      // Filter out empty hints
      const validHints = hints.filter((h) => h.trim())

      const data = {
        title: title.trim(),
        description: description.trim(),
        difficulty,
        category,
        constraints: constraints.trim(),
        examples: validExamples,
        starterCode: starterCodeObj,
        solutionCode: solutionCodeObj,
        testCases: validTestCases,
        tagIds: selectedTags,
        companyIds: selectedCompanies,
        editorialApproaches: validApproaches.length > 0 ? validApproaches : undefined,
        hints: validHints,
      }

      let response
      if (initialData) {
        response = await fetch(`/api/problems/${initialData.slug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
      } else {
        response = await fetch('/api/problems', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
      }

      if (response.ok) {
        const result = await response.json()
        toast.success(initialData ? 'Problem updated successfully!' : 'Problem created successfully!')
        router.push(`/problems/${result.problem.slug}`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save problem')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to save problem')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-4 py-2.5 bg-[#2a2e35] border border-border rounded-lg text-white focus:outline-none focus:border-[#2a9d8f] focus:ring-1 focus:ring-[#2a9d8f]/30 transition-all duration-200 placeholder-[#72767d]'
  const labelClass = 'block text-muted-foreground text-sm font-semibold mb-2'
  const sectionClass =
    'rounded-xl border border-border/50 bg-[#212121] p-6'

  return (
    <div className="p-6 max-w-4xl mx-auto pb-20">
      <h1
        className="text-2xl font-bold text-white mb-2"
        style={{ fontFamily: 'Typo Round' }}
      >
        {initialData ? 'Edit Problem' : 'Create Problem'}
      </h1>
      <p className="text-[#72767d] text-sm mb-8">
        Fill in the details below to {initialData ? 'update the' : 'create a new'} coding problem.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ===== Basic Information ===== */}
        <div className={sectionClass}>
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#2a9d8f]/10 flex items-center justify-center text-sm">📝</span>
            Basic Information
          </h2>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className={labelClass}>
                Title <span className="text-[#ef4444]">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
                placeholder="e.g., Two Sum"
                required
              />
            </div>

            {/* Slug */}
            {title && (
              <div>
                <label className={labelClass}>Slug (Auto Generated)</label>
                <div className="px-4 py-2.5 bg-background border border-border/50 rounded-lg text-[#72767d] font-mono text-sm">
                  {slug || '—'}
                </div>
              </div>
            )}

            {/* Difficulty */}
            <div>
              <label className={labelClass}>
                Difficulty <span className="text-[#ef4444]">*</span>
              </label>
              <div className="flex gap-3">
                {[
                  { value: 'EASY', label: 'Easy', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
                  { value: 'MEDIUM', label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                  { value: 'HARD', label: 'Hard', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
                ].map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDifficulty(d.value)}
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 border"
                    style={{
                      backgroundColor: difficulty === d.value ? d.bg : 'transparent',
                      borderColor: difficulty === d.value ? d.color : '#3e424a',
                      color: difficulty === d.value ? d.color : '#72767d',
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className={labelClass}>
                Category <span className="text-[#ef4444]">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClass}
                required
              >
                <option value="ALGORITHMS">Algorithms</option>
                <option value="DATABASE">Database</option>
                <option value="SHELL">Shell</option>
                <option value="CONCURRENCY">Concurrency</option>
                <option value="JAVASCRIPT">JavaScript</option>
                <option value="PANDAS">Pandas</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-muted-foreground text-sm font-semibold">
                  Description <span className="text-[#ef4444]">*</span>
                </label>
                <label className="cursor-pointer text-xs font-semibold px-3 py-1.5 bg-card text-[#e6e6e6] rounded hover:bg-[#333] transition-colors flex items-center gap-2 border border-border/30">
                  {uploadingImage ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                  <span>Upload Image</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    disabled={uploadingImage}
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setUploadingImage(true)
                      const url = await handleImageUpload(file)
                      setUploadingImage(false)
                      if (url) {
                        setDescription(prev => prev + `\n![Image](${url})\n`)
                      }
                      e.target.value = ''
                    }}
                  />
                </label>
              </div>
              <textarea
                rows={8}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputClass}
                placeholder="Describe the problem in detail..."
                required
              />
              <p className="text-[#72767d] text-xs mt-1.5">Supports Markdown, including images: <code>![alt text](https://image.url)</code></p>
            </div>

            {/* Constraints */}
            <div>
              <label className={labelClass}>Constraints</label>
              <textarea
                rows={4}
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                className={inputClass}
                placeholder={'1 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9'}
              />
              <p className="text-[#72767d] text-xs mt-1.5">One constraint per line</p>
            </div>

            {/* Hints */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className={labelClass}>Hints</label>
                <button
                  type="button"
                  onClick={() => setHints([...hints, ''])}
                  className="text-xs font-semibold px-3 py-1.5 bg-[#2a9d8f] text-white rounded hover:bg-[#21867a] transition-colors"
                >
                  + Add Hint
                </button>
              </div>
              <div className="space-y-4">
                {hints.map((hint, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex-1">
                      <textarea
                        rows={2}
                        value={hint}
                        onChange={(e) => {
                          const newHints = [...hints];
                          newHints[index] = e.target.value;
                          setHints(newHints);
                        }}
                        className={inputClass}
                        placeholder={`Hint ${index + 1}...`}
                      />
                    </div>
                    {hints.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setHints(hints.filter((_, i) => i !== index))}
                        className="text-[#ef4444] hover:text-[#ef4444]/80 p-2 mt-2"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Editorial Approaches */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className={labelClass}>Editorial Approaches</label>
                <button
                  type="button"
                  onClick={() => setApproaches([...approaches, { title: '', algorithm: '', implementation: '', timeComplexity: '', spaceComplexity: '' }])}
                  className="text-xs font-semibold px-3 py-1.5 bg-[#2a9d8f] text-white rounded hover:bg-[#21867a] transition-colors"
                >
                  + Add Approach
                </button>
              </div>
              <div className="space-y-6">
                {approaches.map((app, index) => (
                  <div key={index} className="p-4 border border-border/30 bg-[#1e1e1e] rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white">Approach {index + 1}</h4>
                      {approaches.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setApproaches(approaches.filter((_, i) => i !== index))}
                          className="text-[#ef4444] hover:text-[#ef4444]/80 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    
                    <div>
                      <input
                        type="text"
                        value={app.title}
                        onChange={(e) => {
                          const newApp = [...approaches];
                          newApp[index].title = e.target.value;
                          setApproaches(newApp);
                        }}
                        className={inputClass}
                        placeholder="Approach Title (e.g. Brute Force)"
                      />
                    </div>
                    
                    <div>
                      <textarea
                        rows={3}
                        value={app.algorithm}
                        onChange={(e) => {
                          const newApp = [...approaches];
                          newApp[index].algorithm = e.target.value;
                          setApproaches(newApp);
                        }}
                        className={inputClass}
                        placeholder="Algorithm explanation..."
                      />
                    </div>

                    <div>
                      <textarea
                        rows={4}
                        value={app.implementation}
                        onChange={(e) => {
                          const newApp = [...approaches];
                          newApp[index].implementation = e.target.value;
                          setApproaches(newApp);
                        }}
                        className={`${inputClass} font-mono text-xs`}
                        placeholder="Implementation code block..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input
                          type="text"
                          value={app.timeComplexity}
                          onChange={(e) => {
                            const newApp = [...approaches];
                            newApp[index].timeComplexity = e.target.value;
                            setApproaches(newApp);
                          }}
                          className={inputClass}
                          placeholder="Time Complexity (e.g. O(N))"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={app.spaceComplexity}
                          onChange={(e) => {
                            const newApp = [...approaches];
                            newApp[index].spaceComplexity = e.target.value;
                            setApproaches(newApp);
                          }}
                          className={inputClass}
                          placeholder="Space Complexity (e.g. O(1))"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className={labelClass}>Topics / Tags</label>
              <div className="p-4 rounded-lg border border-border/30 bg-[#111111]">
                <div className="flex items-center gap-2 mb-3 bg-background rounded-lg px-3 py-2 border border-border/30">
                  <Search size={14} className="text-[#4a5060]" />
                  <input
                    type="text"
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    placeholder="Search topics..."
                    className="bg-transparent border-none outline-none text-sm text-[#e0e0e0] placeholder-[#4a5060] w-full"
                  />
                  {tagSearch && (
                    <button type="button" onClick={() => setTagSearch('')}>
                      <X size={14} className="text-[#4a5060] hover:text-white" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin">
                  {filteredTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag.id)
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          isSelected
                            ? 'bg-[#2a9d8f] border-[#2a9d8f] text-white'
                            : 'bg-background border-border text-muted-foreground hover:border-[#4a5060] hover:text-white'
                        }`}
                      >
                        {tag.name}
                      </button>
                    )
                  })}
                  {filteredTags.length === 0 && (
                    <p className="text-xs text-[#72767d]">No topics found.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Companies */}
            <div>
              <label className={labelClass}>Companies</label>
              <div className="p-4 rounded-lg border border-border/30 bg-[#111111]">
                <div className="flex items-center gap-2 mb-3 bg-background rounded-lg px-3 py-2 border border-border/30">
                  <Search size={14} className="text-[#4a5060]" />
                  <input
                    type="text"
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    placeholder="Search companies..."
                    className="bg-transparent border-none outline-none text-sm text-[#e0e0e0] placeholder-[#4a5060] w-full"
                  />
                  {companySearch && (
                    <button type="button" onClick={() => setCompanySearch('')}>
                      <X size={14} className="text-[#4a5060] hover:text-white" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin">
                  {filteredCompanies.map((company) => {
                    const isSelected = selectedCompanies.includes(company.id)
                    return (
                      <button
                        key={company.id}
                        type="button"
                        onClick={() => toggleCompany(company.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          isSelected
                            ? 'bg-[#d19c4c] border-[#d19c4c] text-white'
                            : 'bg-background border-border text-muted-foreground hover:border-[#4a5060] hover:text-white'
                        }`}
                      >
                        {company.name}
                      </button>
                    )
                  })}
                  {filteredCompanies.length === 0 && (
                    <p className="text-xs text-[#72767d]">No companies found.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Examples ===== */}
        <div className={sectionClass}>
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center text-sm">💡</span>
            Examples
          </h2>

          <div className="space-y-4">
            {examples.map((example, i) => (
              <div
                key={i}
                className="p-4 rounded-lg border border-border/30 bg-background space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-semibold">Example {i + 1}</span>
                  {examples.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExample(i)}
                      className="text-xs text-[#ef4444] hover:text-[#f87171] transition-colors px-2 py-1 rounded hover:bg-[#ef4444]/10"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#72767d] text-xs mb-1">Input</label>
                    <input
                      type="text"
                      value={example.input}
                      onChange={(e) => updateExample(i, 'input', e.target.value)}
                      className={inputClass}
                      placeholder='nums = [2,7,11,15], target = 9'
                    />
                  </div>
                  <div>
                    <label className="block text-[#72767d] text-xs mb-1">Output</label>
                    <input
                      type="text"
                      value={example.output}
                      onChange={(e) => updateExample(i, 'output', e.target.value)}
                      className={inputClass}
                      placeholder='[0,1]'
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[#72767d] text-xs mb-1">Image (Optional)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={example.image || ''}
                      onChange={(e) => updateExample(i, 'image', e.target.value)}
                      className={inputClass}
                      placeholder='https://example.com/image.png'
                    />
                    <label className="cursor-pointer shrink-0 text-xs font-semibold px-3 py-2.5 bg-card text-[#e6e6e6] rounded hover:bg-[#333] transition-colors flex items-center justify-center border border-border/30">
                      {uploadingExampleImage === i ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden"
                        disabled={uploadingExampleImage !== null}
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          setUploadingExampleImage(i)
                          const url = await handleImageUpload(file)
                          setUploadingExampleImage(null)
                          if (url) {
                            updateExample(i, 'image', url)
                          }
                          e.target.value = ''
                        }}
                      />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-[#72767d] text-xs mb-1">Explanation</label>
                  <input
                    type="text"
                    value={example.explanation || ''}
                    onChange={(e) => updateExample(i, 'explanation', e.target.value)}
                    className={inputClass}
                    placeholder='nums[0] + nums[1] = 9'
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addExample}
              className="w-full py-2.5 rounded-lg border border-dashed border-border text-[#72767d] hover:text-[#2a9d8f] hover:border-[#2a9d8f] transition-all duration-200 text-sm font-semibold"
            >
              + Add Example
            </button>
          </div>
        </div>

        {/* ===== Starter Code ===== */}
        <div className={sectionClass}>
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#2a9d8f]/10 flex items-center justify-center text-sm">💻</span>
            Starter Code
          </h2>

          <div className="space-y-4">
            {starterCode.map((sc, i) => (
              <div
                key={sc.key}
                className="rounded-lg border border-border/30 bg-background overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 bg-[#2a2e35]/50">
                  <span className="text-white text-sm font-semibold">{getLangLabel(sc.key)}</span>
                  {starterCode.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLanguage(i)}
                      className="text-xs text-[#ef4444] hover:text-[#f87171] transition-colors px-2 py-1 rounded hover:bg-[#ef4444]/10"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <textarea
                  rows={6}
                  value={sc.code}
                  onChange={(e) => updateStarterCode(i, e.target.value)}
                  className="w-full px-4 py-3 bg-background text-white focus:outline-none font-mono text-sm resize-none placeholder-[#72767d]"
                  placeholder={`// Write ${getLangLabel(sc.key)} starter code...`}
                  spellCheck={false}
                />
              </div>
            ))}

            {availableLanguages.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  id="add-language-select"
                  className="px-4 py-2.5 bg-[#2a2e35] border border-border rounded-lg text-muted-foreground focus:outline-none focus:border-[#2a9d8f] text-sm"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      addLanguage(e.target.value)
                      e.target.value = ''
                    }
                  }}
                >
                  <option value="" disabled>
                    + Add Language
                  </option>
                  {availableLanguages.map((l) => (
                    <option key={l.key} value={l.key}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* ===== Reference Solutions ===== */}
        <div className={sectionClass}>
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#34d399]/10 flex items-center justify-center text-sm">💡</span>
            Reference Solutions (Optional)
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Providing reference solutions allows the system to dynamically compute Expected Outputs for user-written custom test cases.
          </p>

          <div className="space-y-4">
            {solutionCode.map((sc, i) => (
              <div
                key={sc.key}
                className="rounded-lg border border-border/30 bg-background overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 bg-[#2a2e35]/50">
                  <span className="text-white text-sm font-semibold">{getLangLabel(sc.key)} Reference Solution</span>
                </div>
                <textarea
                  rows={6}
                  value={sc.code}
                  onChange={(e) => updateSolutionCode(i, e.target.value)}
                  className="w-full px-4 py-3 bg-background text-white focus:outline-none font-mono text-sm resize-none placeholder-[#72767d]"
                  placeholder={`// Write correct reference solution code for ${getLangLabel(sc.key)}...`}
                  spellCheck={false}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ===== Test Cases ===== */}
        <div className={sectionClass}>
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center text-sm">🧪</span>
            Test Cases
          </h2>

          <div className="space-y-4">
            {testCases.map((tc, i) => (
              <div
                key={i}
                className="p-4 rounded-lg border border-border/30 bg-background space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-semibold">Test Case {i + 1}</span>
                  <div className="flex items-center gap-3">
                    {/* Hidden toggle */}
                    <button
                      type="button"
                      onClick={() => toggleHidden(i)}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md transition-all duration-200 ${
                        tc.isHidden
                          ? 'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20'
                          : 'bg-muted/20 text-[#72767d] border border-border/30'
                      }`}
                    >
                      {tc.isHidden ? '🔒 Hidden' : '👁️ Visible'}
                    </button>
                    {testCases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTestCase(i)}
                        className="text-xs text-[#ef4444] hover:text-[#f87171] transition-colors px-2 py-1 rounded hover:bg-[#ef4444]/10"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#72767d] text-xs mb-1">Input</label>
                    <textarea
                      rows={2}
                      value={tc.input}
                      onChange={(e) => updateTestCase(i, 'input', e.target.value)}
                      className={`${inputClass} font-mono text-sm`}
                      placeholder='[2,7,11,15]\n9'
                    />
                  </div>
                  <div>
                    <label className="block text-[#72767d] text-xs mb-1">Output</label>
                    <textarea
                      rows={2}
                      value={tc.output}
                      onChange={(e) => updateTestCase(i, 'output', e.target.value)}
                      className={`${inputClass} font-mono text-sm`}
                      placeholder='[0,1]'
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={addTestCase}
                className="flex-1 py-2.5 rounded-lg border border-dashed border-border text-[#72767d] hover:text-[#2a9d8f] hover:border-[#2a9d8f] transition-all duration-200 text-sm font-semibold"
              >
                + Add Test Case
              </button>
            </div>
            <p className="text-[#72767d] text-xs">
              {visibleCount}/8 visible · {testCases.length - visibleCount} hidden
            </p>
          </div>
        </div>

        {/* ===== Submit ===== */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-[#2a9d8f] to-[#1a7a6e] hover:from-[#34b8a8] hover:to-[#2a9d8f] rounded-lg text-white font-semibold transition-all duration-200 shadow-lg shadow-[#2a9d8f]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Saving...'
              : initialData
              ? 'Update Problem'
              : 'Create Problem'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 rounded-lg text-[#72767d] hover:text-white border border-border hover:border-[#72767d] transition-all duration-200 font-semibold"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
