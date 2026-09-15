'use client'

import { useState } from 'react'
import { X, CheckCircle } from 'lucide-react'
import type { JobPosting } from '@/types'

interface Props {
  job: JobPosting
  onClose: () => void
}

export function JobApplicationModal({ job, onClose }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [coverMessage, setCoverMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
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
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit application')
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
      <div className="relative w-full max-w-md bg-charcoal border border-cream/10 rounded-sm shadow-2xl max-h-[90vh] overflow-y-auto">
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
              <button type="button" onClick={onClose} className="text-cream/40 hover:text-cream transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-cream/60 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full bg-white/5 border border-cream/20 rounded-sm px-3 py-2.5 text-sm text-cream placeholder-cream/30 focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-cream/60 mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-cream/20 rounded-sm px-3 py-2.5 text-sm text-cream placeholder-cream/30 focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-cream/60 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. 07700 900000"
                  className="w-full bg-white/5 border border-cream/20 rounded-sm px-3 py-2.5 text-sm text-cream placeholder-cream/30 focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-cream/60 mb-1.5">
                  Why do you want to join us? <span className="text-cream/30">(optional)</span>
                </label>
                <textarea
                  value={coverMessage}
                  onChange={e => setCoverMessage(e.target.value)}
                  placeholder="Tell us a bit about your experience and availability…"
                  rows={4}
                  className="w-full bg-white/5 border border-cream/20 rounded-sm px-3 py-2.5 text-sm text-cream placeholder-cream/30 focus:outline-none focus:border-gold transition-colors resize-none"
                />
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}

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
