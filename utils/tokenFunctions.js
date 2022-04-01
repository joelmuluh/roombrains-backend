import jwt from "jsonwebtoken";
export function generateToken(details) {
  return jwt.sign(details, process.env.SECRET_KEY);
}

export function authRequest(req, res, next) {
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(" ")[1];

    if (token.length) {
      const decodedToken = verifyToken(token);

      if (decodedToken) {
        req.user = decodedToken;
        next();
      } else {
        res.json({ error: "Incorrect Token" });
      }
    } else {
      res.json({ error: "No token was provided" });
      console.log("None");
    }
  } else {
    res.json({ error: "No Authorisation header seen" });
  }
}

function verifyToken(token) {
  const tokenValid = jwt.verify(token, process.env.SECRET_KEY);
  if (!tokenValid) {
    return false;
  }
  return tokenValid;
}
