/***************************************************************************//**
 * @file
 * @brief Unit tests for Bearer Authorization validation against FRONTEND_PASSWORD.
 *******************************************************************************
 * # License
 * <b>Copyright 2026 Silicon Laboratories Inc. www.silabs.com</b>
 *******************************************************************************
 *
 * SPDX-License-Identifier: LicenseRef-MSLA
 *
 * The licensor of this software is Silicon Laboratories Inc. Your use of this
 * software is governed by the terms of the Silicon Labs Master Software License
 * Agreement (MSLA) available at
 * www.silabs.com/about-us/legal/master-software-license-agreement
 * By installing, copying or otherwise using this software, you agree to the
 * terms of the MSLA.
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
