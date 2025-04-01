import validator from "validator";

export const validateRegisterUser = (req, res, next) => {
  try {
    const { email, password, phone, name } = req.body;

    if (!email || !password || !phone || !name) {
      return res
        .status(400)
        .json({ message: "Email, password, phone, and name are required" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and symbols",
      });
    }

    if (!validator.isMobilePhone(phone, ["uk-UA"], { strictMode: true })) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }

    if (name.length < 2) {
      return res
        .status(400)
        .json({ message: "Name must be at least 2 characters long" });
    }

    next();
  } catch (error) {
    console.error("Validation error:", error);
    return res.status(400).json({ message: "Invalid request" });
  }
};
