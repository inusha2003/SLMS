describe("Public auth pages", () => {
  it("loads the login page", () => {
    cy.visit("/login");

    cy.contains("Welcome Back").should("be.visible");
    cy.contains("Email Address").should("be.visible");
    cy.contains("Password").should("be.visible");
  });

  it("loads the register page", () => {
    cy.visit("/register");

    cy.contains("Create Account").should("be.visible");
    cy.contains("Email Address").should("be.visible");
    cy.contains("Password").should("be.visible");
  });
});
