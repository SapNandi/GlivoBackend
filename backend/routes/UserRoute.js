const express = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  getMe,
  getSingleUser,
  getAllUser,
  deleteUser,
  updatePassword,
  updateProfile,
  requestOtp,
  updateRole,
} = require("../controllers/userController");
const { isAuthenticatedUser, authorizeRoles } = require("../Middleware/auth");

const router = express.Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/password/forgot").post(forgotPassword);
router.route("/password/reset/:token").put(resetPassword);
router.route("/logout").get(logoutUser); // Logging Out User
router.route("/me").get(isAuthenticatedUser, getMe); // Get User Details
router.route("/password/update").put(isAuthenticatedUser, updatePassword); // Update Password
router.route("/me/update").put(isAuthenticatedUser, updateProfile); // Profile Updates
router
  .route("/admin/users")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getAllUser); // Get all User by admin
router
  .route("/admin/user/:id")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getSingleUser);
router
  .route("/admin/user/:id")
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteUser);

router.route("/requestotp").post(isAuthenticatedUser, requestOtp);

router.route("/updaterole").post(isAuthenticatedUser, updateRole);

module.exports = router;
