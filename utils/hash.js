import bcrypt from "bcrypt";

export const hashPassword = async (password) => {
  const salt = 10;
  const hash = await bcrypt.hash(password, salt);
  return hash;
};
export const verifyPassword = async (password, hash) => {
  const validity = await bcrypt.compare(password, hash);
  return validity;
};
