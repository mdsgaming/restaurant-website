'use client'

import { useState } from 'react'
import { X, CheckCircle } from 'lucide-react'
import type { JobPosting } from '@/types'

interface Props {
  job: JobPosting
  onClose: () => void
}

const INPUT_CLASS =
  'w-full bg-white/5 border border-cream/20 rounded-sm px-3 py-2.5 text-base sm:text-sm text-cream placeholder-cream/30 focus:outline-none focus:border-gold transition-colors'

export function JobApplicationModal({ job, onClose }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [coverMessage, setCoverMessage] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const questions = job.questions || []

  function setAnswer(questionId: string, value: string) {
    setAnswers((a) => ({ ...a, [questionId]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    for (const q of questions) {
      if (q.required && !answers[q.id]?.trim()) {
        setError(`Please answer: ${q.label}`)
        return
      }
    }

    setLoading(true)

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          jobTitle: job.title,
          applicantName: name,
          email,
          phone,
          coverMessage,
          answers: questions.map((q) => ({
            questionId: q.id,
            label: q.label,
            answer: answers[q.id] || '',
          })),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to submit application. Please try again.')
      }

      setSuccess(true)
      setTimeout(onClose, 3000)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-charcoal border border-cream/10 rounded-sm shadow-2xl max-h-[90vh] overflow-y-auto overscroll-contain">
        {success ? (
          <div className="p-10 text-center">
            <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
            <h2 className="font-serif text-2xl text-cream mb-2">Application Sent!</h2>
            <p className="text-cream/60 text-sm">
              Thank you for applying to {job.title}. We'll be in touch if you're a fit.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-5 border-b border-cream/10">
              <div>
                <h2 className="font-serif text-xl text-cream">Apply Now</h2>
                <p className="text-xs text-cream/50 mt-0.5">{job.title}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="p-2 -m-2 text-cream/40 hover:text-cream transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label htmlFor="apply-name" className="block text-xs font-medium text-cream/60 mb-1.5">Full Name</label>
                <input
                  id="apply-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label htmlFor="apply-email" className="block text-xs font-medium text-cream/60 mb-1.5">Email</label>
                <input
                  id="apply-email"
                  type="email"
                  required
                  autoComplete="email"
                  spellCheck={false}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label htmlFor="apply-phone" className="block text-xs font-medium text-cream/60 mb-1.5">Phone Number</label>
                <input
                  id="apply-phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. (254) 350-6107"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label htmlFor="apply-message" className="block text-xs font-medium text-cream/60 mb-1.5">
                  Why do you want to join us? <span className="text-cream/30">(optional)</span>
                </label>
                <textarea
                  id="apply-message"
                  value={coverMessage}
                  onChange={e => setCoverMessage(e.target.value)}
                  placeholder="Tell us a bit about your experience and availability…"
                  rows={4}
                  className={`${INPUT_CLASS} resize-none`}
                />
              </div>

              {/* Custom job-specific questions */}
              {questions.length > 0 && (
                <div className="space-y-4 pt-2 border-t border-cream/10">
                  {questions.map((q) => (
                    <div key={q.id}>
                      <label htmlFor={`q-${q.id}`} className="block text-xs font-medium text-cream/60 mb-1.5">
                        {q.label} {q.required && <span className="text-gold">*</span>}
                      </label>

                      {q.type === 'SHORT_TEXT' && (
                        <input
                          id={`q-${q.id}`}
                          type="text"
                          required={q.required}
                          value={answers[q.id] || ''}
                          onChange={e => setAnswer(q.id, e.target.value)}
                          className={INPUT_CLASS}
                        />
                      )}

                      {q.type === 'LONG_TEXT' && (
                        <textarea
                          id={`q-${q.id}`}
                          required={q.required}
                          rows={3}
                          value={answers[q.id] || ''}
                          onChange={e => setAnswer(q.id, e.target.value)}
                          className={`${INPUT_CLASS} resize-none`}
                        />
                      )}

                      {q.type === 'NUMBER' && (
                        <input
                          id={`q-${q.id}`}
                          type="number"
                          inputMode="numeric"
                          required={q.required}
                          value={answers[q.id] || ''}
                          onChange={e => setAnswer(q.id, e.target.value)}
                          className={INPUT_CLASS}
                        />
                      )}

                      {q.type === 'YES_NO' && (
                        <div className="grid grid-cols-2 gap-3">
                          {['Yes', 'No'].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              aria-pressed={answers[q.id] === opt}
                              onClick={() => setAnswer(q.id, opt)}
                              className={`py-2.5 text-sm font-medium rounded-sm border transition-colors ${
                                answers[q.id] === opt
                                  ? 'bg-gold text-charcoal border-gold'
                                  : 'border-cream/20 text-cream/60 hover:border-cream/40 hover:text-cream'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}

                      {q.type === 'MULTIPLE_CHOICE' && (
                        <div className="space-y-2">
                          {(q.options || []).map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              aria-pressed={answers[q.id] === opt}
                              onClick={() => setAnswer(q.id, opt)}
                              className={`w-full text-left px-3 py-2.5 text-sm rounded-sm border transition-colors ${
                                answers[q.id] === opt
                                  ? 'bg-gold text-charcoal border-gold'
                                  : 'border-cream/20 text-cream/60 hover:border-cream/40 hover:text-cream'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {error && <p role="alert" className="text-red-400 text-xs">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gold text-charcoal font-bold text-sm rounded-sm hover:bg-gold/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting…' : 'Submit Application'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
