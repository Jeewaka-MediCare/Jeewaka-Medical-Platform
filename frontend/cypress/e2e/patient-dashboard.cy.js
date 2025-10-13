// Patient Dashboard E2E Test
// Covers login, dashboard load, and key patient features

describe('Patient Dashboard E2E', () => {
  beforeEach(() => {
    // Ignore Stripe.js loading errors (or other 3rd party script errors)
    cy.on('uncaught:exception', (err) => {
      if (err.message && err.message.includes('Failed to load Stripe.js')) {
        return false; // prevent Cypress from failing the test
      }
      // allow all other errors to fail the test
    });
  });
  it('should log in as a patient and see dashboard', () => {
    cy.visit('/login');
    cy.log('Using email:', Cypress.env('PATIENT_EMAIL'));
    cy.get('input[type=email]').type(Cypress.env('PATIENT_EMAIL'));
    cy.get('input[type=password]').type(Cypress.env('PATIENT_PASSWORD'));
    cy.get('button[type=submit]').click();
    cy.url().should('include', '/patient-dashboard');

    // Wait for either loading or loaded state, robust to multiple h1s
    cy.get('main h1').first().invoke('text').then(text => {
      expect([
        'Find Your Doctor',
        'Searching for doctors...'
      ]).to.include(text.trim());
    });

    // Robust navbar selection: only first visible Jeewaka navbar
    cy.contains('nav', 'Jeewaka').then($navs => {
      cy.wrap($navs[0]).should('be.visible').and('contain', 'Jeewaka');
    });
  });

  // Add more tests for patient navigation, appointments, etc.
});
