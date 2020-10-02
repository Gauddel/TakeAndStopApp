module.exports = {
    purge: [],
    theme: {
      extend: {
        colors: {
          'blue' : '#5271ff',
          'purple' : '#B7ABFF',
          'gradient-blue' : '#8c3cee',
          'gradient-blue-purple' : '#2f85f6',
          'gradient-purple' : '#2daef7'
        }
      },
    },
    variants: ['responsive', 'group-hover', 'group-focus', 'focus-within', 'first', 'last', 'odd', 'even', 'hover', 'focus', 'active', 'visited', 'disabled'],
    plugins: [
        require('@tailwindcss/custom-forms')
    ],
}