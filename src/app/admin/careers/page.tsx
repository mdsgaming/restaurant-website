'use client'

import { useEffect, useState } from 'react'
import {
  Briefcase,
  Plus,
  Pencil,
  Trash2,
  Mail,
  Phone,
  X,
  FileText,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getRestaurantSettings,
  updateRestaurantSettings,
  getJobPostings,
  addJobPosting,
  updateJobPosting,
  deleteJobPosting,
  getJobApplications,
  updateJobApplicationStatus,
  addAuditLog,
} from '@/lib/firestore'
import { useAuth } from '@/contexts/AuthContext'
import { formatDateTime } from '@/lib/utils'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import type { JobPosting, JobApplication, EmploymentType, ApplicationStatus, JobQuestion, QuestionType } from '@/types'

const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: 'Full-Time',
  PART_TIME: 'Part-Time',
  SEASONAL: 'Seasonal',
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  NEW: 'New',
  REVIEWED: 'Reviewed',
  CONTACTED: 'Contacted',
  REJECTED: 'Rejected',
}

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  NEW: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  REVIEWED: 'bg-blue-100 text-blue-700 border-blue-200',
  CONTACTED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  SHORT_TEXT: 'Short Answer',
  LONG_TEXT: 'Long Answer',
  MULTIPLE_CHOICE: 'Multiple Choice',
  YES_NO: 'Yes / No',
  NUMBER: 'Number',
}

