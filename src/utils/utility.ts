import sequelize from "../config/database";
import User from "../models/Userr";

 
// export const getSubUsersPoints = async (uid: number, path: string, memo: Record<number, number> = {})             :                Promise<     [number, Record<number, number>]> => {
//     if (memo[uid]) {
  
//       return [memo[uid], memo];
//     }
  
//     const sql = `SELECT id, path, ap::REAL, balance::REAL, credit_amount::REAL, exposure_amount::REAL, user_type FROM users WHERE id != ${uid} AND path::ltree ~ '${path}.*{1}'::lquery`;
  
//     const users = await sequelize.query(sql, { model: User, mapToModel: true }).catch((err: Error) => err);
  
//     if (users instanceof Error) {
//       memo[uid] = 0.00;
  
  
//       return [0.00, memo];
//     }
  
//     let userPoints = 0.00;
  
//     for (let i = 0; i < users.length; i++) {
//       if (users[i].userType === 'USER') {
//         const _userPoints = (users[i].balance - users[i].creditAmount);
  
//         memo[users[i].id] = Number(_userPoints.toFixed(2));
//         userPoints += memo[users[i].id];
//        console.log("This is user in the forloop function",userPoints);
//       } else {
//         const [_userPoints] = await getSubUsersPoints(users[i].id, users[i].path, memo);
//         memo[users[i].id] = Number(_userPoints.toFixed(2));
//         userPoints += memo[users[i].id];
//          console.log("This is master in the forloopfunctions")
//       }
//     }
  
//     memo[uid] = Number(userPoints.toFixed(2));
  
  
//     return [memo[uid], memo];
// };
export const getSettlementPoints = async (uid: number, path: string, ap: number, parentAp: number): Promise<number> => {
    const sql = `SELECT id, path, ap::REAL, balance::REAL, credit_amount::REAL, exposure_amount::REAL, user_type FROM users WHERE id != ${uid} AND path::ltree ~ '${path}.*{1}'::lquery`;
  
    const users = await sequelize.query(sql, { model: User, mapToModel: true }).catch((err: Error) => err);
  
    if (users instanceof Error) {
      return 0.00;
    }
  
    let settlementPoints = 0.00;
  
    for (let i = 0; i < users.length; i++) {
      if (users[i].userType === 'USER') {
        const _userPoints = (users[i].balance - users[i].creditAmount);
        const _settlementPoints = (_userPoints * (100 - ((100 - ap) + (parentAp > 0 ? 100 - parentAp : 0)))) / 100;
        settlementPoints += Number(_settlementPoints.toFixed(2));
      } else {
        const [_userPoints] = await getSubUsersPoints(users[i].id, users[i].path);
        const _settlementPoints = (_userPoints * (100 - users[i].ap)) / 100;
        settlementPoints += Number(_settlementPoints.toFixed(2));
      }
    }
  
    return settlementPoints;
  }

  // export async function getTotalUserExposure(uid: number, path: string): Promise<{ totalExposure: number, totalbalance: number } | Error> {
  //   try {
  
  //     const sql = `
  //           SELECT 
  //               id, 
  //               path, 
  //               ap::REAL, 
  //               balance::REAL, 
  //               credit_amount::REAL, 
  //               exposure_amount::REAL, 
  //               user_type 
  //           FROM 
  //               users 
  //           WHERE 
  //               id != ${uid} 
  //               AND path::ltree ~ '${path}.*{1}'::lquery
  //       `;
  
  //     const users = await sequelize.query(sql, { model: User, mapToModel: true });
  
  
  //     let totalExposure = 0;
  //     let totalbalance = 0;
  //     //   users.forEach(user => {
  //     //     totalExposure += Number(user?.exposureAmount);
  //     //     totalbalance += Number(user?.balance);
  //     // });
  //     for (let i = 0; i < users.length; i++) {
  //       // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //       let result: any;
  //       if (users[i].userType === 'MASTER') {
  
  //         result = await getTotalUserExposure(
  //           users[i]?.id,
  //           users[i]?.path
  //         );
  
  //         totalbalance = totalbalance + result.totalbalance + users[i].balance;
  //         totalExposure = totalExposure + result.totalExposure + users[i].exposureAmount;
  //         console.log("This is master total balance and total exposure ",totalbalance, "+" ,totalExposure);
  //       }
  //       else {
  //         totalbalance = totalbalance + users[i].balance;
  //         totalExposure = totalExposure + users[i].exposureAmount;
  //         console.log("This is user total balance and total exposure ",totalbalance, "+" ,totalExposure);
  //       }
  //     }
  
  //     return { totalExposure, totalbalance };
  //   } catch (error) {
  
  //     return new Error('Error fetching user exposure data');
  //   }
  // }

  export const getSubUsersPoints = async (uid: number, path: string, memo: Record<number, number> = {}): Promise<[number, Record<number, number>]> => {
    if (memo[uid]) {
      return [memo[uid], memo];
    }
  
    const sql = `SELECT id, path, ap::REAL, balance::REAL, credit_amount::REAL, exposure_amount::REAL, user_type FROM users WHERE id != ${uid} AND path::ltree ~ '${path}.*{1}'::lquery`;
    const users = await sequelize.query(sql, { model: User, mapToModel: true }).catch((err: Error) => err);
    // console.log('Sub Users Query Result:', users);
  
    if (users instanceof Error) {
      memo[uid] = 0.00;
      return [0.00, memo];
    }
  
    let userPoints = 0.00;
  
    for (let i = 0; i < users.length; i++) {
      if (users[i].userType === 'USER') {
        const _userPoints = (users[i].balance - users[i].creditAmount);
        memo[users[i].id] = Number(_userPoints.toFixed(2));
        userPoints += memo[users[i].id];
        //console.log(`User Points in loop for ID ${users[i].id}:`, userPoints);
      } else {
        const [_userPoints] = await getSubUsersPoints(users[i].id, users[i].path, memo);
        memo[users[i].id] = Number(_userPoints.toFixed(2));
        userPoints += memo[users[i].id];
      // console.log('Master Points in loop:',userPoints);
      }
    }
  
    memo[uid] = Number(userPoints.toFixed(2));
    return [memo[uid], memo];
  };

  export async function getTotalUserExposure(uid: number, path: string): Promise<{ totalExposure: number, totalbalance: number } | Error> {
    try {
      const sql = `
        SELECT 
            id, 
            path, 
            ap::REAL, 
            balance::REAL, 
            credit_amount::REAL, 
            exposure_amount::REAL, 
            user_type 
        FROM 
            users 
        WHERE 
            id != ${uid} 
            AND path::ltree ~ '${path}.*{1}'::lquery
      `;
      const users = await sequelize.query(sql, { model: User, mapToModel: true });
      // console.log('User Exposure Query Result:', users);
  
      let totalExposure = 0;
      let totalbalance = 0;
  
      for (let i = 0; i < users.length; i++) {
        let result: any;
        if (users[i].userType === 'MASTER') {
          result = await getTotalUserExposure(users[i]?.id, users[i]?.path);
          totalbalance += result.totalbalance + users[i].balance;
          totalExposure += result.totalExposure + users[i].exposureAmount;
        //  console.log(`Master Total Balance and Exposure for ID ${users[i].id}:`, totalbalance, totalExposure);
        } else {
          totalbalance += users[i].balance;
          totalExposure += users[i].exposureAmount;
         // console.log(`User Total Balance and Exposure for ID ${users[i].id}:`, totalbalance, totalExposure);
        }
      }
  
      return { totalExposure, totalbalance };
    } catch (error) {
      return new Error('Error fetching user exposure data');
    }
  }
  
