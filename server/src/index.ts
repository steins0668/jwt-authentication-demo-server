import express from "express";
import cors, { type CorsOptions } from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const whitelist = ["http://localhost:[port]"];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || whitelist.includes(origin)) callback(null, true);
    else callback(new Error("Not allowed by CORS."));
  },
};

app.use(cors(corsOptions));

app.use(express.json()); // json parsing

const port = 2620; //  can be anything
app.listen(port, "0.0.0.0", () => {
  //  the 0.0.0.0 is for hosting on your local ip
  console.log("Server is now running at port: " + port);
});
