import express, { Request, Response } from 'express';
import { Application } from 'express';
import RequestHandler from './User';
import dotenv from 'dotenv';
import sequelize from './config/database';

const app = express();
dotenv.config();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
RequestHandler(app);

app.get('/', (req: Request, res: Response) => {
    res.send("Hello, this is my first page");
});

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});

async function checkDatabaseConnection() {
    try {
      await sequelize.authenticate();
      console.log('🔌️ Database Connection has been established successfully!');
    } catch (error) {
      console.error('❌ Unable to connect to the database: ', error);
    }
  }
  checkDatabaseConnection();

