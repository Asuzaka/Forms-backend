const ResponseError = require("../services/ResponseError");
const User = require("../models/userModel");
const catchAsync = require("../services/CatchAsync");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../services/Nodemailer");
const { promisify } = require("util");
const axios = require("axios");

exports.authenticated = (req, res, next) => {
  if (!req.user) {
    return next(new ResponseError("Not authenticated", 401));
  }
  res.status(200).json({ status: "success", data: req.user });
};

exports.signout = (req, res, next) => {
  res.cookie("jwt", "logged out", { expires: new Date(0), httpOnly: true });
  res.status(200).json({ status: "success" });
};

exports.optionalAuth = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.signedCookies?.jwt) {
    token = req.signedCookies.jwt;
  }

  if (!token) return next(); // No token → guest user

  try {
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.changedPasswordAfter(decoded.iat)) {
      return next(); // Invalid user or password recently changed
    }

    req.user = user; // Authenticated user
  } catch (err) {
    // Invalid token → treat as guest
  }

  next();
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // Getting token
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.signedCookies?.jwt) {
    // Changed to signedCookies
    token = req.signedCookies.jwt;
  }

  if (!token) {
    return next(
      new ResponseError(
        "You are not logged in. Please log in to get acces",
        401
      )
    );
  }
  // Token verification
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // Check if user still exist
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(
      new ResponseError(
        "The user belonging to this token no longer exists",
        401
      )
    );
  }
  // Check is user changed password after the token was issued
  if (user.changedPasswordAfter(decoded.iat)) {
    return next(
      new ResponseError(
        "User recently changed password! Please log in again",
        401
      )
    );
  }

  // Check if user isn't blocked
  if (user.status === "blocked") {
    return next(new ResponseError("User is blocked", 401));
  }

  // Acces to protected route
  req.user = user;
  next();
});

exports.signup = catchAsync(async (req, res, next) => {
  // Creating user
  await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  // Getting user
  const user = await User.findOne({ email: req.body.email });
  // Creating verify token for user
  const userToken = user.createUserToken();
  await user.save({ validateBeforeSave: false });
  //  Send back an email
  const verfiyUrl = `${process.env.FRONTEND_URL}/verify/${userToken}`;
  try {
    await sendEmail({
      email: user.email,
      subject: "Your verify link is valid for 24 hours",
      text: "Verify email",
      name: user.name,
      url: verfiyUrl,
    });

    res.status(200).json({
      status: "succes",
      message: "Verify link sent to email",
    });
  } catch (error) {
    // Immidetely delete user not to cause problems
    await user.deleteOne();
    return next(
      new ResponseError(
        "There was an error sending email. Try again later",
        500
      )
    );
  }
});

exports.googleLogin = catchAsync(async (req, res, next) => {
  const { token: googleToken } = req.body;

  if (!googleToken) return next(new ResponseError("No token provided", 400));

  // Verify token and get user info from Google
  const response = await axios.get(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${googleToken}`
  );

  const { email, name, sub: googleId, picture } = response.data;

  if (!email || !googleId) return next(new ResponseError("Invalid token", 400));

  // Find or create user
  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name,
      email,
      photo: picture,
      provider: "google",
      providerId: googleId,
      isVerified: true,
    });
  }

  // Send JWT and cookie
  createTokenAndSend(user, res, { statusCode: 200 });
});

exports.githubLogin = catchAsync(async (req, res, next) => {
  const { code } = req.body;

  if (!code) return next(new ResponseError("No code provided", 400));

  // Step 1: Exchange code for access token
  const { data: tokenData } = await axios.post(
    "https://github.com/login/oauth/access_token",
    {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${process.env.FRONTEND_ADDRESS}/github/callback`,
    },
    {
      headers: { Accept: "application/json" },
    }
  );

  const accessToken = tokenData.access_token;
  if (!accessToken) return next(new ResponseError("Failed to get token", 400));

  // Step 2: Fetch user profile and email
  const { data: profile } = await axios.get("https://api.github.com/user", {
    headers: { Authorization: `token ${accessToken}` },
  });

  const { data: emails } = await axios.get(
    "https://api.github.com/user/emails",
    {
      headers: { Authorization: `token ${accessToken}` },
    }
  );

  const primaryEmail =
    emails.find((e) => e.primary && e.verified)?.email || emails[0]?.email;

  if (!primaryEmail) return next(new ResponseError("No verified email", 400));

  // Step 3: Find or create user
  let user = await User.findOne({ email: primaryEmail });

  if (!user) {
    user = await User.create({
      name: profile.name || profile.login,
      email: primaryEmail,
      photo: profile.avatar_url,
      provider: "github",
      providerId: profile.id,
      isVerified: true,
    });
  }

  // Send JWT and cookie
  createTokenAndSend(user, res, { statusCode: 200 });
});

