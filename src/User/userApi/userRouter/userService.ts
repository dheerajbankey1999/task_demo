import transactions  from "../../../models/Transactions";
import User from "../../../models/Userr";
 
import { JwtAuthPayload, JwtAuthPayloadForRegisterShiv } from "../../../types";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import response from "../../../response";
import dotenv from 'dotenv';
import md5 from "md5";
import activity from "../../../utils/activity";
import sequelize from "../../../config/database";
import { getSettlementPoints, getSubUsersPoints, getTotalUserExposure } from "../../../utils/utility";
import { ValidationError } from "sequelize/types/errors";
import { Sequelize } from "sequelize";
 
dotenv.config();
interface userData{
  id:number;
  path:string;
  username:string;
  user_type:string;
}

interface UserBetData{
  id: number;
  username: string;
  user_type:string;
  path :string;
  total_user_profit: number;
  total_user_loss: number;
}
interface UserData{
  to:number;
  amount:number;
}
class UserService {
  shivRegisterUser = async (
    fullname: string,
    username: string,
    dialCode: string,
    phoneNumber: string,
    password: string,
    email?: string,
    userType?: string,
   ): Promise<any> => {

    try {
      const ownerPath = await User.findOne({ where: { userType: "OWNER" } });
      const createdUser = await User.create({
        fullname: fullname,
        username: username,
        dialCode: dialCode,
        phoneNumber: phoneNumber,
        password: password,
        email: email,
        userType: userType,
      });
      console.log('user created ', createdUser);
      if (ownerPath && createdUser) {
        await User.update({ path: `${ownerPath.path}.${createdUser.id}` }, { where: { id: createdUser.id } });
      }
      const payload: JwtAuthPayloadForRegisterShiv = {
        _uid: createdUser.id,
      };

      const jwtToken = jwt.sign(
        { ...payload },
        'mysecret' as Secret,
        { expiresIn: "1 days" } as SignOptions
      );
      return { message: 'User registered successfully', data: jwtToken };
    } catch (err) {
      console.log('err', err);
      return { error: 'user registration failed' };
    }
  }
  authUser = async (
    username: string,
    password: string,
    ip: string
   ): Promise<
    { data?: { token: string; ut: string; isPasswordChanged: boolean; }; error?: string } | Error
   > => {
    console.log('useeee', username);
    const user = await User.findOne({ where: { username: username } }).catch(
      (err: Error) => err
    );

    if (user instanceof Error) {
      return user;
    }
    // console.log('useris deleted cheacking ', user?.isDeleted);
    if (user) {
      const exp = Math.floor(Date.now() / 1000) + (60 * 60 * 12);
      if (user.password !== md5(password)) return { error: response.MSG002 };
      else if (user.status === -1) return { error: response.MSG001 };
      else if (user.lock) return { error: response.MSG003 };
      else if (user.isDeleted) return { error: response.MSG021 };

      else {
        const payload: JwtAuthPayload = {
          _uid: user.id,
          _level: user.level,
          _path: user.path,
          _status: user.status,
          _privileges: user.privileges,
          _ut: user.userType,
          _transactionCode: user.transactionCode,
          exp: exp
        };

        try {
          const jwtToken = jwt.sign(
            { ...payload },
            process.env.JWT_TOKEN_SECRET as Secret,
            {} as SignOptions
          );

          activity(user.id, ip, "Logged In");
          return {
            data: {
              token: jwtToken,
              ut: user.userType,
              isPasswordChanged: user.isPasswordChanged
            },
          };
        } catch (err) {
          if (err instanceof Error) {
            return err;
          } else {
            return new Error("Unhandled error occurred");
          }
        }
      }
    } else {
      return { error: response.MSG001 };
    }
  };

