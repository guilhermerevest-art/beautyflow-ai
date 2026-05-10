export function Button({ children, variant = 'primary', type = 'button', disabled = false, onClick, className = '' }) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 px-5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2'

  const variants = {
    primary: 'gradient-primary text-white hover:opacity-90 focus:ring-primary-500 shadow-md shadow-primary-100 disabled:opacity-50',
    secondary: 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300 hover:text-primary-700 focus:ring-primary-300',
    danger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 focus:ring-red-300',
    ghost: 'text-gray-600 hover:text-primary-700 hover:bg-primary-50 focus:ring-primary-300',
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${disabled ? 'cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  )
}
