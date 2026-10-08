import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";

export const generateToken = (
  payload: Record<string, unknown>,
  secret: Secret,
  expiresIn: string
): string => {
  const options: SignOptions = {
    expiresIn: expiresIn as unknown as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, secret, options);
};

export const verifyToken = <T = JwtPayload>(
  token: string,
  secret: Secret
): T => {
  return jwt.verify(token, secret) as T;
};
