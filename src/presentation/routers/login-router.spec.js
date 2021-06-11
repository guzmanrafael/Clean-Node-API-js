const MissingParamError = require("../helpers/missing-param-error");
const InvalidParamError = require("../helpers/invalid-param-error");
const ServerError = require("../helpers/server-error");
const UnauthorizedError = require("../helpers/unauthorized-error");
const LoginRouter = require("./login-router");

const makeLoginRouter = () => {
  const authUseCaseSpy = makeAuthUseCase();
  const emailValidatorSpy = makeEmailValidator();
  const loginRouter = new LoginRouter(authUseCaseSpy, emailValidatorSpy);
  return {
    loginRouter,
    authUseCaseSpy,
    emailValidatorSpy,
  };
};

const makeEmailValidator = () => {
  class EmailValidatorSpy {
    isValid(email) {
      return this.isEmailValid;
    }
  }
  const emailValidatorSpy = new EmailValidatorSpy();
  emailValidatorSpy.isEmailValid = true;
  return emailValidatorSpy;
};

const makeAuthUseCase = () => {
  class AuthUseCaseSpy {
    async auth(email, password) {
      this.email = email;
      this.password = password;
      return this.accessToken;
    }
  }
  const authUseCaseSpy = new AuthUseCaseSpy();
  authUseCaseSpy.accessToken = "valid_token";
  return authUseCaseSpy;
};

const makeAuthUseCaseWithError = () => {
  class AuthUseCaseSpy {
    async auth() {
      throw new Error();
    }
  }
  return new AuthUseCaseSpy();
};

describe("Login Router", () => {
  test("Should return 400 if no email is provided", async () => {
    const { loginRouter } = makeLoginRouter();
    const httpRequest = {
      body: {
        password: "any_password",
      },
    };
    const httpResponse = await loginRouter.route(httpRequest);
    expect(httpResponse.statusCode).toBe(400);
    expect(httpResponse.body).toEqual(new MissingParamError("email"));
  });

  test("Should return 400 if no password is provided", async () => {
    const { loginRouter } = makeLoginRouter();
    const httpRequest = {
      body: {
        email: "any_email@mail.com",
      },
    };
    const httpResponse = await loginRouter.route(httpRequest);
    expect(httpResponse.statusCode).toBe(400);
    expect(httpResponse.body).toEqual(new MissingParamError("password"));
  });

  test("Should return 500 if no httpRequest is provided", async () => {
    const { loginRouter } = makeLoginRouter();
    const httpResponse = await loginRouter.route();
    expect(httpResponse.statusCode).toBe(500);
    expect(httpResponse.body).toEqual(new ServerError());
  });

  test("Should return 500 if httpRequest has no body", async () => {
    const { loginRouter } = makeLoginRouter();
    const httpResponse = await loginRouter.route({});
    expect(httpResponse.statusCode).toBe(500);
    expect(httpResponse.body).toEqual(new ServerError());
  });

  test("Should call AuthUseCase with correct params", async () => {
    const { loginRouter, authUseCaseSpy } = makeLoginRouter();
    const httpRequest = {
      body: {
        email: "any_email@mail.com",
        password: "any_password",
      },
    };
    await loginRouter.route(httpRequest);
    expect(authUseCaseSpy.email).toBe(httpRequest.body.email);
    expect(authUseCaseSpy.password).toBe(httpRequest.body.password);
  });

  test("Should return 401 when invalid credentials are provided", async () => {
    const { loginRouter, authUseCaseSpy } = makeLoginRouter();
    authUseCaseSpy.accessToken = null;
    const httpRequest = {
      body: {
        email: "invalid_email@mail.com",
        password: "invalid_password",
      },
    };
    const httpResponse = await loginRouter.route(httpRequest);
    expect(httpResponse.statusCode).toBe(401);
    expect(httpResponse.body).toEqual(new UnauthorizedError());
  });

  test("Should return 200 when valid credentials are provided", async () => {
    const { loginRouter, authUseCaseSpy } = makeLoginRouter();
    const httpRequest = {
      body: {
        email: "valid_email@mail.com",
        password: "valid_password",
      },
    };
    const httpResponse = await loginRouter.route(httpRequest);
    expect(httpResponse.statusCode).toBe(200);
    expect(httpResponse.body.accessToken).toEqual(authUseCaseSpy.accessToken);
  });

  test("Should return 500 if no AuthUseCase is provided", async () => {
    const loginRouter = new LoginRouter();
    const httpRequest = {
      body: {
        email: "any_email@mail.com",
        password: "any_password",
      },
    };
    const httpResponse = await loginRouter.route(httpRequest);
    expect(httpResponse.statusCode).toBe(500);
    expect(httpResponse.body).toEqual(new ServerError());
  });

  test("Should return 500 if AuthUseCase has no auth method", async () => {
    const loginRouter = new LoginRouter({});
    const httpRequest = {
      body: {
        email: "any_email@mail.com",
        password: "any_password",
      },
    };
    const httpResponse = await loginRouter.route(httpRequest);
    expect(httpResponse.statusCode).toBe(500);
    expect(httpResponse.body).toEqual(new ServerError());
  });

  test("Should return 500 if AuthUseCase throws", async () => {
    const authUseCaseSpy = makeAuthUseCaseWithError();
    const loginRouter = new LoginRouter(authUseCaseSpy);
    const httpRequest = {
      body: {
        email: "any_email@mail.com",
        password: "any_password",
      },
    };
    const httpResponse = await loginRouter.route(httpRequest);
    expect(httpResponse.statusCode).toBe(500);
    expect(httpResponse.body).toEqual(new ServerError());
  });

  test("Should return 400 if an invalid email is provided", async () => {
    const { loginRouter, emailValidatorSpy } = makeLoginRouter();
    emailValidatorSpy.isEmailValid = false;
    const httpRequest = {
      body: {
        email: "invalid_email@mail.com",
        password: "any_password",
      },
    };
    const httpResponse = await loginRouter.route(httpRequest);
    expect(httpResponse.statusCode).toBe(400);
    expect(httpResponse.body).toEqual(new InvalidParamError("email"));
  });
});
