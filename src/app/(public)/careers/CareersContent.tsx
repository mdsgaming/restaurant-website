'use client'

import { useEffect, useState } from 'react'
import { Briefcase, MapPin, Clock, ChevronDown, CheckCircle2 } from 'lucide-react'
import { getRestaurantSettings, getJobPostings } from '@/lib/firestore'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { JobApplicationModal } from '@/components/public/JobApplicationModal'
import type { JobPosting } from '@/types'

const EMPLOYMENT_LABELS: Record<string, string> = {
  FULL_TIME: 'Full-Time',
  PART_TIME: 'Part-Time',
  SEASONAL: 'Seasonal',
}

export function CareersContent() {
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [enabled, setEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [applyJob, setApplyJob] = useState<JobPosting | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [settings, postings] = await Promise.all([
          getRestaurantSettings(),
          getJobPostings(true),
        ])
        setEnabled(settings?.careersPageEnabled !== false)
        setJobs(postings)
      } catch (e) {
        console.error('Failed to load careers:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="pt-32 pb-20">
        <SectionLoader />
      </div>
    )
  }

  return (
    <div className="pt-32 pb-24">
      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
        <p className="section-label">Join Our Team</p>
        <div className="gold-divider" />
        <h1 className="section-heading mt-4 text-cream">
          Build Your <span className="italic text-primary-light">Career</span> With Us
        </h1>
        <p className="text-cream/60 mt-4 max-w-2xl mx-auto">
          We're always looking for passionate people to join our kitchen and front-of-house team.
          Explore our open roles below.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {!enabled ? (
          <div className="text-center py-20 border border-cream/10 rounded-sm bg-white/5">
            <Briefcase className="w-12 h-12 text-cream/20 mx-auto mb-4" />
            <p className="font-serif text-2xl text-cream/50 italic">We're not hiring right now</p>
            <p className="text-cream/35 text-sm mt-2">Please check back soon for new opportunities.</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 border border-cream/10 rounded-sm bg-white/5">
            <Briefcase className="w-12 h-12 text-cream/20 mx-auto mb-4" />
            <p className="font-serif text-2xl text-cream/50 italic">No open positions right now</p>
            <p className="text-cream/35 text-sm mt-2">Check back soon — we're growing!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const isExpanded = expandedId === job.id
              return (
                <div
                  key={job.id}
                  className="border border-cream/10 rounded-sm bg-white/5 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : job.id)}
                    className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-white/5 transition-colors"
                  >
                    <div>
                      <h3 className="font-serif text-xl text-cream">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-cream/50">
                        {job.department && (
                          <span className="flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5" /> {job.department}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> {EMPLOYMENT_LABELS[job.employmentType] || job.employmentType}
                        </span>
                        {job.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" /> {job.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-cream/40 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-6 pt-1 border-t border-cream/10">
                      {job.description && (
                        <p className="text-sm text-cream/65 leading-relaxed mt-4">{job.description}</p>
                      )}
                      {job.requirements?.length > 0 && (
                        <div className="mt-5">
                          <h4 className="text-xs font-semibold text-cream/70 uppercase tracking-wide mb-2.5">
                            What We're Looking For
                          </h4>
                          <ul className="space-y-2">
                            {job.requirements.map((req, i) => (
                              <li key={i} className="flex items-start gap-2.5 text-sm text-cream/60">
                                <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setApplyJob(job)}
                        className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gold text-charcoal font-semibold text-sm rounded-sm hover:bg-gold-dark transition-colors"
                      >
                        Apply Now
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {applyJob && (
        <JobApplicationModal job={applyJob} onClose={() => setApplyJob(null)} />
      )}
    </div>
  )
}
