/**
 * Logo NUTRIRP — SVG inline baseado na imagem fornecida.
 * Monitor com gráfico de barras + maçã + texto NUTRIRP
 */
export default function NutrirpLogo({ size = 40, textSize = 'text-xl', showText = true, className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Ícone SVG */}
      <svg
        width={size}
        height={size * 0.75}
        viewBox="0 0 80 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Monitor */}
        <rect x="2" y="2" width="56" height="40" rx="4" stroke="white" strokeWidth="3" fill="none" />
        {/* Tela do monitor */}
        <rect x="8" y="8" width="44" height="28" rx="2" fill="rgba(255,255,255,0.15)" />
        {/* Barras do gráfico */}
        <rect x="14" y="22" width="6" height="10" rx="1" fill="white" opacity="0.9" />
        <rect x="23" y="16" width="6" height="16" rx="1" fill="white" opacity="0.9" />
        <rect x="32" y="19" width="6" height="13" rx="1" fill="white" opacity="0.9" />
        <rect x="41" y="13" width="6" height="19" rx="1" fill="white" opacity="0.9" />
        {/* Linha de lista (esquerda) */}
        <line x1="8" y1="12" x2="12" y2="12" stroke="white" strokeWidth="1.5" opacity="0.6" />
        <line x1="8" y1="16" x2="12" y2="16" stroke="white" strokeWidth="1.5" opacity="0.6" />
        <line x1="8" y1="20" x2="12" y2="20" stroke="white" strokeWidth="1.5" opacity="0.6" />
        {/* Pescoço do monitor */}
        <rect x="26" y="42" width="8" height="6" rx="1" fill="white" opacity="0.8" />
        {/* Base */}
        <rect x="18" y="48" width="24" height="3" rx="1.5" fill="white" opacity="0.8" />

        {/* Maçã (sobreposta ao canto inferior direito do monitor) */}
        {/* Corpo da maçã */}
        <ellipse cx="62" cy="46" rx="14" ry="12" fill="rgba(255,255,255,0.25)" />
        <ellipse cx="62" cy="46" rx="12" ry="10" fill="white" opacity="0.9" />
        {/* Divisão da maçã */}
        <line x1="62" y1="38" x2="62" y2="56" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
        {/* Folha */}
        <path d="M62 36 Q66 30 70 32 Q66 36 62 36Z" fill="white" opacity="0.9" />
        {/* Cabo */}
        <line x1="62" y1="36" x2="63" y2="33" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      {/* Texto */}
      {showText && (
        <span className={`font-black tracking-tight text-white ${textSize}`}>
          NUTRIRP
        </span>
      )}
    </div>
  )
}