  getUserDetails = async (
    uid: number,
    path: string
  ): Promise<
    { data?: Record<string, unknown>; error?: string; code?: number } | Error
  > => {
    const sql = `SELECT fullname, username, path , email ,  dob , telegramid , instagramid , whatsappnumber , city, ap::REAL, parent_ap::REAL, privileges, status, remark, dial_code, phone_number, balance, credit_amount,id, exposure_amount, user_type, lock, bet_lock, initial_setup FROM users WHERE id = ${uid} AND '${path}' ~ path`;
  
    const users = await sequelize
      .query(sql, { model: User, mapToModel: true })
      .catch((err: Error) => err);
  
    const use = await User.findByPk(uid);
    console.log("This is user:", use);
  
    if (use) {
      console.log("This is exposureAmount:", use.exposureAmount);
    }
  
    if (users instanceof Error) return users;
    if (!users.length) return { error: response.MSG001 };
    return { data: { ...users[0].toJSON() } };
};
  
  
  getParticulerUserDetails = async (uid: number): Promise<
    { data?: Record<string, unknown>; error?: string; code?: number } | Error
   > => {
    const sql = `SELECT fullname, username, path, email ,  dob , telegramid , instagramid , whatsappnumber , city, ap::REAL, parent_ap::REAL, privileges, status, remark, dial_code, phone_number, balance, credit_amount,id, exposure_amount, user_type, lock, bet_lock, initial_setup FROM users WHERE id = ${uid} `;
    const users = await sequelize
      .query(sql, { model: User, mapToModel: true })
      .catch((err: Error) => err);
    //console.log("This is users", users);
    if (users instanceof Error) return users;
    if (!users.length) return { error: response.MSG001 };

    let settlementPoint: number;
    if (users[0].userType !== 'USER') {
      settlementPoint = await getSettlementPoints(
        uid,
        users[0].path,
        users[0].ap,
        users[0].parentAp
      )
    }
    else {
      settlementPoint = 0;
    }
    return { data: { ...users[0].toJSON(), settlementPoint } };
  }
  createSubUser = async (
    uid: number,
    userType: string,
    path: string,
    fullname: string,
    username: string,
    password: string,
    dialCode: string,
    phoneNumber: string,
    city: string,
    level: number,
    ap: number,
    creditAmount: number,
    subUserType: string,
    remark: string,
    privileges?: string[]
   ): Promise<{ data?: boolean; error?: string } | Error> => {
    const validUserTypes = ["OWNER", "SUPER_MASTER", "MASTER", "USER"];

    if (
      validUserTypes.indexOf(subUserType) <= validUserTypes.indexOf(userType)
    ) {
      return { error: response.MSG012 };
    }

    const user = await User.findOne({
      where: { id: uid },
      attributes: ["creditAmount","ap","user_type"],
    }).catch((err: Error) => err);
    const userphone = await User.findOne({
      where: { phoneNumber: phoneNumber }
    }).catch((err: Error) => err);
    if (userphone){
      // console.log('herre1');
      return { error: response.MSG021 };
      // console.log('222222222');
    }

    if (user instanceof Error) {
      return user;
    } else if (!user) {
      return { error: response.MSG001 };
    } else if (+user.creditAmount < +creditAmount) {
      return { error: response.MSG015 };
    }
    
    const subUser = await User.create({
      fullname,
      username,
      password,
      dialCode,
      phoneNumber,
      transactionCode: md5(password),
      city,
      level,
      ap,
      parentAp: subUserType === "MASTER" ? user.ap : 0.0,
      balance: 0.0,
      creditAmount: 0.0,
      privileges: null,
      userType: subUserType,
      remark,
    }).catch((err: Error) => err);

    if (subUser instanceof Error) {
      if (Object.prototype.hasOwnProperty.call(subUser, "errors")) {
        const validationError = subUser as ValidationError;
        const errors = validationError.errors.map((e) => e.message);
        return errors.length
          ? { error: errors[0] }
          : new Error("Unknown error occurred");
      } else {
        return subUser;
      }
    } else {
      User.update(
        { path: `${path}.${subUser.id}` },
        { where: { id: subUser.id } }
      ).catch((err: Error) => err);
    
     
     // this.transferCreditAmount(uid, subUser.id, creditAmount, 'opening balance');
      return { data: true };
    }
  };
 
correctionBalance = async (eventId: number,selectionId:string): Promise<void> => {
    const subquery = `SELECT "to", amount FROM transactions WHERE event_id = ${eventId} AND selection_id= '${selectionId}'`;
    const [userResults, userMetadata] = await sequelize.query(subquery);
    console.log("This is userResults",userResults);
     const users = userResults as UserData[];
   try{
    for (let user of users) {
      const amount = user.amount;
      const id= user.to;
      console.log("This is the userid",id);
  if(amount>0){
       console.log("This is if condition");
       await User.update(
        { balance: Sequelize.literal(`balance - ${amount}`) },
        { where: { id: id } }
        ).catch((err: Error) => err);
      }
       else{
        console.log("This is else conditions");
         await User.update(
           { balance: Sequelize.literal(`balance - (${amount})`) },
           { where: { id: id } }
           ).catch((err: Error) => err);
           }
       }
   }catch(err){
    console.log("This is error",err);
   }
}

getMaster = async (
  uid: number,
  path: string,
  offset?: number,
  limit?: number,
  search ?:string
  ): Promise<{ totalCount: any, data?: Record<string, unknown>[]; error?: string } | Error> => {

  // SQL query to fetch users
  const sql = `SELECT id, username, city, ap::REAL, new_users_access, parent_ap::REAL, privileges, status, remark, dial_code, phone_number, balance::REAL, credit_amount::REAL, exposure_amount::REAL, user_type, lock, bet_lock, path 
  FROM users 
  WHERE id != ${uid} AND path::ltree  ~ '${path}.*{1}'::lquery AND is_deleted = false AND  user_type     != 'USER' ${search ? `AND username ~* '${search}'` : ''}
  ORDER BY id DESC 
  OFFSET ${offset ? offset : 0} 
   ROWS FETCH NEXT ${limit ? limit : 10} ROWS ONLY
   `;

  // SQL query to count total users
  const sqlcount = `
   SELECT COUNT(*) 
   FROM users
   WHERE id != ${uid}
   AND path::ltree ~ '${path}.*{1}'::lquery ${search ? `AND username ~* '${search}'` : ''}
   AND is_deleted = false
   AND user_type != 'USER'
   `;

  const totalCount = await sequelize.query(sqlcount, { model: User, mapToModel: true });
  //console.log('Total Count Query Result:', totalCount);

  const users = await sequelize.query(sql, { model: User, mapToModel: true }).catch((err: Error) => err);
  //console.log('Users Query Result:', users);

  if (users instanceof Error) {
    return users;
  } else {
    const _users = [];
    const _memo: Record<number, number> = {};

    for (let i = 0; i < users.length; i++) {
      let userPoints: number;
      let userExposure;
      let result: any;

      if (users[i].userType !== "USER") {
        [userPoints] = await getSubUsersPoints(users[i].id, users[i].path, _memo);
      //  console.log(`Master User Points for ID ${users[i].id}:`, userPoints);
      } else {
        userPoints = Number((users[i].balance - users[i].creditAmount).toFixed(2));
        _memo[users[i].id] = userPoints;
      // console.log(`User Points for ID ${users[i].id}:`, userPoints);
      }

      if (users[i].userType !== "USER") {
        result = await getTotalUserExposure(users[i]?.id, users[i]?.path);
      }
      userExposure = result?.totalExposure;
    //  console.log(`User Exposure for ID ${users[i].id}:`, userExposure);

      _users.push({ ...users[i].toJSON(), userPoints, userExposure });
    }

    return { totalCount, data: _users };
  }
};
downlineUser = async(
  username: string,
  path: string,
  startDate: string,
  endDate: string,
  limit: number,
  offset: number
 ):Promise<void> =>{
  const userQuery = `
  SELECT id, username, path, user_type
  FROM users 
  WHERE
  username != '${username}' 
   AND path::ltree ~ '${path}.*{1}'::lquery AND is_deleted = false
  ORDER BY id DESC
  OFFSET ${offset ? offset : 0} 
  FETCH NEXT ${limit ? limit : 10} ROWS ONLY
  `;
  const countQuery = `
  SELECT COUNT(*) AS total_count
  FROM users
  WHERE
  username != '${username}' 
  AND path::ltree ~ '${path}.*{1}'::lquery AND is_deleted = false`;
  const [countResults, countMetadata] = await sequelize.query(countQuery);
  const totalCount: number = (countResults[0] as any)?.total_count ?? 0;

  const [userResults, userMetadata] = await sequelize.query(userQuery);
  const users = userResults as userData[];
  console.log("This is user without loop", users);
  const userBetDataList: UserBetData[] = [];
  for(const user of users){
    const { username, id, user_type,path } = user; 
    const betQuery = `
        SELECT
            ${id} as id,
            '${username}' as username,
            COALESCE( SUM(
              CASE
                WHEN bet_on = 'BACK' AND status = 1 THEN
                  CASE
                    WHEN market = 'session' THEN ROUND(stake * percent / 100, 2)
                    ELSE ROUND(stake * (price - 1), 2)
                  END
                WHEN bet_on = 'LAY' AND status = 1 THEN
                  CASE
                    WHEN market = 'session' THEN ROUND(stake, 2)
                    ELSE ROUND(stake, 2)
                  END
                ELSE 0
              END
            ), 0) AS total_user_profit,
            COALESCE(SUM(
              CASE
                WHEN bet_on = 'BACK' AND status = 10 THEN
                  CASE
                    WHEN market = 'session' THEN ROUND(stake, 2)
                    ELSE ROUND(stake, 2)
                  END
                WHEN bet_on = 'LAY' AND status = 10 THEN
                  CASE
                    WHEN market = 'session' THEN ROUND(stake * percent / 100, 2)
                    ELSE ROUND(stake * (price - 1), 2)
                  END
                ELSE 0
              END
            ), 0) AS  total_user_loss
        FROM
            public.bets
        WHERE
            username = '${username}'
            AND updated_at >= '${startDate}' 
            AND updated_at <= '${endDate}'
        GROUP BY
            username
    `;
   
    const [betResults, betMetadata] = await sequelize.query(betQuery);
    const userBetDataArray = betResults as UserBetData[];
         if(betResults.length == 0){
      userBetDataList.push({
        id,
        username,
        user_type,
        path,
        total_user_profit: 0,
        total_user_loss: 0,
    })
     }else{
      const updatedUserBetDataArray=  userBetDataArray.map(data=>({
        ...data,
        id,
        user_type
      }));
      userBetDataList.push(...updatedUserBetDataArray);
     }
    console.log("This is userbetdatalist", userBetDataArray);
  }
}
};


export default UserService;

 