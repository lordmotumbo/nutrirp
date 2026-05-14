export default function NexfitLogo({ size = 40, textSize = 'text-xl', showText = true, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="nexfit-circle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9333EA" />
            <stop offset="100%" stopColor="#6D28D9" />
          </linearGradient>
          <linearGradient id="nexfit-n-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="50%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#5B21B6" />
          </linearGradient>
        </defs>
        <path d="M 78 15 A 40 40 0 1 1 85 85" stroke="url(#nexfit-circle-grad)" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M 28 72 L 28 28 L 44 28 L 58 55 L 58 28 L 72 28 L 72 72 L 56 72 L 42 45 L 42 72 Z" fill="url(#nexfit-n-grad)" />
      </svg>
      {showText && (
        <span className={`font-black tracking-wider ${textSize}`}>
          <span className="text-white">NEX</span>
          <span className="text-purple-400">FIT</span>
        </span>
      )}
    </div>
  )
}
