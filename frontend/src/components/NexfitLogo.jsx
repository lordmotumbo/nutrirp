/**
 * Logo NEXFIT — reproduz fielmente a logo fornecida pelo usuário.
 * Texto "NEXFIT" onde N é roxo com gradiente, EX é cinza/branco, FIT é roxo.
 * NÃO adiciona ícone separado — o N já faz parte do texto.
 */
export default function NexfitLogo({ size = 36, textSize = 'text-xl', showText = true, className = '' }) {
  const fontSize = size * 0.7

  return (
    <div className={`flex items-center ${className}`}>
      <span 
        className={`font-black tracking-wide ${textSize}`}
        style={{ fontSize: `${fontSize}px`, lineHeight: 1 }}
      >
        <span style={{ 
          background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 50%, #6d28d9 100%)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent',
          fontStyle: 'italic',
          fontWeight: 900,
        }}>N</span>
        <span className="text-gray-200" style={{ fontWeight: 800 }}>EX</span>
        <span style={{ 
          background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent',
          fontWeight: 900,
        }}>FIT</span>
      </span>
    </div>
  )
}
