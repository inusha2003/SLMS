function buildUser(role, overrides = {}) {
  const base =
    role === "Admin"
      ? {
          _id: "507f1f77bcf86cd799439011",
          userId: "507f1f77bcf86cd799439011",
          firstName: "Admin",
          lastName: "User",
          name: "Admin User",
          email: "admin@example.com",
          role: "Admin",
          isProfileComplete: true,
          semester: 1,
          academicYear: "1",
        }
      : {
          _id: "507f1f77bcf86cd799439012",
          userId: "507f1f77bcf86cd799439012",
          firstName: "Student",
          lastName: "User",
          name: "Student User",
          email: "student@example.com",
          role: "Student",
          isProfileComplete: true,
          semester: 1,
          academicYear: "1",
        };

  return { ...base, ...overrides };
}

Cypress.Commands.add("visitAsRole", (path, role = "Student", overrides = {}) => {
  const user = buildUser(role, overrides);

  cy.intercept("GET", "**/api/profile/me", {
    statusCode: 200,
    body: { user },
  }).as("profileMe");

  cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.setItem("lms_token", "cypress-test-token");
      win.localStorage.setItem("lms_user", JSON.stringify(user));
      win.sessionStorage.setItem(
        "auth",
        JSON.stringify({
          token: "cypress-test-token",
          role: user.role,
          name: user.name,
          email: user.email,
          isAdmin: user.role === "Admin",
        }),
      );
    },
  });

  cy.wait("@profileMe");
});
