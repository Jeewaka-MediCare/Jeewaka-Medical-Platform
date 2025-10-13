const dotenvPlugin = require('cypress-dotenv');

module.exports = {
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: false,
    setupNodeEvents(on, config) {
      return dotenvPlugin(config);
    },
    env: {
      DOCTOR_EMAIL: process.env.CYPRESS_DOCTOR_EMAIL,
      DOCTOR_PASSWORD: process.env.CYPRESS_DOCTOR_PASSWORD
    }
  },
    video: false,
    trashAssetsBeforeRuns: false,
  screenshotOnRunFailure: true
};
