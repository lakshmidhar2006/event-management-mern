import express from 'express';
import { registerUser,loginUser } from '../controllers/authController.js';
// import passport from "passport";
// import { googleAuthCallback } from "../controllers/authController.js";

const router = express.Router();

router.post('/register',registerUser );
// router.post('/otp-verify',otpverify);
router.post('/login',loginUser );
// router.get("/google", passport.authenticate("google", { scope: ["profile", "email"]   }));

// router.get(
//   "/google/callback",
//   passport.authenticate("google", { session: false, failureRedirect: "https://eventhon.netlify.app/login" }),
  
//   (req, res, next) => {
//     console.log("User object:", req.user);
//     next();
//   },
//   googleAuthCallback
// );


export default router;
