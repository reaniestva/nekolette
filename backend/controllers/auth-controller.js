const express = require(`express`)
const md5 = require(`md5`)
const jwt = require(`jsonwebtoken`)
const userModel = require(`../models/index`).user
const crypto = require('crypto');

const authorize = (request, response, next, token) => {
    let headers = request.headers.authorization;
    let tokenKey = headers && headers.split(" ")[1];
  
    if (tokenKey == null) {
      return response.json({
        success: false,
        message: "Unauthorized User"
      });
    }
  
    // If the token is provided as a parameter, use it directly
    if (token) {
      tokenKey = token;
    }
  
    const secret = generateRandomSecret(); // Generate a random secret for each request
  
    jwt.verify(tokenKey, secret, (error, user) => {
      if (error) {
        return response.json({
          success: false,
          message: "Invalid token"
        });
      }
  
      // Attach the user information to the request object for further use
      request.user = user;
      next();
    });
  };
  
  const authenticate = async (request, response) => {
    let dataLogin = {
      username: request.body.username,
      password: md5(request.body.password)
    };
    
  
    let dataUser = await userModel.findOne({
      where: dataLogin
    });
  
    if (dataUser) {
      let payload = JSON.stringify(dataUser);   
  
      const secret = generateRandomSecret(); // Generate a random secret for each token
      let token = jwt.sign(payload, secret);

  
      return response.json({
        success: true,
        logged: true,
        message: 'Authentication Successed',
        token: token,
        data: dataUser
      });
    }
  
    return response.json({
      success: false,
      logged: false,
      message: 'Authentication Failed. Invalid username or password'   
  
    });
  };
  
  function generateRandomSecret() {
    const randomBytes = crypto.randomBytes(32);
    const sha256Hash = crypto.createHash('sha256').update(randomBytes).digest('hex');
    return sha256Hash;
  }

  const register = async (request, response) => {
    try {
        // Get user input
        const { nama_user, role, username, password } = request.body;

        // Input validation (optional, but recommended)
        if (!nama_user || !role || !username || !password) {
            return response.status(400).json({
                success: false,
                message: 'All fields are required',
            });
        }

        // Check if user already exists
        const existingUser = await userModel.findOne({
            where: { username: username },
        });

        if (existingUser) {
            return response.status(409).json({
                success: false,
                message: 'Username already exists',
            });
        }

        // Hash the password using bcrypt
        const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

        // Create a new user object with hashed password
        const newUser = {
            nama_user: nama_user,
            role: role,
            username: username,
            password: hashedPassword, // Store hashed password
        };

        // Save the new user to the database
        await userModel.create(newUser);

        return response.status(201).json({
            success: true,
            message: 'User registration successful',
            data: { username: newUser.username, nama_user: newUser.nama_user, role: newUser.role }, // Avoid returning hashed password
        })

    } catch (error) {
        return response.status(500).json({
            success: false,
            message: `Registration failed: ${error.message}`,
        })
    }
}

module.exports = { authenticate, authorize, register }