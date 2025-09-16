const express = require('express');
const loanController = require('../controllers/LoanController');
const { authenticate, authorize, authorizeSelfOrLibrarian } = require('../middlewares/auth');
const {
  borrowBookValidation,
  returnBookValidation,
  renewLoanValidation,
  loanIdValidation,
  userIdValidation,
  getUserLoansValidation,
  getAllLoansValidation,
  overdueLoansValidation,
  forceReturnValidation,
  mostBorrowedBooksValidation,
  borrowingEligibilityValidation
} = require('../validators/loanValidators');

const router = express.Router();


router.post('/borrow', authenticate, borrowBookValidation, loanController.borrowBook);

router.post('/:id/return', authenticate, returnBookValidation, loanController.returnBook);

router.post('/:id/renew', authenticate, renewLoanValidation, loanController.renewLoan);

router.post('/:id/force-return', authenticate, authorize('librarian'), forceReturnValidation, loanController.forceReturnBook);

router.get('/my-loans', authenticate, getUserLoansValidation, loanController.getMyLoans);

router.get('/', authenticate, authorize('librarian'), getAllLoansValidation, loanController.getAllLoans);

router.get('/overdue', authenticate, authorize('librarian'), overdueLoansValidation, loanController.getOverdueLoans);

router.get('/statistics', authenticate, authorize('librarian'), loanController.getStatistics);

router.get('/most-borrowed', authenticate, authorize('librarian'), mostBorrowedBooksValidation, loanController.getMostBorrowedBooks);

router.post('/update-overdue', authenticate, authorize('librarian'), loanController.updateOverdueLoans);

router.get('/eligibility', authenticate, borrowingEligibilityValidation, loanController.checkBorrowingEligibility);
router.get('/eligibility/:userId', authenticate, borrowingEligibilityValidation, loanController.checkBorrowingEligibility);

router.get('/member-summary', authenticate, userIdValidation, loanController.getMemberLoanSummary);
router.get('/member-summary/:userId', authenticate, userIdValidation, loanController.getMemberLoanSummary);

router.get('/:id', authenticate, loanIdValidation, loanController.getLoanById);

module.exports = router;