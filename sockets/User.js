const { ObjectId } = require('mongodb'); // If you're using the native MongoDB driver

class User {
  constructor(id, login) {
    this.id = id;
    this.isLogin = login;
    this.fullname = '';
    this.objectId = new ObjectId(id); // Pre-convert once
  }

  static getOnlineUser() {
    let onlineUser = [];

    /*this.users.forEach((value, key) => {
      if (value.isLogin) {
        onlineUser.push(value.fullname);
      }
    }); */

    this.users.forEach((user, socketId) => {
      if (user.isLogin) {
        onlineUser.push({
          socketId,
          userId: user.id,
          fullname: user.fullname,
        });
      }
    });

    return onlineUser;
  }

  static getSocketIdByUserId(userId) {
    // Default socketId to undefined if no match is found
    let socketId = undefined;



    //console.log(this.users, 'from getSocketIdByUserId');
    //console.log(userId, 'from getSocketIdByUserId');



    // Iterate through all users in the Map
    this.users.forEach((user, id) => {

      //console.log(user, 'from getSocketIdByUserId');
      const objectId = new ObjectId(userId);

      //console.log(objectId, 'from getSocketIdByUserId111');
      //console.log(user.objectId, 'from getSocketIdByUserId222');



      // Ensure both values are strings before comparison
      if (user.objectId.toString() === objectId.toString()) {
       // console.log(user.objectId, 'from getSocketIdByUserId333');
        //console.log(objectId, 'from getSocketIdByUserId444');
        
        socketId = id; // Socket ID is the key in the Map
      }
    });

    // Return the found socketId, or undefined if no match was found
    return socketId;
  }


    static getSocketIdByUserIdV2(userId) {
    const objectId = new ObjectId(userId);

    for (const [socketId, user] of this.users.entries()) {
      if (user?.objectId?.toString() === objectId.toString()) {
        return socketId;
      }
    }

    return undefined;
  }

    // 🔥 New: Broadcast user status to all clients
  static broadcastStatus(io, userId, is_active) {
    console.log(userId, is_active );
    
    io.emit('user-status-update', {
      userId,
      is_active,
    });
  }
}

// Initialize the `users` Map
User.users = new Map();

module.exports = User;
