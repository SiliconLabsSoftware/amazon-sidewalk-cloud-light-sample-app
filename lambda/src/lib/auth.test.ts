/***************************************************************************//**
 * @file
 * @brief Unit tests for Bearer Authorization validation against FRONTEND_PASSWORD.
 *******************************************************************************
 * # License
 * <b>Copyright 2026 Silicon Laboratories Inc. www.silabs.com</b>
 *******************************************************************************
 *
 * SPDX-License-Identifier: Zlib
 *
 * The licensor of this software is Silicon Laboratories Inc.
 *
 * This software is provided 'as-is', without any express or implied
 * warranty. In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 * 1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 * 2. Altered source versions must be plainly marked as such, and must not be
 *    misrepresented as being the original software.
 * 3. This notice may not be removed or altered from any source distribution.
 *
 ******************************************************************************/
import { validatePassword } from "./auth.ts";

describe("validatePassword", () => {
  const originalPassword = process.env.FRONTEND_PASSWORD;

  afterEach(() => {
    if (originalPassword === undefined) {
      delete process.env.FRONTEND_PASSWORD;
    } else {
      process.env.FRONTEND_PASSWORD = originalPassword;
    }
  });

  it("returns false when the header is undefined", () => {
    process.env.FRONTEND_PASSWORD = "secret";
    expect(validatePassword(undefined)).toBe(false);
  });

  it("returns false when the header is not Bearer format", () => {
    process.env.FRONTEND_PASSWORD = "secret";
    expect(validatePassword("Basic dGVzdA==")).toBe(false);
    expect(validatePassword("secret")).toBe(false);
    expect(validatePassword("")).toBe(false);
  });

  it("accepts Bearer prefix case-insensitively", () => {
    process.env.FRONTEND_PASSWORD = "my-token";
    expect(validatePassword("bearer my-token")).toBe(true);
    expect(validatePassword("BEARER my-token")).toBe(true);
    expect(validatePassword("Bearer my-token")).toBe(true);
  });

  it("returns false when the token does not match FRONTEND_PASSWORD", () => {
    process.env.FRONTEND_PASSWORD = "correct";
    expect(validatePassword("Bearer wrong")).toBe(false);
  });

  it("returns true when the Bearer token matches FRONTEND_PASSWORD", () => {
    process.env.FRONTEND_PASSWORD = "expected-value";
    expect(validatePassword("Bearer expected-value")).toBe(true);
  });

  it("requires at least one space after Bearer", () => {
    process.env.FRONTEND_PASSWORD = "x";
    expect(validatePassword("Bearerx")).toBe(false);
  });
});
