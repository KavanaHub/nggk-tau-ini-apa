import pool from "../config/database.js";
import {
  hashPassword,
  comparePassword,
  generateToken,
  sanitizeUserData,
} from "./helpers/auth.js";
import {
  isValidEmail,
  isValidNPM,
  isValidPassword,
  isValidProgramStudi,
  isValidWhatsApp,
  isRequired,
} from "./helpers/validation.js";
import {
  emailExists,
  npmExists,
  getUserByEmail,
  getConnection,
  releaseConnection,
} from "./helpers/database.js";
import { sendSuccess, sendError, sendServerError } from "./helpers/response.js";

const register = async (req, res) => {
  let conn = null;

  try {
    const { name, email, password, npm, program_studi } = req.body;

    const nameValidation = isRequired(name, "Name");
    if (!nameValidation.valid) {
      return sendError(res, nameValidation.error, 400);
    }

    const emailValidation = isValidEmail(email);
    if (!emailValidation.valid) {
      return sendError(res, emailValidation.error, 400);
    }

    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      return sendError(res, passwordValidation.error, 400);
    }

    const npmValidation = isValidNPM(npm);
    if (!npmValidation.valid) {
      return sendError(res, npmValidation.error, 400);
    }

    const programStudiValidation = isValidProgramStudi(program_studi);
    if (!programStudiValidation.valid) {
      return sendError(res, programStudiValidation.error, 400);
    }

    conn = await getConnection();

    const isEmailTaken = await emailExists(conn, email);
    if (isEmailTaken) {
      releaseConnection(conn);
      return sendError(res, "Email already registered", 400);
    }

    const isNpmTaken = await npmExists(conn, npm);
    if (isNpmTaken) {
      releaseConnection(conn);
      return sendError(res, "NPM already registered", 400);
    }

    const hashedPassword = await hashPassword(password);

    const role = "mahasiswa";

    await conn.query(
      `INSERT INTO users (name, email, password, role, npm, program_studi)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, role, npm, program_studi]
    );

    releaseConnection(conn);

    return sendSuccess(
      res,
      { name, email, role, npm, program_studi },
      "Mahasiswa registered successfully",
      201
    );
  } catch (error) {
    releaseConnection(conn);
    return sendServerError(res, error);
  }
};

const registerDosen = async (req, res) => {
  let conn = null;

  try {
    const { name, email, password, whatsapp_number, sub_role } = req.body;

    const nameValidation = isRequired(name, "Name");
    if (!nameValidation.valid) {
      return sendError(res, nameValidation.error, 400);
    }

    const emailValidation = isValidEmail(email);
    if (!emailValidation.valid) {
      return sendError(res, emailValidation.error, 400);
    }

    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      return sendError(res, passwordValidation.error, 400);
    }

    const whatsappValidation = isValidWhatsApp(whatsapp_number);
    if (!whatsappValidation.valid) {
      return sendError(res, whatsappValidation.error, 400);
    }

    conn = await getConnection();

    const isEmailTaken = await emailExists(conn, email);
    if (isEmailTaken) {
      releaseConnection(conn);
      return sendError(res, "Email already registered", 400);
    }

    const hashedPassword = await hashPassword(password);

    const role = "dosen";
    const finalSubRole = sub_role || "pembimbing";

    await conn.query(
      `INSERT INTO users (name, email, password, role, sub_role, whatsapp_number)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, role, finalSubRole, whatsapp_number]
    );

    releaseConnection(conn);

    return sendSuccess(
      res,
      { name, email, role, sub_role: finalSubRole, whatsapp_number },
      "Dosen registered successfully",
      201
    );
  } catch (error) {
    releaseConnection(conn);
    return sendServerError(res, error);
  }
};

const login = async (req, res) => {
  let conn = null;

  try {
    const { email, password } = req.body;

    const emailValidation = isValidEmail(email);
    if (!emailValidation.valid) {
      return sendError(res, emailValidation.error, 400);
    }

    const passwordValidation = isRequired(password, "Password");
    if (!passwordValidation.valid) {
      return sendError(res, passwordValidation.error, 400);
    }

    conn = await getConnection();

    const user = await getUserByEmail(conn, email);
    releaseConnection(conn);

    if (!user) {
      return sendError(res, "Invalid email or password", 401);
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return sendError(res, "Invalid email or password", 401);
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      sub_role: user.sub_role,
      npm: user.npm,
      program_studi: user.program_studi,
    });

    const userDataWithoutPassword = sanitizeUserData(user);

    return sendSuccess(
      res,
      {
        token: token,
        user: userDataWithoutPassword,
      },
      "Login successful",
      200
    );
  } catch (error) {
    releaseConnection(conn);
    return sendServerError(res, error);
  }
};

export { register, registerDosen, login };
