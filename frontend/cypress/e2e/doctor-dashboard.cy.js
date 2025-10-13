// Doctor Dashboard E2E Test
// Covers login, dashboard load, and key doctor features

describe('Doctor Dashboard E2E', () => {
  it('should load the login page and log in as a doctor', () => {
    cy.visit('/login');
    cy.get('input[type=email]').type(Cypress.env('DOCTOR_EMAIL'));
    cy.get('input[type=password]').type(Cypress.env('DOCTOR_PASSWORD'));
    cy.get('button[type=submit]').click();
    cy.url().should('include', '/doctor-overview');
    cy.contains('Welcome back to your dashboard').should('exist');
    // Doctor's name should be present (from profile or user)
    cy.get('h1').should('have.class', 'text-3xl').and('be.visible');
    // Statistics cards
    cy.contains('Total Patients').should('exist');
    cy.contains("Today's Appointments").should('exist');
    cy.contains('Average Rating').should('exist');
    cy.contains('Completed Appointments').should('exist');
    // Navbar should be present and have Jeewaka branding
    cy.get('nav').contains('Jeewaka').parents('nav').first().within(() => {
      cy.contains('Jeewaka').should('exist');
    });
  });

  // Add more tests for navigation, appointments, etc.
});
