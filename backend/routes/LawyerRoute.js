const express = require("express");
const {
  getAllLawyers,
  createLawyer,
  updateLawyer,
  deleteLawyer,
  getLawyerDetails,
  rateReviewLawyer,
  getAllReview,
  getMyLawyer
} = require("../controllers/lawyerController");

const { isAuthenticatedUser, authorizeRoles } = require("../Middleware/auth");

const router = express.Router();

router.route("/lawyer").get(getAllLawyers);

router.route("/lawyer/my").get(isAuthenticatedUser, authorizeRoles("admin","seller") ,getMyLawyer);

router
  .route("/lawyer/feedback/:id")
  .post(isAuthenticatedUser, rateReviewLawyer);   // Post Review and Ratings of a lawyer

router.route("/lawyer/reviews/:id").get(isAuthenticatedUser, getAllReview);  // Get all reviews of a Lawyer

router
  .route("/lawyer/new")
  .post(isAuthenticatedUser, authorizeRoles("admin","seller"), createLawyer);

router
  .route("/lawyer/:id")
  .put(isAuthenticatedUser, authorizeRoles("admin"), updateLawyer);

router
  .route("/lawyer/:id")
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteLawyer);

router.route("/lawyer/:id").get(getLawyerDetails);

module.exports = router;
