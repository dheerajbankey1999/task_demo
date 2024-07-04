import UserService from "./userService";
import { Request, Response } from "express";
import User from '../../../models/Userr';
import { AuthUserPayload, CreateUserPayload, GetParticulerUserDetailsPayload, GetSubUsersPayload, GetUserDetailsPayload, ShivRegisterUserPayload,} from "./payloads";
import responses from "../../../response";
import getIP from "../../../utils/getIP";
import md5 from "md5";
const userModel = new UserService();



class UserController {
sendHttpResponse(
    res: Response,
    serverResponse: { data?: unknown; error?: string; code?: number } | Error
   ): void {
    if (serverResponse instanceof Error) {
      res.status(500).send(serverResponse.message);
    } else if (serverResponse.error) {
      res.status(serverResponse.code || 422).send(serverResponse.error);
    } else if (typeof serverResponse.data === "object") {
      res.status(200).json(serverResponse.data);
    } else {
      res.status(200).send(serverResponse.data);
    }
  }

  shivRegisterUser = async (req: Request, res: Response): Promise<void> => {
    const args: ShivRegisterUserPayload = { ...req.body };
    console.log("This is args",args);
    if (!args.firstname || !args.lastname || !args.dialCode || !args.phoneNumber || !args.password || !args.username ) {
      res.status(400).end();
    } else {
      
      const user = await User.findOne({
        where: { username: args.username }
      }).catch((err: Error) => err);
      console.log("These is user",user);
      if (user) {
        res.status(400).json({ error: responses.MSG020 });
        return;
      }
      if (args.email) {
        const emailExists = await User.findOne({
          where: { email: args.email }
        });

        if (emailExists) {
          res.status(400).json({ error: 'email already exist' });
          return;
        }
      }
      const phoneNumberExists = await User.findOne({
        where: {
          dialCode: args.dialCode,
          phoneNumber: args.phoneNumber
        }
      });
      if (phoneNumberExists) {
        res.status(400).json({ error: 'phone number already exist' });
        return;
      }
      console.log('QQQQQQQQQQ',args.username,
      args.dialCode,
      args.phoneNumber,
      args.password,
      args.email,
      args.userType);
      const fullname = args.firstname + args.lastname;
      const response = await userModel.shivRegisterUser(
        fullname,
        args.username,
        args.dialCode,
        args.phoneNumber,
        args.password,
        args.email,
        args.userType || "USER"
      );
      res.status(201).send(response);
      return;
    }
  };

  authUser = async (req: Request, res: Response): Promise<void> => {
    const args: AuthUserPayload = { ...req.body, ip: getIP(req) };
    const response = await userModel.authUser(
      args.username || "",
      args.password || "",
      args.ip
    );
    this.sendHttpResponse(res, response);
  };

  getUserDetails = async (req: Request, res: Response): Promise<void> => {
    const query: unknown = req.query;
    if (query && typeof query === "object") {
      const args = { ...query } as GetUserDetailsPayload;
      const response = await userModel.getUserDetails(
        args.uid || args._uid,
        Number(args.uid) ? `${args._path}.${args.uid}` : args._path
      );
      this.sendHttpResponse(res, response);
    } else {
      res.status(400).end();
    };
  };

  getParticulerUserDetails = async (req: Request, res: Response):Promise<void>=>{
    const  query:unknown= req.query;  //Here, query is assigned the type unknown. This means that you cannot directly access properties or methods on query without first checking its type. This can be useful in scenarios where the type of the incoming data is not known upfront and needs to be validated before use.
   // console.log("This is query", query);
    if(query && typeof query ===  "object"){
          const args = {...query} as  GetParticulerUserDetailsPayload;
          const response = await userModel.getParticulerUserDetails(args.id || 0);
          this.sendHttpResponse(res,response);
    }
    else{
      res.status(400).end();
    }
  }
  
  createSubUser = async (req: Request, res:Response):Promise<void> =>{
      const args: CreateUserPayload = req.body;
      if (
        !args._transactionCode ||
        (args.transactionCode !== undefined && args._transactionCode !== md5(args.transactionCode))
      ) {
        res.status(422).send(responses.MSG011);
      }
      const response = await userModel.createSubUser(
        args._uid,
        args._ut,
        args._path,
        args.fullname || "",
        args.username || "",
        args.password || "",
        args.dialCode || "",
        args.phoneNumber || "",
        args.city || "",
        args._level + 1,
        args.ap || 100.0,
        args.creditAmount || 0.0,
        args.userType || "",
        args.remark || "",
        args.privileges
      );
      this.sendHttpResponse(res, response);
  }
  correctionBalance = async(req: Request, res: Response):Promise<void>=>{
    const {eventId,selectionId}= req.body;
    console.log("This is eventId",eventId,selectionId);
       const response =  await userModel.correctionBalance(eventId,selectionId);
          res.status(200).json(response);
  }
  getMaster = async (req: Request, res: Response): Promise<void> => {
    const query: unknown = req.query;

    if (query && typeof query === "object") {
      const args = { ...query } as GetSubUsersPayload;
    console.log("THis is args of the getmaster", args);
      const response = await userModel.getMaster(
        args.uid || args._uid,
        args.path || args._path,
        // Number(args.uid) ? `${args._path}.${args.uid}` : args._path,
        args.offset,
        args.limit,
        args.search

      );

      res.status(200).send(response);
    } else {
      res.status(400).end();
    }
  };
  downlineUser = async(req: Request, res:Response): Promise<void> =>{
    const { limit, offset, startDate, endDate, username, path } = req.query; 
    if(typeof username == "string" && typeof path == "string"){
         const response = await userModel.downlineUser(
          username,
          path,
          startDate as string,
          endDate as string,
          Number(limit),
          Number(offset)
         );
         res.status(200).send(response);
    }else{
      res.status(400).json({error:"Invalid User"});
    }
   
  }
}

export default UserController;