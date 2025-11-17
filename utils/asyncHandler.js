/**
 * Async Handler Wrapper
 * 
 * Wraps async route handlers to automatically catch errors and pass them to error middleware
 * Eliminates need for try-catch blocks in every controller
 * 
 * Usage:
 * export const getUsers = asyncHandler(async (req, res) => {
 *   const users = await User.find();
 *   res.json(users);
 * });
 */

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
