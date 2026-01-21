// src/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth';
import employeeRoutes from './routes/employees';
import taskRoutes from './routes/tasks';
import CommnetRoutes from "./routes/Comment";
import ProjectManagerRoutes from "./routes/ProjectManager";
import cookieParser from "cookie-parser";

const app = express();

app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:8081",
  "https://flowdash-workwise.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow Postman
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

app.use((req, res, next) => {
  res.removeHeader("X-Frame-Options"); // you already had this
  res.setHeader(
    "Content-Security-Policy",
    "frame-ancestors 'self' https://flowdash-workwise.vercel.app"
  );
  res.setHeader("Permissions-Policy", "geolocation=(self)");
  next();
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/tasks', taskRoutes);
app.use("/api/comments", CommnetRoutes);
app.use("/api/projectManager", ProjectManagerRoutes)

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => console.log(`API listening on :${PORT}`));
