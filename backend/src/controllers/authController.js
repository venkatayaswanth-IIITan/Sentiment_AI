const { validationResult } = require('express-validator');
const authService = require('../services/authService');

class AuthController {
  async signup(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
          message: errors.array()[0].msg,
        });
      }

      const { email, password, name } = req.body;
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.connection.remoteAddress;

      const result = await authService.signup({
        email,
        password,
        name,
        userAgent,
        ipAddress,
      });

      res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async signin(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
          message: errors.array()[0].msg,
        });
      }

      const { email, password } = req.body;
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.connection.remoteAddress;

      const result = await authService.signin({
        email,
        password,
        userAgent,
        ipAddress,
      });

      res.json({
        success: true,
        message: 'Signed in successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res) {
    res.json({
      success: true,
      data: {
        user: req.user,
      },
    });
  }

  async signout(req, res, next) {
    try {
      await authService.signout(req.token);
      res.json({
        success: true,
        message: 'Logged out successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
