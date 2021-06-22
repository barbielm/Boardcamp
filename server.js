import express from 'express';
import cors from 'cors';
import pg from 'pg';

const server = express();
server.use(cors());
server.use(express.json());


server.listen(4000);