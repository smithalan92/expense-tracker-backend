import { ResponseToolkit } from "@hapi/hapi";
import DBAgent from "../lib/DBAgent";
import { ContainerCradle, Env } from "../lib/types";
import { LoginRequest } from "./AuthController.types";
import { isSame } from "../lib/crypto";
import { DBUserResult } from "../types/models/user.types";

class AppController {
  env: Env;
  dbAgent: DBAgent;

  constructor({ env, dbAgent }: ContainerCradle) {
    this.env = env;
    this.dbAgent = dbAgent;
  }

  async login(req: LoginRequest, h: ResponseToolkit) {
    const { email, password } = req.payload;

    const [user] = await this.dbAgent.runQuery<DBUserResult[]>({
      query: "SELECT * FROM users WHERE email = ?",
      values: [email],
    });

    if (!user) {
      return h.response({ error: "Incorrect user name or password" }).code(401);
    }

    if (!isSame(password, user.password)) {
      return h.response({ error: "Incorrect user name or password" }).code(401);
    }

    return h
      .response({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      })
      .code(200);
  }
}

export default AppController;
