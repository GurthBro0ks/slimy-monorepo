import { describe, it, expect } from "vitest";
import { getUserRole, getRoleRoute } from "@/slimy.config";

describe("Role Mapping", () => {
  it("should return admin role for admin role IDs", () => {
    const roles = ["1178129227321712701"];
    expect(getUserRole(roles)).toBe("admin");
  });

  it("should return club role for club role IDs", () => {
    const roles = ["1178143391884775444"];
    expect(getUserRole(roles)).toBe("club");
  });

  it("should return user role for unknown role IDs", () => {
    const roles = ["999999999999999999"];
    expect(getUserRole(roles)).toBe("user");
  });

  it("should return user role for empty roles", () => {
    expect(getUserRole([])).toBe("user");
  });

  it("should return correct routes for each role", () => {
    expect(getRoleRoute("admin")).toBe("/guilds");
    expect(getRoleRoute("club")).toBe("/club");
    expect(getRoleRoute("user")).toBe("/snail");
  });
});