exports.verify = catchAsync(async (req, res, next) => {
  // Getting token from params
  const { token } = req.params;
  // hashing token
  const userToken = crypto.createHash("sha256").update(token).digest("hex");
  // Finding user by comparing hashed token
  const user = await User.findOne({ userToken });
  if (!user) {
    return next(new ResponseError("Invalid link or expired", 400));
  }
  user.isVerified = true;
  user.userToken = undefined;
  await user.save({ validateBeforeSave: false });

  // Sending response
  createTokenAndSend(user, res, {
    statusCode: 200,
  });
});

exports.signin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if input is email or username
  const user = await User.findOne({ email: email }).select("+password");

  // Check passwords
  if (!user || !(await user.confirmPassword(password, user.password))) {
    return next(new ResponseError("email or password is incorrect", 401));
  }
  // Check if user has verified email
  if (!user.isVerified) {
    return next(new ResponseError("Your email is not verified", 401));
  }
  // Send response
  createTokenAndSend(user, res, { statusCode: 200 });
});

exports.accesTo = (...roles) => {
  return (req, res, next) => {
    // Checking if user has permission
    const permission = roles.includes(req.user.role);
    if (!permission) {
      return next(
        new ResponseError(
          "You do not have permission to perform this action",
          403
        )
      );
    }
    // If so, continue
    next();
  };
};

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get token from params
  let token = req.params.token;
  // Encode token
  token = crypto.createHash("sha256").update(token).digest("hex");
  // Find user by Encoded token
  const user = await User.findOne({
    passwordToken: token,
    passwordTokenExpire: { $gte: Date.now() },
  });
  if (!user) {
    return next(new ResponseError("Token expired or invalid", 400));
  }

  // Get pass/confirm from body
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordToken = undefined;
  user.passwordTokenExpire = undefined;
  // Change doc
  await user.save();

  createTokenAndSend(user, res, { statusCode: 200 });
});

exports.forgetPassword = catchAsync(async (req, res, next) => {
  // Get an email from body
  const { email } = req.body;
  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    return next(new ResponseError("No user with this email", 400));
  }
  // Create token
  const resetToken = user.createResetToken();
  await user.save();
  // Send Mail
  const resetUrl = `${process.env.FRONTEND_URL}/resetPassword/${resetToken}`;
  try {
    await sendEmail({
      email: user.email,
      subject: "Your reset link is valid for 15 minutes",
      text: "Reset Password",
      name: user.name,
      url: resetUrl,
    });

    res.status(200).json({
      status: "succes",
      message: "Reset link sent to email",
    });
  } catch (error) {
    return next(
      new ResponseError(
        "There was an error sending email. Try again later",
        500
      )
    );
  }
});

function createTokenAndSend(user, res, options) {
  // Creating jwt Token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    secure: true,
    httpOnly: true,
    sameSite: "None",
    signed: true,
  };

  // Sending cookies
  res.cookie("jwt", token, cookieOptions);
  res.status(options.statusCode).json({ status: "succes", token });
}
