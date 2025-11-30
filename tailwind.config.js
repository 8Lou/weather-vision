/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{vue,js,ts,jsx,tsx}",
    "./example.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        'primary-dark': '#2563eb',
        'primary-light': '#60a5fa',
        'primary-lighter': '#dbeafe',
        secondary: '#1e293b',
        'secondary-light': '#334155',
        'secondary-lighter': '#64748b',
        danger: {
          DEFAULT: '#ef4444',
          dark: '#dc2626',
          light: '#fee2e2',
          border: '#fecaca',
          text: '#991b1b',
        },
        success: {
          DEFAULT: '#10b981',
          light: '#d1fae5',
        },
        background: {
          DEFAULT: '#f8fafc',
          card: '#ffffff',
          hover: '#f1f5f9',
        },
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
        'large': '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)',
        'button': '0 2px 4px rgba(59, 130, 246, 0.2), 0 1px 2px rgba(59, 130, 246, 0.1)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [],
}
