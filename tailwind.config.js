/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/app/login/page.js", // Only target the login page
      "./src/app/admin/**/page.js", // Target all JavaScript files in the admin directory
    ],
    theme: {
      extend: {},
    },
    plugins: [],
  }
  //