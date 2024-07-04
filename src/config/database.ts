import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';


dotenv.config();

const sequelize = new Sequelize(
  process.env.DATABASE || '',
  process.env.DATABASE_USER || '',
  process.env.PASSWORD ,
  {
    dialect: 'postgres',
    host: process.env.DATABASE_HOST || '',
    port:Number(process.env.DATABASE_PORT), // Default port 5432 if not provided
    logging: false,
  }
);

export default sequelize;

