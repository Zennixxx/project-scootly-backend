import sdk from "node-appwrite";

const client = new sdk.Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

export const registerUser = async (req, res) => {
  try {
    const users = new sdk.Users(client);
    const { email, password, phone, name } = req.body;
    if (!email || !password || !phone || !name) {
      return res
        .status(400)
        .json({ message: "Email, password, phone, and name are required" });
    }
    const user = await users.create(
      sdk.ID.unique(),
      email,
      phone,
      password,
      name
    );
    if (!user) {
      return res.status(400).json({ message: "User already exists" });
    } else {
      res.status(201).json({
        message: "User registered successfully ",
        user: {
          id: user.$id,
          email: user.email,
          phone: user.phone,
          name: user.name,
        },
      });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    const account = new sdk.Account(client);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
