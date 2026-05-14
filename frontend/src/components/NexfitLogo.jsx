/**
 * Logo NEXFIT — usa a imagem real fornecida pelo usuário.
 * O arquivo nexfit-logo.png deve estar em /public/nexfit-logo.png
 */
export default function NexfitLogo({ size = 40, className = '' }) {
  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src="/nexfit-logo.png" 
        alt="NEXFIT" 
        style={{ height: `${size}px` }}
        className="object-contain"
      />
    </div>
  )
}
