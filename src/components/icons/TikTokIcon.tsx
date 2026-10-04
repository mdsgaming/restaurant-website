// lucide-react has no TikTok glyph, so this is a small hand-drawn stand-in
// sized to match lucide icons (24x24 viewBox, currentColor fill) so it can
// drop into the same className patterns (e.g. "w-4 h-4") used elsewhere.
export function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.6 5.82c-.86-.95-1.34-2.17-1.34-3.44h-3.14v13.44c0 1.53-1.24 2.78-2.78 2.78a2.78 2.78 0 0 1-2.78-2.78 2.78 2.78 0 0 1 2.78-2.78c.29 0 .56.04.82.12V9.9a6.1 6.1 0 0 0-.82-.06 5.92 5.92 0 0 0-5.92 5.92A5.92 5.92 0 0 0 9.34 21.68a5.92 5.92 0 0 0 5.92-5.92V8.84a8.33 8.33 0 0 0 4.86 1.56V7.26a4.85 4.85 0 0 1-3.52-1.44z" />
    </svg>
  )
}
