import express from "express";
import cors from "cors";
import { StreamChat } from "stream-chat";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import http from "http";
import { Server } from "socket.io"

const app = express();
app.use(cors());
app.use(express.json());

const api_key = "z86yhp59u5se";
const api_secret = "re9dju2w5njubrpudwra98e3rbja9f72bnnsad5upc3n52yd4eye9jfp3ta86wna";
const serverClient = StreamChat.getInstance(api_key, api_secret);


// for signup
app.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, username, password } = req.body;
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);
    const token = serverClient.createToken(userId);
    res.json({ token, userId, firstName, lastName, username, hashedPassword });
  } catch (error) {
    res.json(error);
  }
});

// for login
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const { users } = await serverClient.queryUsers({ name: username });
    if (users.length === 0) 
        return res.json({ message: "user not found" });

    const token = serverClient.createToken(users[0].id);
    const passwordMatch = await bcrypt.compare(password, users[0].hashedPassword);
    
    if (passwordMatch) {
      res.json({
        token,
        firstName: users[0].firstName,
        lastName: users[0].lastName,
        username,
        userId: users[0].id,
      });
    }
  } catch (error) {
    res.json(error);
  }
});


const server = http.createServer(app)

const io = new Server(server, {
  cors: {
      origin: 'http://localhost:3000',
      methods: ["GET", "POST"],
  }
})

io.on("connection", socket => {
  console.log(`user connected: ${socket.id}`)

  socket.on("game_move", data => {
      console.log(data)
      socket.broadcast.emit("move_received", data)
  })
})

server.listen(3002, () => {
  console.log("Server is running on port 3002");
});
