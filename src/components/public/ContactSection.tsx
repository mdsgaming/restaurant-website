import { MapPin, Phone, Mail, Instagram, Facebook, Twitter } from 'lucide-react'
import type { RestaurantSettings } from '@/types'

export function ContactSection({ settings }: { settings?: Partial<RestaurantSettings> }) {
  const mapUrl = settings?.mapEmbedUrl
  const address = `${settings?.address || '123 Rue de la Paix'}, ${settings?.city || 'San Francisco'}, ${settings?.state || 'CA'} ${settings?.zip || ''}`
  const phone = settings?.phone || '+1 (555) 123-4567'
  const email = settings?.email || 'hello@restaurant.com'
  const social = settings?.socialMedia

  return (
    <section id="contact" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="section-label">Get in Touch</p>
          <div className="gold-divider" />
          <h2 className="section-heading mt-4 text-cream">
            Visit <span className="italic text-primary-light">Us</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Map */}
          <div className="lg:col-span-3">
            {mapUrl ? (
              <iframe
                src={mapUrl}
                className="w-full h-80 lg:h-full min-h-[400px] rounded-sm border-0 opacity-90"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Restaurant Location"
              />
            ) : (
              <div className="w-full h-80 lg:h-full min-h-[400px] bg-white/5 border border-cream/10 rounded-sm flex items-center justify-center">
                <div className="text-center space-y-2">
                  <MapPin className="w-10 h-10 text-cream/30 mx-auto" />
                  <p className="text-cream/50 text-sm">Map will appear here</p>
                  <p className="text-xs text-cream/30">Add a Google Maps embed URL in admin settings</p>
                </div>
              </div>
            )}
          </div>

          {/* Contact info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/30 rounded-sm flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h4 className="font-semibold text-cream mb-1">Address</h4>
                  <p className="text-cream/60 text-sm leading-relaxed">{address}</p>
                  {mapUrl && (
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-gold hover:underline mt-1 inline-block"
                    >
                      Get Directions →
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/30 rounded-sm flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h4 className="font-semibold text-cream mb-1">Phone</h4>
                  <a href={`tel:${phone}`} className="text-cream/60 text-sm hover:text-gold transition-colors">
                    {phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/30 rounded-sm flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h4 className="font-semibold text-cream mb-1">Email</h4>
                  <a href={`mailto:${email}`} className="text-cream/60 text-sm hover:text-gold transition-colors">
                    {email}
                  </a>
                </div>
              </div>
            </div>

            {/* Social links */}
            {(social?.instagram || social?.facebook || social?.twitter) && (
              <div>
                <h4 className="font-semibold text-cream mb-4">Follow Us</h4>
                <div className="flex items-center gap-3">
                  {social?.instagram && (
                    <a href={social.instagram} target="_blank" rel="noreferrer" aria-label="Follow us on Instagram"
                      className="w-10 h-10 bg-primary/30 rounded-sm flex items-center justify-center hover:bg-primary text-cream transition-all">
                      <Instagram className="w-5 h-5" aria-hidden="true" />
                    </a>
                  )}
                  {social?.facebook && (
                    <a href={social.facebook} target="_blank" rel="noreferrer" aria-label="Follow us on Facebook"
                      className="w-10 h-10 bg-primary/30 rounded-sm flex items-center justify-center hover:bg-primary text-cream transition-all">
                      <Facebook className="w-5 h-5" aria-hidden="true" />
                    </a>
                  )}
                  {social?.twitter && (
                    <a href={social.twitter} target="_blank" rel="noreferrer" aria-label="Follow us on Twitter"
                      className="w-10 h-10 bg-primary/30 rounded-sm flex items-center justify-center hover:bg-primary text-cream transition-all">
                      <Twitter className="w-5 h-5" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Reservation note */}
            <div className="p-5 bg-primary/20 border-l-4 border-gold rounded-sm">
              <h4 className="font-semibold text-cream text-sm mb-1">Reservations</h4>
              <p className="text-cream/60 text-xs leading-relaxed">
                For reservations, please call or email us directly. Walk-ins welcome based on availability.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
