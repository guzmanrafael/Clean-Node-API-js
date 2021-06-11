class LoginRouter {
  route(httpRequest) {
    const { email, password } = httpRequest.body;
    if (!email || !password) {
      return {
        statusCode: 400,
      };
    }
  }
}

describe("Login Router", () => {
  test("Should return 400 if no email is provided", () => {
    const loginRouter = new LoginRouter();
    const httpRequest = {
      body: {
        password: "any_password",
      },
    };
    const httpResponse = loginRouter.route(httpRequest);
    expect(httpResponse.statusCode).toBe(400);
  });

  test("Should return 400 if no password is provided", () => {
    const loginRouter = new LoginRouter();
    const httpRequest = {
      body: {
        email: "any_email@mail.com",
      },
    };
    const httpResponse = loginRouter.route(httpRequest);
    expect(httpResponse.statusCode).toBe(400);
  });
});
