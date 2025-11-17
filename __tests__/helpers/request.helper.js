import request from 'supertest';
import express from 'express';
import { createAuthHeader } from './auth.helper.js';

/**
 * HTTP request helper utilities for testing
 */

/**
 * Create a test app instance with routes
 */
export function createTestApp(routes) {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  if (routes) {
    Object.entries(routes).forEach(([path, router]) => {
      app.use(path, router);
    });
  }
  
  return app;
}

/**
 * Make an authenticated GET request
 */
export async function authenticatedGet(app, url, token) {
  return request(app)
    .get(url)
    .set('Authorization', createAuthHeader(token));
}

/**
 * Make an authenticated POST request
 */
export async function authenticatedPost(app, url, token, body = {}) {
  return request(app)
    .post(url)
    .set('Authorization', createAuthHeader(token))
    .send(body);
}

/**
 * Make an authenticated PUT request
 */
export async function authenticatedPut(app, url, token, body = {}) {
  return request(app)
    .put(url)
    .set('Authorization', createAuthHeader(token))
    .send(body);
}

/**
 * Make an authenticated DELETE request
 */
export async function authenticatedDelete(app, url, token) {
  return request(app)
    .delete(url)
    .set('Authorization', createAuthHeader(token));
}

/**
 * Make an authenticated file upload request
 */
export async function authenticatedFileUpload(app, url, token, fieldName, filePath, additionalFields = {}) {
  const req = request(app)
    .post(url)
    .set('Authorization', createAuthHeader(token))
    .attach(fieldName, filePath);
  
  // Add additional form fields
  Object.entries(additionalFields).forEach(([key, value]) => {
    req.field(key, value);
  });
  
  return req;
}

/**
 * Upload a file with buffer (for multer memory storage)
 */
export async function authenticatedBufferUpload(app, url, token, fieldName, buffer, filename, additionalFields = {}) {
  const req = request(app)
    .post(url)
    .set('Authorization', createAuthHeader(token))
    .attach(fieldName, buffer, filename);
  
  // Add additional form fields
  Object.entries(additionalFields).forEach(([key, value]) => {
    req.field(key, value);
  });
  
  return req;
}

/**
 * Assert response status and return body
 */
export async function assertResponse(requestPromise, expectedStatus) {
  const response = await requestPromise;
  expect(response.status).toBe(expectedStatus);
  return response.body;
}

/**
 * Assert successful response (2xx)
 */
export async function assertSuccess(requestPromise) {
  const response = await requestPromise;
  expect(response.status).toBeGreaterThanOrEqual(200);
  expect(response.status).toBeLessThan(300);
  return response.body;
}

/**
 * Assert error response (4xx or 5xx)
 */
export async function assertError(requestPromise, expectedStatus) {
  const response = await requestPromise;
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('message');
  return response.body;
}

/**
 * Assert authentication error (401)
 */
export async function assertUnauthorized(requestPromise) {
  return assertError(requestPromise, 401);
}

/**
 * Assert forbidden error (403)
 */
export async function assertForbidden(requestPromise) {
  return assertError(requestPromise, 403);
}

/**
 * Assert not found error (404)
 */
export async function assertNotFound(requestPromise) {
  return assertError(requestPromise, 404);
}

/**
 * Assert validation error (400)
 */
export async function assertBadRequest(requestPromise) {
  return assertError(requestPromise, 400);
}