function newQuestion(): JobQuestion {
  return {
    id: (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    label: '',
    type: 'SHORT_TEXT',
    required: false,
    options: [],
  }
}

const EMPTY_FORM = {
  title: '',
  department: '',
  employmentType: 'FULL_TIME' as EmploymentType,
  location: '',
  description: '',
  requirements: '',
  isActive: true,
  questions: [] as JobQuestion[],
}

export default function AdminCareersPage() {
  const { appUser } = useAuth()
  const [tab, setTab] = useState<'jobs' | 'applications'>('jobs')
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(true)
  const [togglingPage, setTogglingPage] = useState(false)
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  async function loadAll() {
    try {
      const [settings, jobPostings, apps] = await Promise.all([
        getRestaurantSettings(),
        getJobPostings(),
        getJobApplications(),
      ])
      setEnabled(settings?.careersPageEnabled !== false)
      setJobs(jobPostings)
      setApplications(apps)
    } catch (e) {
      console.error(e)
      toast.error('Failed to load careers data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  async function togglePage() {
    setTogglingPage(true)
    const next = !enabled
    try {
      await updateRestaurantSettings({ careersPageEnabled: next })
      setEnabled(next)
      toast.success(next ? 'Careers page is now visible on the site' : 'Careers page hidden from the site')
    } catch {
      toast.error('Failed to update')
    } finally {
      setTogglingPage(false)
    }
  }

  function openNewJobForm() {
    setEditingJob(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEditJobForm(job: JobPosting) {
    setEditingJob(job)
    setForm({
      title: job.title,
      department: job.department,
      employmentType: job.employmentType,
      location: job.location,
      description: job.description,
      requirements: (job.requirements || []).join('\n'),
      isActive: job.isActive,
      questions: (job.questions || []).map((q) => ({ ...q, options: q.options ? [...q.options] : [] })),
    })
    setShowForm(true)
  }

  function addQuestion() {
    setForm((f) => ({ ...f, questions: [...f.questions, newQuestion()] }))
  }

  function updateQuestion(index: number, patch: Partial<JobQuestion>) {
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    }))
  }

  function removeQuestion(index: number) {
    setForm((f) => ({ ...f, questions: f.questions.filter((_, i) => i !== index) }))
  }

  async function handleSaveJob(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('Job title is required')
      return
    }
    setSaving(true)
    try {
      const requirements = form.requirements
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean)

      const questions = form.questions
        .filter((q) => q.label.trim())
        .map((q) => ({
          ...q,
          label: q.label.trim(),
          options: q.type === 'MULTIPLE_CHOICE' ? (q.options || []).filter(Boolean) : [],
        }))

      if (editingJob) {
        await updateJobPosting(editingJob.id, {
          title: form.title.trim(),
          department: form.department.trim(),
          employmentType: form.employmentType,
          location: form.location.trim(),
          description: form.description.trim(),
          requirements,
          questions,
          isActive: form.isActive,
        })
        toast.success('Job updated')
      } else {
        await addJobPosting({
          title: form.title.trim(),
          department: form.department.trim(),
          employmentType: form.employmentType,
          location: form.location.trim(),
          description: form.description.trim(),
          requirements,
          questions,
          isActive: form.isActive,
          sortOrder: jobs.length,
        })
        toast.success('Job posted')
      }

      if (appUser) {
        await addAuditLog({
          userId: appUser.uid,
          userName: appUser.name,
          userRole: appUser.role,
          action: editingJob ? 'updated job posting' : 'created job posting',
          resource: 'jobPostings',
          details: { title: form.title },
        })
      }

      setShowForm(false)
      await loadAll()
    } catch {
      toast.error('Failed to save job')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(job: JobPosting) {
    try {
      await updateJobPosting(job.id, { isActive: !job.isActive })
      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, isActive: !j.isActive } : j)))
    } catch {
      toast.error('Failed to update job')
    }
  }

  async function handleDeleteJob(job: JobPosting) {
    if (!confirm(`Delete "${job.title}"? This can't be undone.`)) return
    try {
      await deleteJobPosting(job.id)
      setJobs((prev) => prev.filter((j) => j.id !== job.id))
      toast.success('Job deleted')
    } catch {
      toast.error('Failed to delete job')
    }
  }

  async function handleStatusChange(app: JobApplication, status: ApplicationStatus) {
    try {
      await updateJobApplicationStatus(app.id, status)
      setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, status } : a)))
    } catch {
      toast.error('Failed to update application')
    }
  }

  if (loading) return <SectionLoader />

  const newApplicationsCount = applications.filter((a) => a.status === 'NEW').length

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-3xl text-charcoal">Careers</h1>
          <p className="text-charcoal/55 mt-1 text-sm">
            Manage job postings and review applications.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white border border-charcoal/10 rounded-sm px-4 py-2.5">
          <span className="text-sm text-charcoal/70">Show Careers page on site</span>
          <button
            type="button"
            onClick={togglePage}
            disabled={togglingPage}
            className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-charcoal/20'} disabled:opacity-50`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`}
            />
          </button>
        </div>
      </div>

      {!enabled && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-sm px-4 py-3">
          The Careers page is currently hidden. The "Careers" link is removed from the site footer and the page shows a "not hiring" message.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-charcoal/10">
        <button
          type="button"
          onClick={() => setTab('jobs')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'jobs' ? 'border-charcoal text-charcoal' : 'border-transparent text-charcoal/45 hover:text-charcoal/70'
          }`}
        >
          Job Postings
        </button>
        <button
          type="button"
          onClick={() => setTab('applications')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            tab === 'applications' ? 'border-charcoal text-charcoal' : 'border-transparent text-charcoal/45 hover:text-charcoal/70'
          }`}
        >
          Applications
          {newApplicationsCount > 0 && (
            <span className="bg-gold text-charcoal text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {newApplicationsCount}
            </span>
          )}
        </button>
      </div>

      {tab === 'jobs' ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openNewJobForm}>
              <Plus className="w-4 h-4" /> Add Job
            </Button>
          </div>

          {jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Briefcase className="w-12 h-12 text-charcoal/20 mb-4" />
              <p className="text-charcoal/40 font-serif text-lg italic">No job postings yet</p>
              <p className="text-charcoal/30 text-sm mt-1">Add your first opening to start receiving applications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-sm border border-charcoal/10 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-charcoal">{job.title}</h3>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${job.isActive ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-charcoal/8 text-charcoal/50 border-charcoal/10'}`}>
                          {job.isActive ? 'Live' : 'Hidden'}
                        </span>
                        <span className="text-xs bg-charcoal/8 text-charcoal/60 px-2.5 py-1 rounded-full border border-charcoal/10">
                          {EMPLOYMENT_LABELS[job.employmentType]}
                        </span>
                      </div>
                      <p className="text-sm text-charcoal/50 mt-1">
                        {[job.department, job.location].filter(Boolean).join(' · ')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(job)}
                        className="px-3 py-1.5 text-xs font-medium border border-charcoal/20 rounded-sm hover:bg-charcoal/5 transition-colors text-charcoal/70"
                      >
                        {job.isActive ? 'Hide' : 'Publish'}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditJobForm(job)}
                        className="w-8 h-8 flex items-center justify-center border border-charcoal/20 rounded-sm hover:bg-charcoal/5 transition-colors text-charcoal/60"
                        aria-label="Edit job"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteJob(job)}
                        className="w-8 h-8 flex items-center justify-center border border-red-200 rounded-sm hover:bg-red-50 transition-colors text-red-500"
                        aria-label="Delete job"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {job.description && (
                    <p className="text-sm text-charcoal/55 mt-3 leading-relaxed line-clamp-2">{job.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Mail className="w-12 h-12 text-charcoal/20 mb-4" />
              <p className="text-charcoal/40 font-serif text-lg italic">No applications yet</p>
              <p className="text-charcoal/30 text-sm mt-1">Applications submitted through the Careers page will appear here</p>
            </div>
          ) : (
            applications.map((app) => (
              <div key={app.id} className="bg-white rounded-sm border border-charcoal/10 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-charcoal">{app.applicantName}</h3>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_COLORS[app.status]}`}>
                        {STATUS_LABELS[app.status]}
                      </span>
                    </div>
                    <p className="text-sm text-charcoal/50 mt-1">Applied for {app.jobTitle}</p>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <a href={`mailto:${app.email}`} className="inline-flex items-center gap-1.5 text-sm text-charcoal/50 hover:text-charcoal transition-colors">
                        <Mail className="w-3.5 h-3.5" /> {app.email}
                      </a>
                      <a href={`tel:${app.phone}`} className="inline-flex items-center gap-1.5 text-sm text-charcoal/50 hover:text-charcoal transition-colors">
                        <Phone className="w-3.5 h-3.5" /> {app.phone}
                      </a>
                      {app.resumeUrl && (
                        <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-gold hover:underline">
                          <FileText className="w-3.5 h-3.5" /> View Resume
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-charcoal/40">{formatDateTime(app.createdAt)}</p>
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app, e.target.value as ApplicationStatus)}
                      className="mt-2 text-xs border border-charcoal/20 rounded-sm px-2 py-1.5 text-charcoal/70 focus:outline-none focus:border-charcoal/40"
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {app.coverMessage && (
                  <p className="mt-3 text-sm text-charcoal/55 italic border-t border-charcoal/8 pt-3">
                    "{app.coverMessage}"
                  </p>
                )}
                {app.answers && app.answers.length > 0 && (
                  <div className={`space-y-2.5 ${app.coverMessage ? 'mt-3 pt-3' : 'mt-3 pt-3 border-t border-charcoal/8'}`}>
                    {app.answers.map((a, i) => (
                      <div key={i} className="text-sm">
                        <p className="text-charcoal/45 text-xs font-medium">{a.label}</p>
                        <p className="text-charcoal/70">{a.answer || '—'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Job form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-sm shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-charcoal/10">
              <h2 className="font-serif text-xl text-charcoal">{editingJob ? 'Edit Job' : 'Add Job'}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-charcoal/40 hover:text-charcoal transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveJob} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-charcoal/60 mb-1.5">Job Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Line Cook"
                  className="w-full border border-charcoal/20 rounded-sm px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal/50 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-charcoal/60 mb-1.5">Department</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                    placeholder="e.g. Kitchen"
                    className="w-full border border-charcoal/20 rounded-sm px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-charcoal/60 mb-1.5">Location</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. Atlanta, GA"
                    className="w-full border border-charcoal/20 rounded-sm px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal/60 mb-1.5">Employment Type</label>
                <select
                  value={form.employmentType}
                  onChange={(e) => setForm((f) => ({ ...f, employmentType: e.target.value as EmploymentType }))}
                  className="w-full border border-charcoal/20 rounded-sm px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal/50 transition-colors"
                >
                  {Object.entries(EMPLOYMENT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal/60 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the role, responsibilities, and what makes it a great opportunity…"
                  rows={4}
                  className="w-full border border-charcoal/20 rounded-sm px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal/50 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal/60 mb-1.5">
                  Requirements <span className="text-charcoal/35">(one per line)</span>
                </label>
                <textarea
                  value={form.requirements}
                  onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))}
                  placeholder={'2+ years kitchen experience\nAvailable weekends\nFood handler certification'}
                  rows={4}
                  className="w-full border border-charcoal/20 rounded-sm px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal/50 transition-colors resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-charcoal/60">
                    Application Questions <span className="text-charcoal/35">(optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="flex items-center gap-1 text-xs text-charcoal/60 hover:text-charcoal transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Question
                  </button>
                </div>

                {form.questions.length === 0 ? (
                  <p className="text-xs text-charcoal/35 italic">
                    No custom questions — applicants will only provide name, email, phone, resume, and a message.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {form.questions.map((q, i) => (
                      <div key={q.id} className="border border-charcoal/15 rounded-sm p-3 space-y-2.5 bg-charcoal/[0.02]">
                        <div className="flex items-start gap-2">
                          <input
                            type="text"
                            value={q.label}
                            onChange={(e) => updateQuestion(i, { label: e.target.value })}
                            placeholder="Question text, e.g. Are you available weekends?"
                            className="flex-1 border border-charcoal/20 rounded-sm px-2.5 py-1.5 text-sm text-charcoal focus:outline-none focus:border-charcoal/50 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => removeQuestion(i)}
                            className="text-red-400 hover:text-red-600 p-1.5 shrink-0"
                            aria-label="Remove question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                          <select
                            value={q.type}
                            onChange={(e) => updateQuestion(i, { type: e.target.value as QuestionType })}
                            className="text-xs border border-charcoal/20 rounded-sm px-2 py-1.5 text-charcoal/70 focus:outline-none focus:border-charcoal/50"
                          >
                            {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                          <label className="flex items-center gap-1.5 text-xs text-charcoal/60">
                            <input
                              type="checkbox"
                              checked={q.required}
                              onChange={(e) => updateQuestion(i, { required: e.target.checked })}
                              className="w-3.5 h-3.5 rounded border-charcoal/30"
                            />
                            Required
                          </label>
                        </div>

                        {q.type === 'MULTIPLE_CHOICE' && (
                          <input
                            type="text"
                            value={(q.options || []).join(', ')}
                            onChange={(e) => updateQuestion(i, {
                              options: e.target.value.split(',').map((s) => s.trim()),
                            })}
                            placeholder="Option A, Option B, Option C"
                            className="w-full border border-charcoal/20 rounded-sm px-2.5 py-1.5 text-sm text-charcoal focus:outline-none focus:border-charcoal/50 transition-colors"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2.5 text-sm text-charcoal/70">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded border-charcoal/30"
                />
                Publish immediately (visible on Careers page)
              </label>

              <div className="flex justify-end gap-3 pt-2 border-t border-charcoal/10">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 text-sm text-charcoal/60 hover:text-charcoal transition-colors"
                >
                  Cancel
                </button>
                <Button type="submit" loading={saving}>
                  {editingJob ? 'Save Changes' : 'Post Job'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
